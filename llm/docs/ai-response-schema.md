# AI 응답 JSON 스키마와 화면 표시 가이드

프론트·백엔드가 AI 응답을 주고받는 형식입니다. 응답 형식 테스트(`llm/docs/BlockML_LLM_응답형식_테스트보고서.docx`)에서 검증한 스키마를 기준으로 했습니다.

- **AI 판단 로직**: `llm/blockml-llm-testset/format_test/pipeline_v3.py` (백엔드로 옮길 파이썬 구현)
- **원칙**: 프롬프트는 백엔드가 만들고, 프론트는 **필요한 값만 보내고 정해진 칸을 그대로 표시**합니다. AI 응답은 항상 평문이라 마크다운 렌더러가 필요 없습니다.

---

> 아래 응답 예시 문장은 형식을 보여 주기 위한 것으로, 실제 문장은 AI가 매번 생성합니다.

## 0. 지금 구조와 바뀌는 점

| | 지금 (main) | 바뀐 뒤 |
|---|---|---|
| API | `POST /api/chat` 하나 | 용도별 3개: `/api/ai/explain`, `/api/ai/hint`, `/api/ai/chat` |
| 프롬프트 | 프론트(`useQuizAi.ts`의 `buildQuizMessage`)가 문장으로 만들어 보냄 | 백엔드가 만듦. 프론트는 값만 보냄 |
| 응답 | `{ "answer": "평문 전체" }` | 칸이 나뉜 JSON (아래) |
| 화면 | 답변 문자열을 그대로 표시 | 칸별로 다른 모양으로 표시 |

`/api/chat`은 새 API가 붙을 때까지 그대로 둡니다.

---

## 1. 서술형 피드백 — `POST /api/ai/explain`

학습자가 이해 확인 퀴즈에서 고른 보기와 이유를 보내면 판정과 피드백을 돌려줍니다. (지금 `useQuizAi.ts`가 하는 일)

### 요청

```json
{
  "lessonId": "week6-workflow",
  "question": "Shadow에서 새 모델로 복제 요청 100건을 보냈다면 신규 사용자 응답 수는?",
  "options": ["0건. 사용자 응답은 기존 모델이 담당한다.", "100건. 복제 비율이 사용자 응답 비율과 같다."],
  "correct": 0,
  "explanation": "요청 복제와 사용자 응답 전환은 다른 관계입니다. 관측 후 승격 여부를 별도로 결정합니다.",
  "selected": 0,
  "reason": "0건이다. Shadow는 요청을 복제해서 새 모델로 보내지만 사용자에게는 기존 모델의 응답만 전달한다."
}
```

값은 지금 `lesson.assessment`에 있는 것 그대로입니다. `reason`은 32,000자 제한을 유지합니다.

### 응답

```json
{
  "status": "ok",
  "verdict": "정확",
  "display": "correct",
  "feedback": "Shadow가 요청만 복제하고 사용자 응답은 기존 모델이 담당한다는 점을 정확히 이해하셨어요."
}
```

| 칸 | 값 | 설명 |
|---|---|---|
| `status` | `"ok"` · `"blocked"` · `"fallback"` | 아래 "상태별 표시" 참고 |
| `verdict` | `"정확"` · `"부분 정확"` · `"오개념"` · `null` | 내부 기록용 3단계 판정. `ok`일 때만 값이 있음 |
| `display` | `"correct"` · `"needs_work"` · `null` | **화면 표시용**. 정확 → `correct`, 부분 정확·오개념 → `needs_work` |
| `feedback` | 문자열 (최대 250자) | 학습자에게 보여줄 문장. 모든 상태에서 값이 있음 |

> 부분 정확과 오개념은 AI가 서로 헷갈리는 경우가 있어(테스트 4/30) 화면에서는 둘 다 "보완이 필요해요"로 묶어 보여 줍니다. 3단계 판정은 `verdict`로 기록만 합니다.

### 상태별 예시

```json
{ "status": "ok", "verdict": "오개념", "display": "needs_work",
  "feedback": "GPU 두 장의 메모리가 자동으로 합쳐지지는 않아요. 데이터 병렬에서는 각 GPU에 모델 전체가 복제된다는 점을 다시 생각해 보세요." }

{ "status": "blocked", "verdict": null, "display": null,
  "feedback": "답안에 채점 결과를 지정하는 문장이 있어요. 선택한 이유를 내 말로 다시 써 주세요." }

{ "status": "fallback", "verdict": null, "display": null,
  "feedback": "지금은 답안을 평가하지 못했어요. 잠시 후 다시 제출해 주세요." }
```

### 화면 표시

| 상태 | 표시 |
|---|---|
| `ok` + `correct` | 초록 배지 **"정확해요"** + `feedback` |
| `ok` + `needs_work` | 주황 배지 **"보완이 필요해요"** + `feedback` |
| `blocked` | 회색 안내 박스에 `feedback`. 입력칸은 그대로 두어 다시 쓸 수 있게 |
| `fallback` | 회색 안내 박스에 `feedback` + **다시 요청** 버튼 |

```
┌──────────────────────────────────────────┐
│ [보완이 필요해요]                          │
│ GPU 두 장의 메모리가 자동으로 합쳐지지는   │
│ 않아요. 데이터 병렬에서는 ...              │
└──────────────────────────────────────────┘
```

---

## 2. 실습 힌트 — `POST /api/ai/hint`

노드 실습에서 실행 결과가 실패했을 때 "왜 틀렸는지"를 설명합니다. **틀린 연결은 막지 않고**(11/7 회의 결정) 실행 후 이 API를 부릅니다. 무엇이 틀렸는지는 규칙 엔진(`workflowIssues`, `runWorkflow`)이 판정하고, AI는 그 결과를 근거로 설명만 합니다.

### 요청

```json
{
  "lesson": {
    "title": "GPU 두 장으로 큰 모델 학습하기",
    "task": "모델·데이터를 할당하고 워커의 출력을 연결하세요. ...",
    "takeaway": "GPU 수의 합계와 한 장에 필요한 메모리는 다릅니다. 무엇을 분할하고 어떤 결과를 주고받는지가 전략을 결정합니다."
  },
  "nodes": [ { "title": "GPU 워커 2", "purpose": "...", "inputs": ["할당 작업"], "outputs": ["워커 결과"] } ],
  "settings": { "병렬 방식": "데이터 병렬" },
  "edges": ["작업 분배.워커 1 작업 → GPU 워커 1.할당 작업"],
  "ruleCheck": {
    "success": false,
    "issues": ["GPU 워커 2에 '할당 작업' 입력이 없습니다.", "결과 동기화에 '워커 1 결과' 입력이 없습니다."],
    "firstFailure": { "node": "GPU 워커 2", "reason": "GPU 워커 2에 '할당 작업' 입력이 없습니다.", "fix": "연결의 자료 종류·방향·빠진 입력을 확인하세요." }
  }
}
```

`ruleCheck`는 규칙 엔진 결과 그대로입니다. 성공(`success: true`)이어도 보내면 됩니다. 백엔드가 AI를 부르지 않고 정해진 문구를 돌려줍니다.

### 응답

```json
{
  "status": "ok",
  "concept": "GPU 워커는 할당받은 작업이 있어야 계산을 시작할 수 있어요. 두 워커가 모두 작업을 받아야 결과를 동기화할 수 있습니다.",
  "hint": "GPU 워커 2는 처리할 작업을 어디서 받아야 할까요?"
}
```

| 칸 | 값 | 설명 |
|---|---|---|
| `status` | `"ok"` · `"template"` · `"fallback"` | `template` = 실습 성공 (AI 호출 없음) |
| `concept` | 문자열 (최대 200자) | 왜 문제인지 개념 설명 |
| `hint` | 문자열 (최대 160자) 또는 `null` | 스스로 찾게 하는 질문. 항상 `?`로 끝남. `template`이면 `null` |

정답 연결("A를 B에 연결하세요")은 **절대 포함되지 않습니다** (테스트 0/40).

### 상태별 예시

```json
{ "status": "template", "concept": "모든 단계가 성공했어요! 이번 실습의 핵심은 다음과 같아요. GPU 수의 합계와 한 장에 필요한 메모리는 다릅니다.", "hint": null }

{ "status": "fallback", "concept": "지금은 힌트를 만들지 못했어요.", "hint": "실행 결과의 실패 단계 설명을 다시 읽어 볼까요?" }
```

### 화면 표시

- 실행 결과의 실패 단계 아래에 표시합니다.
- `concept`는 일반 본문 글자로 보여 줘요.
- `hint`는 강조 박스에 넣어요(예: 노란 배경 + 전구 아이콘, `lucide-react`의 `Lightbulb`).
- `template`이면 초록 성공 박스에 `concept`만 보여 줘요.

```
✕ 실패: GPU 워커 2
  GPU 워커는 할당받은 작업이 있어야 계산을 시작할 수 있어요. ...
  ┌──────────────────────────────────────────────┐
  │ 💡 GPU 워커 2는 처리할 작업을 어디서 받아야 할까요? │
  └──────────────────────────────────────────────┘
```

---

## 3. 학습 질문 챗봇 — `POST /api/ai/chat`

학습자가 강의 내용을 질문합니다. 백엔드가 사이트 강의 본문(`lessons_index.json`, 강의 54개)에서 관련 섹션을 찾아 그 내용만 근거로 답합니다.

### 요청

```json
{ "question": "Shadow 배포와 Canary 배포는 뭐가 달라요?", "lessonId": "canary" }
```

`lessonId`는 지금 보고 있는 강의(선택). 검색할 때 참고만 합니다.

### 응답

```json
{
  "status": "ok",
  "answer": "Shadow는 요청을 복제해 새 모델과 기존 모델의 응답을 비교하지만, 사용자에게는 기존 모델의 응답만 전달합니다. Canary는 일부 사용자에게 새 모델의 응답을 직접 전달해 실제 영향을 확인합니다.",
  "example": null,
  "source": { "lessonId": "shadow", "lessonTitle": "Shadow: 요청은 복제, 응답은 기존 모델", "heading": "개념 이해" }
}
```

| 칸 | 값 | 설명 |
|---|---|---|
| `status` | `"ok"` · `"fallback"` | |
| `answer` | 문자열 (최대 600자, 6문장 이내) | 강의와 무관한 질문이면 "이 강의에서는 다루지 않는 내용이에요." |
| `example` | 문자열 (최대 150자) 또는 `null` | 답과 겹치지 않는 비유가 있을 때만 |
| `source` | `{ lessonId, lessonTitle, heading }` 또는 `null` | 근거가 된 강의 섹션. 무관한 질문이면 `null` |

### 화면 표시

- `answer`는 본문으로 보여 줘요.
- `example`이 `null`이 아니면 그 아래 옅은 박스에 "예를 들면" 제목과 함께 보여 줘요.
- `source`가 있으면 맨 아래에 작은 글씨로 "출처: {lessonTitle} › {heading}"을 보여 주고, 누르면 그 강의로 이동하게 해요.
- 답 아래에 **"더 자세히"** 버튼을 둬요. 누르면 `"{직전 질문}에 대해 더 자세히 설명해 주세요"`로 다시 요청해요.

> AI는 "더 알고 싶다면 물어보세요" 같은 문장을 쓰지 않도록 되어 있습니다(테스트 0/29). 이 역할은 "더 자세히" 버튼이 맡습니다.

---

## 4. 공통 규칙

- **글자는 텍스트로만 표시**: 모든 칸은 평문입니다. `dangerouslySetInnerHTML`이나 마크다운 렌더러를 쓰지 마세요.
- **에러 처리**: HTTP 에러(타임아웃 504, 서버 준비 안 됨 503 등)는 지금 `chatErrorMessage()`를 그대로 씁니다. 200 응답의 `fallback`은 에러가 아니라 정상 응답입니다.
- **응답 시간**: 평균 약 3초, 최대 약 10초(챗봇 긴 질문). 로딩 표시가 필요합니다. 지금 타임아웃(130초)은 유지해도 됩니다.
- **글자 수 상한**: 위 표의 최대 글자 수는 백엔드가 보장합니다. 박스 크기를 정할 때 참고하세요.

## 5. TypeScript 타입 (프론트용)

```ts
export type ExplainResponse = {
  status: 'ok' | 'blocked' | 'fallback';
  verdict: '정확' | '부분 정확' | '오개념' | null;
  display: 'correct' | 'needs_work' | null;
  feedback: string;
};

export type HintResponse = {
  status: 'ok' | 'template' | 'fallback';
  concept: string;
  hint: string | null;
};

export type ChatResponse = {
  status: 'ok' | 'fallback';
  answer: string;
  example: string | null;
  source: { lessonId: string; lessonTitle: string; heading: string } | null;
};
```

## 6. 작업 순서 제안

1. **백엔드**: 위 3개 API를 만들고, 처음에는 고정 예시 응답을 돌려주게 해서 프론트가 먼저 화면을 만들 수 있게 함
2. **프론트**: 서술형 피드백(`useQuizAi.ts`)부터 새 API와 표시 방식으로 교체 → 실습 힌트 → 챗봇
3. **백엔드**: `pipeline_v3.py` 로직(프롬프트, 스키마, 코드 처리, 검색)을 Java로 옮겨 실제 vLLM과 연결
4. **LLM 담당**: 연결 후 같은 테스트셋으로 다시 확인
