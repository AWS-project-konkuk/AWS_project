"""BlockML LLM 모델 비교 스크립트 v2 (vLLM, OpenAI 호환 API)

v1 실험에서 드러난 문제를 반영한 버전입니다.
  1) 성공 케이스 환각      → 성공이면 LLM을 부르지 않고 정해진 문구 사용
  2) 서술형 판정이 늘 "정확" → JSON 스키마로 판정 값을 3개 중 하나로 강제 + 비교를 먼저 쓰게 함
  3) 정답 노출              → 좋은 힌트 예시(few-shot) 추가 + 출력에서 정답 노출 자동 검사
  4) 지표에 끌려감          → 연결 오류가 있으면 metrics를 입력에서 제거
  5) 질문형 힌트 미준수      → hint 필드를 따로 받아 물음표로 끝나는지 검사

사용법 (vLLM 서버가 켜진 상태에서):
    python run_eval_vllm_v2.py --limit 5     # 동작 확인
    python run_eval_vllm_v2.py               # 전체 실행

결과: results_v2_<모델>.csv + 마지막에 자동 집계 요약 출력
"""
import argparse
import csv
import json
import re
import time

import requests

# ───────────────────────── 힌트 ─────────────────────────

HINT_SYSTEM = """너는 MLOps 학습 사이트 BlockML의 실습 튜터다. 학습자가 노드를 연결한 실습에서 실패한 이유를 설명하고 힌트를 준다.

규칙:
1. rule_check.issues와 rule_check.first_failure만 판단 근거로 쓴다. 거기에 없는 문제를 새로 만들지 마라.
2. 정답을 절대 직접 말하지 마라. 금지 예: "A의 출력을 B에 연결하세요", "A → B", "태그를 v2로 바꾸세요".
3. concept: 왜 문제가 되는지 개념을 1~2문장으로 설명한다. lesson.takeaway와 노드의 purpose에 근거한다.
4. hint: 학습자가 스스로 답을 찾도록 하는 질문 1문장. 반드시 물음표(?)로 끝낸다.
5. 노드·포트 이름은 입력에 나온 이름만 사용한다. 한국어 존댓말을 쓴다.

좋은 예시 1
상황: 'EC2 학습 작업'에 '데이터' 입력이 없음
{"error_basis": "EC2 학습 작업에 '데이터' 입력이 없습니다.", "concept": "EC2는 계산을 하는 곳이라, 학습에 쓸 데이터를 다른 곳에서 받아 와야 실행할 수 있어요.", "hint": "학습 데이터는 처음에 어디에 보관되어 있었을까요?"}

좋은 예시 2
상황: 모델 파일(model)을 '데이터' 입력에 연결해 자료 종류가 다름
{"error_basis": "모델 파일(model)은 데이터(data) 입력과 자료 종류가 다릅니다.", "concept": "학습 작업은 원본 데이터를 읽어 모델을 만드는 단계라서, 이미 만들어진 모델 파일은 입력이 될 수 없어요.", "hint": "이 단계가 처음 받아야 하는 자료는 모델일까요, 원본 데이터일까요?"}

나쁜 예시 (정답 노출, 금지)
{"concept": "...", "hint": "원본 데이터 S3의 출력을 EC2 학습 작업의 데이터 입력에 연결하세요."}"""

HINT_SCHEMA = {
    "type": "object",
    "properties": {
        "error_basis": {"type": "string"},
        "concept": {"type": "string"},
        "hint": {"type": "string"},
    },
    "required": ["error_basis", "concept", "hint"],
}

SUCCESS_TEMPLATE = "모든 단계가 성공했어요! 이번 실습의 핵심은 다음과 같아요. {takeaway}"

# ─────────────────────── 서술형 피드백 ───────────────────────

EXPLAIN_SYSTEM = """너는 MLOps 학습 사이트 BlockML의 튜터다. 학습자가 이해 확인 질문에 직접 쓴 설명(student_answer)을 평가한다.

평가 순서:
1. compare: student_answer가 correct_option·explanation의 핵심과 무엇이 같고 무엇이 빠졌는지, 틀린 주장이 있는지 먼저 비교한다.
2. verdict: 비교 결과로 판정한다.
   - "정확": 핵심 이유를 맞게 설명했고 틀린 주장이 없다.
   - "부분 정확": 방향은 맞지만 핵심 이유가 빠졌거나 너무 막연하다.
   - "오개념": 틀린 주장을 하거나 오답 보기와 같은 생각을 한다.
3. feedback: 학습자에게 보여줄 말. 맞은 점을 먼저 짚고, 빠졌거나 틀린 핵심을 1~2문장으로 알려준다. 한국어 존댓말.

explanation에 없는 내용을 사실처럼 덧붙이지 마라. 틀린 주장을 "맞다"고 하지 마라.

예시 (부분 정확)
student_answer: "S3에 저장하면 된다."
{"compare": "S3에 저장한다는 방향은 맞지만, 계산은 EC2가 하고 S3는 보관만 한다는 핵심 구분이 빠졌다.", "verdict": "부분 정확", "feedback": "S3에 저장한다는 점은 맞아요. 다만 계산은 EC2가 하고 S3는 보관만 한다는 역할 구분까지 설명하면 완벽해요."}

예시 (오개념)
student_answer: "S3가 저장된 코드를 실행해서 모델을 학습한다."
{"compare": "S3는 저장만 하고 실행하지 않는다는 explanation과 반대되는 주장을 했다.", "verdict": "오개념", "feedback": "S3는 파일을 보관하는 곳이라 코드를 실행하지 않아요. 학습 계산은 어느 서비스가 담당할지 다시 생각해 보세요."}"""

EXPLAIN_SCHEMA = {
    "type": "object",
    "properties": {
        "compare": {"type": "string"},
        "verdict": {"type": "string", "enum": ["정확", "부분 정확", "오개념"]},
        "feedback": {"type": "string"},
    },
    "required": ["compare", "verdict", "feedback"],
}

EXPECTED_VERDICT = {"correct": "정확", "partial": "부분 정확", "wrong": "오개념"}

# ───────────────────────── 입력 만들기 ─────────────────────────


def hint_user(case):
    rc = dict(case["rule_check"])
    # 연결 오류가 있으면 지표(metrics)는 판단을 흐리므로 뺀다. 설정 실패(issues 없음)일 때만 남긴다.
    if rc.get("issues"):
        rc.pop("metrics", None)
    rc.pop("headline", None)
    keep = {
        "lesson": case["lesson"],
        "nodes": case["nodes"],
        "settings": case["settings"],
        "edges": case["edges"],
        "rule_check": rc,
    }
    return "실습 상태:\n" + json.dumps(keep, ensure_ascii=False, indent=1)


def explain_user(case, level):
    keep = {
        "question": case["question"],
        "correct_option": case["correct_option"],
        "wrong_option": case["options"][1],
        "explanation": case["explanation"],
        "student_answer": case["student_answers"][level],
    }
    return json.dumps(keep, ensure_ascii=False, indent=1)


# ───────────────────────── 정답 노출 검사 ─────────────────────────


def leak_check(text, case):
    """힌트에 정답 연결이 그대로 들어 있는지 단순 규칙으로 검사한다."""
    reasons = []
    if "→" in text or "->" in text:
        reasons.append("화살표")
    titles = [n["title"] for n in case["nodes"]]
    if re.search(r"(연결하세요|연결해 ?주세요|연결해야 합니다|연결해 ?보세요)", text):
        named = [t for t in titles if t in text]
        if named or re.search(r"(출력|포트)을", text):
            reasons.append("연결 지시")
    if re.search(r"(로 바꾸세요|로 수정하세요|로 변경하세요|로 설정하세요|로 맞추세요)", text):
        reasons.append("설정값 지시")
    return ", ".join(reasons)


# ───────────────────────── 호출 ─────────────────────────


def call(base, model, system, user, schema, name, max_tokens, no_think, schema_mode):
    body = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0,
        "max_tokens": max_tokens,
    }
    if no_think:
        body["chat_template_kwargs"] = {"enable_thinking": False}
    if schema_mode == "schema":
        body["response_format"] = {"type": "json_schema", "json_schema": {"name": name, "schema": schema}}
    else:
        body["response_format"] = {"type": "json_object"}
    t = time.time()
    r = requests.post(f"{base}/v1/chat/completions", json=body, timeout=600)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
    d = r.json()
    wall = time.time() - t
    text = re.sub(r"<think>.*?</think>", "", d["choices"][0]["message"].get("content") or "", flags=re.S).strip()
    ntok = d.get("usage", {}).get("completion_tokens", 0)
    return text, round(wall, 2), ntok, round(ntok / wall, 1) if wall else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--max-tokens", type=int, default=512)
    ap.add_argument("--think", action="store_true", help="추론 모드를 끄지 않고 실행")
    ap.add_argument("--json-object", action="store_true",
                    help="json_schema가 에러 나면 이 옵션으로 실행 (판정 값 강제가 약해짐)")
    a = ap.parse_args()
    schema_mode = "object" if a.json_object else "schema"

    model = requests.get(f"{a.base}/v1/models", timeout=30).json()["data"][0]["id"]
    print("서버 모델:", model, "| 출력 형식:", schema_mode)

    hints = [json.loads(l) for l in open("hint_cases.jsonl", encoding="utf-8")]
    explains = [json.loads(l) for l in open("explain_cases.jsonl", encoding="utf-8")]
    jobs = [("hint", c, None) for c in hints]
    jobs += [("explain", c, lv) for c in explains for lv in ["correct", "partial", "wrong"]]
    if a.limit:
        jobs = jobs[: a.limit]

    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", model)
    out = f"results_v2_{safe}.csv"
    stat = {"llm_calls": 0, "template": 0, "json_fail": 0, "leak": 0, "hint_q": 0, "hint_n": 0,
            "verdict_ok": 0, "verdict_n": 0, "times": []}
    confusion = {}

    with open(out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["model", "case_id", "task", "kind_or_level", "display", "raw_json", "seconds", "out_tokens",
                    "tokens_per_sec", "json_ok", "leak_check", "hint_is_question", "verdict", "expected_verdict",
                    "verdict_ok", "score_정확성", "score_정답비노출", "score_한국어", "score_도움됨", "memo"])
        call(a.base, model, "ping", "ping", {"type": "object"}, "ping", 8, not a.think, "object")
        for i, (task, c, lv) in enumerate(jobs, 1):
            if task == "hint":
                cid, tag = c["case_id"], c["kind"]
                if c["rule_check"]["success"]:
                    display = SUCCESS_TEMPLATE.format(takeaway=c["lesson"]["takeaway"])
                    stat["template"] += 1
                    w.writerow([model, cid, task, tag, display, "", 0, 0, 0, "", "", "", "", "", "",
                                "", "", "", "", "성공 → 템플릿(LLM 호출 안 함)"])
                    print(f"{i}/{len(jobs)} {cid} 템플릿")
                    continue
                system, user, schema, name = HINT_SYSTEM, hint_user(c), HINT_SCHEMA, "hint"
            else:
                cid, tag = f'{c["case_id"]}__{lv}', lv
                system, user, schema, name = EXPLAIN_SYSTEM, explain_user(c, lv), EXPLAIN_SCHEMA, "feedback"
            try:
                raw, sec, ntok, tps = call(a.base, model, system, user, schema, name,
                                           a.max_tokens, not a.think, schema_mode)
            except Exception as e:  # noqa: BLE001
                w.writerow([model, cid, task, tag, f"ERROR: {e}"] + [""] * 15)
                print(f"{i}/{len(jobs)} {cid} ERROR {e}")
                continue
            stat["llm_calls"] += 1
            stat["times"].append(sec)
            try:
                obj = json.loads(raw)
                ok = "Y"
            except Exception:  # noqa: BLE001
                obj, ok = {}, "N"
                stat["json_fail"] += 1
            leak = isq = verdict = exp = vok = ""
            if task == "hint":
                display = f'{obj.get("concept", "")} {obj.get("hint", "")}'.strip() or raw
                leak = leak_check(display, c)
                isq = "Y" if obj.get("hint", "").strip().endswith("?") else "N"
                stat["hint_n"] += 1
                stat["leak"] += bool(leak)
                stat["hint_q"] += isq == "Y"
            else:
                display = obj.get("feedback", "") or raw
                verdict, exp = obj.get("verdict", ""), EXPECTED_VERDICT[lv]
                vok = "Y" if verdict == exp else "N"
                stat["verdict_n"] += 1
                stat["verdict_ok"] += vok == "Y"
                confusion[(exp, verdict)] = confusion.get((exp, verdict), 0) + 1
            w.writerow([model, cid, task, tag, display, raw, sec, ntok, tps, ok, leak, isq, verdict, exp, vok,
                        "", "", "", "", ""])
            f.flush()
            print(f"{i}/{len(jobs)} {cid} {sec}s {tps}tok/s" + (f" [노출:{leak}]" if leak else "")
                  + (f" [판정 {verdict}/{exp}]" if verdict else ""))

    t = sorted(stat["times"])
    print("\n──────── 요약 ────────")
    print("모델:", model)
    if t:
        print(f"응답 시간: 평균 {sum(t)/len(t):.2f}s · 중앙값 {t[len(t)//2]:.2f}s · 최대 {t[-1]:.2f}s")
    print(f"성공 케이스 템플릿 처리: {stat['template']}건 (LLM 호출 안 함)")
    print(f"JSON 파싱 실패: {stat['json_fail']} / {stat['llm_calls']}")
    if stat["hint_n"]:
        print(f"힌트 정답 노출 의심: {stat['leak']} / {stat['hint_n']}")
        print(f"힌트가 질문형(?): {stat['hint_q']} / {stat['hint_n']}")
    if stat["verdict_n"]:
        print(f"서술형 판정 정확도: {stat['verdict_ok']} / {stat['verdict_n']}")
        for exp in ["정확", "부분 정확", "오개념"]:
            row = {v: n for (e, v), n in confusion.items() if e == exp}
            print(f"  정답 {exp:5s} → 모델 판정 {row}")
    print("saved:", out)


if __name__ == "__main__":
    main()
