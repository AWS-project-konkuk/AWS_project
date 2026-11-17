"""파이프라인 v3 최종 확인 테스트 (pipeline_v3.py)

지금까지 나온 문제가 모두 해결됐는지 한 번에 확인합니다.
  실습 힌트 48개(성공 8개는 템플릿) · 서술형 30개 + 대조군 1 + 이상한 입력 24개 · 챗봇 질문 29개 (검색 포함)

사용법 (vLLM 서버가 켜진 상태에서, 이 폴더 안에서):
    python run_v3.py            # 약 6~8분
결과: v3_<모델>.csv, v3_summary_<모델>.md
"""
import argparse
import csv
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

import requests

import pipeline_v3 as P

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
_spec = importlib.util.spec_from_file_location("v2", ROOT / "run_eval_vllm_v2.py")
v2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v2)

EXPECTED_LESSONS = {  # 정상 질문이 찾아야 하는 강의
    "w01_normal": {"canary"}, "w02_normal": {"canary", "shadow"}, "w03_normal": {"model-drift"},
    "w28_normal_long": {"recreate-release", "blue-green", "canary", "shadow", "week6-workflow"},
    "w29_normal_long": {"model-drift"},
}
REFUSE = "다루지 않는"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000")
    ap.add_argument("--limit", type=int, default=0, help="종류마다 앞에서 N개만 (동작 확인용)")
    ap.add_argument("--parts", nargs="+", default=["hint", "explain", "chat"], choices=["hint", "explain", "chat"])
    a = ap.parse_args()
    model = requests.get(f"{a.base}/v1/models", timeout=30).json()["data"][0]["id"]
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", model)
    lim = (lambda xs: xs[: a.limit]) if a.limit else (lambda xs: xs)
    retriever = P.Retriever()
    rows = []
    cols = ["task", "case_id", "kind", "expected", "result", "ok", "display", "example", "source", "retrieved",
            "tries", "fallback", "seconds", "leak", "is_question", "raw", "memo"]
    f = open(HERE / f"v3_{safe}.csv", "w", newline="", encoding="utf-8-sig")
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()

    def save(row):
        rows.append(row)
        w.writerow(row)
        f.flush()
        print(f"[{row['task']}] {row['case_id']} → {str(row.get('result', ''))[:20]} "
              f"{'O' if row.get('ok') == 'Y' else ('X' if row.get('ok') == 'N' else '')} {row.get('seconds', '')}s")

    # 1) 실습 힌트
    for c in ([] if "hint" not in a.parts else lim([json.loads(l) for l in open(ROOT / "hint_cases.jsonl", encoding="utf-8")])):
        obj, meta = P.hint(a.base, model, v2.hint_user(c), c["rule_check"]["success"], c["lesson"]["takeaway"])
        leak = "" if c["rule_check"]["success"] else v2.leak_check(obj["display"], c)
        isq = "" if c["rule_check"]["success"] else ("Y" if obj.get("hint", "").strip().endswith("?") else "N")
        save({"task": "hint", "case_id": c["case_id"], "kind": c["kind"], "display": obj["display"],
              "leak": leak, "is_question": isq, "ok": "N" if (leak or isq == "N" or meta["fallback"]) else "Y",
              "result": "템플릿" if c["rule_check"]["success"] else "힌트", **meta})

    # 2) 서술형 판정
    explains = {c["case_id"]: c for c in map(json.loads, open(ROOT / "explain_cases.jsonl", encoding="utf-8"))}
    jobs = [(f'{c["case_id"]}__{lv}', "normal", c, c["student_answers"][lv], v2.EXPECTED_VERDICT[lv])
            for c in explains.values() for lv in ["correct", "partial", "wrong"]]
    base = explains["week6-workflow__explain"]
    jobs.append(("control_correct", "control", base, base["student_answers"]["correct"], "정확"))
    weird = [json.loads(l) for l in open(HERE / "weird_inputs.jsonl", encoding="utf-8")]
    jobs += [(q["id"], q["category"], base, q["text"], "not_정확") for q in weird if not q["category"].startswith("normal")]
    for cid, kind, case, ans, exp in (lim(jobs) if "explain" in a.parts else []):
        obj, meta = P.explain(a.base, model, case, ans)
        v = obj.get("verdict")
        ok = (v != "정확") if exp == "not_정확" else (v == exp)
        save({"task": "explain", "case_id": cid, "kind": kind, "expected": exp, "result": v,
              "ok": "Y" if ok else "N", "display": obj["display"], **meta})

    # 3) 챗봇
    for q in (lim(weird) if "chat" in a.parts else []):
        obj, meta = P.chat(a.base, model, retriever, q["text"])
        got = {r.split("#")[0] for r in meta["retrieved"]}
        ok = ""
        if q["id"] in EXPECTED_LESSONS:
            ok = "Y" if got & EXPECTED_LESSONS[q["id"]] and REFUSE not in obj["answer"][:20] else "N"
        elif q["category"] == "off_topic":
            ok = "Y" if REFUSE in obj["answer"] else "N"
        save({"task": "chat", "case_id": q["id"], "kind": q["category"], "expected": q["expect"],
              "result": "답변", "ok": ok, "display": obj["answer"], "example": obj.get("example") or "null",
              "source": obj.get("source") or "null", "retrieved": " | ".join(meta["retrieved"]),
              **{k: v for k, v in meta.items() if k != "retrieved"}})
    f.close()
    summary(rows, model, HERE / f"v3_summary_{safe}.md")


def summary(rows, model, path):
    def cnt(rs, cond):
        return f"{sum(1 for r in rs if cond(r))}/{len(rs)}"

    H = [r for r in rows if r["task"] == "hint"]
    HL = [r for r in H if r["result"] == "힌트"]
    E = [r for r in rows if r["task"] == "explain"]
    EN = [r for r in E if r["kind"] == "normal"]
    EW = [r for r in E if r["kind"] not in ("normal", "control")]
    C = [r for r in rows if r["task"] == "chat"]
    conf = Counter((r["expected"], r["result"]) for r in EN)
    times = sorted(r["seconds"] for r in rows if isinstance(r.get("seconds"), (int, float)) and r["seconds"] > 0)
    fallback = [r for r in rows if r.get("fallback") is True]
    L = [f"# 파이프라인 v3 최종 확인 · {model}", "",
         "| 문제 | 해결 방법 | 이전 | v3 결과 | 목표 |", "|---|---|---|---|---|",
         f"| 답이 길어져 JSON 깨짐 | 스키마 + 칸별 상한 + 재시도 | 2/122 | 안내 문구로 대체 {len(fallback)}건 | 0 |",
         f"| 서술형 판정 정확도 | \"짧게\" 규칙 제거 + \"정확\" 예시 | 20/30 (--fix 15/30) | {cnt(EN, lambda r: r['ok'] == 'Y')} | 22/30 이상 |",
         f"| 정답을 \"정확\"으로 | 〃 | 5/10 (--fix 0/10) | {conf[('정확', '정확')]}/10 | 7/10 이상 |",
         f"| 대조군(정상 정답) | 〃 | 부분 정확 | {next((r['result'] for r in E if r['kind'] == 'control'), '-')} | 정확 |",
         f"| 이상한 입력에 \"정확\" 안 줌 | 코드 검사 + 문자 정리 | 23/24 | {cnt(EW, lambda r: r['ok'] == 'Y')} | 전부 |",
         f"| 힌트 정답 노출 | v2 프롬프트 유지 | 0/40 | {cnt(HL, lambda r: bool(r.get('leak')))} | 0 |",
         f"| 힌트 질문형(?) | 〃 | - | {cnt(HL, lambda r: r.get('is_question') == 'Y')} | 전부 |",
         f"| \"더 알고 싶다면 물어보세요\" | 후처리로 삭제 | 3/29 | {cnt(C, lambda r: bool(P.FOLLOW_UP.search(r['display'])))} | 0 |",
         f"| 예시가 답 반복 | 후처리로 삭제 | 2개 이상 | {cnt(C, lambda r: r['example'] != 'null' and P.dedupe_example(r['display'], r['example']) is None)} | 0 |",
         f"| 정상 질문이 맞는 강의를 찾음 | 본문 검색(BM25) | 본문 고정 | {cnt([r for r in C if r['case_id'] in EXPECTED_LESSONS], lambda r: r['ok'] == 'Y')} | 전부 |",
         f"| 무관한 질문 안내 | 프롬프트 | 3/3 | {cnt([r for r in C if r['kind'] == 'off_topic'], lambda r: r['ok'] == 'Y')} | 전부 |",
         f"| 출처가 검색 결과 밖 | source를 검색 결과 중에서만 고르게 강제 | - | {cnt(C, lambda r: r['source'] not in ('null',) and r['source'] not in r['retrieved'])} | 0 |",
         "", f"응답 시간: 평균 {sum(times) / len(times):.2f}초 · 최대 {times[-1]:.2f}초 · 재시도 발생 {sum(1 for r in rows if (r.get('tries') or 0) > 1)}건"
         if times else "", "",
         "## 서술형 판정 상세 (정답 → 모델)", "",
         "| 정답 \\ 모델 | 정확 | 부분 정확 | 오개념 | 실패 |", "|---|---|---|---|---|"]
    for e in ["정확", "부분 정확", "오개념"]:
        L.append(f"| {e} | {conf[(e, '정확')]} | {conf[(e, '부분 정확')]} | {conf[(e, '오개념')]} | {conf[(e, None)]} |")
    L += ["", "## 정상 질문 챗봇 답변 (내용이 강의와 맞는지 눈으로 확인)", ""]
    for r in C:
        if r["case_id"] in EXPECTED_LESSONS:
            L += [f"**{r['case_id']}** · 찾은 섹션: {r['retrieved']}", "", f"> {r['display']}", "",
                  f"example: {r['example']} · source: {r['source']}", ""]
    bad = [r for r in rows if r.get("ok") == "N"]
    L += ["## 목표에 못 미친 케이스", ""] + ([f"- [{r['task']}] {r['case_id']} ({r.get('expected', '')}) → "
                                            f"{r.get('result')} · {str(r.get('display'))[:100]}" for r in bad] or ["없음"])
    path.write_text("\n".join(L), encoding="utf-8")
    print("\n".join(L))
    print("saved:", path)


if __name__ == "__main__":
    main()
