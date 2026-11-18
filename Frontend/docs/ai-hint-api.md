# 1단원 실습 AI 조언 API (제안 계약 v1)

프론트엔드 호출 함수와 데이터 변환을 1단원 SystemLab의 실행 결과 패널에 연결했습니다.
실패한 실행이 완료된 뒤 버튼을 눌러 요청합니다. 자동 호출은 하지 않습니다.
Java에는 아직 `POST /api/ai/hint`가 없으므로 실제 답변을 받으려면 백엔드 구현이
필요합니다. 기존 퀴즈의 `/api/chat`은 그대로 사용합니다.

## 사용

```ts
import { requestHint } from '../api/hint';
import { chatErrorMessage } from '../api/chat';
import { buildHintRequest, canRequestHint } from '../systemLab/hint';

// graph와 run은 SystemLab의 현재 상태, lesson은 현재 강의입니다.
const canRequest = canRequestHint(lesson.id, graph, run);
const controller = new AbortController();
if (canRequest) {
  const payload = buildHintRequest(lesson, graph, run);
  try {
    const advice = await requestHint(payload, controller.signal);
    // advice.concept와 advice.hint를 평문으로 표시합니다.
  } catch (error) {
    if (!controller.signal.aborted) showError(chatErrorMessage(error));
  }
}
```

위 코드는 직접 호출하는 예시입니다. `showError`는 호출 화면의 오류 표시 함수입니다.
실제 화면에서는 `useSystemLabHint`가 실행별 응답을 관리하고 `HintPanel`이 표시합니다.
재실행·구성 변경·화면 이동 시 요청을 취소하고 늦은 응답을 폐기합니다.
단순 노드 이동이나 결과 패널 접기는 조언을 지우지 않습니다.
로딩 중 중복 클릭을 차단하고 성공적으로 받은 조언은 같은 실행에서 재요청하지 않습니다.
통신 오류 또는 fallback 상태에서는 다시 요청할 수 있습니다.

## 요청

정확한 TypeScript 계약은 `src/api/hint.ts`의 `HintRequest`입니다.
기존 Axios 클라이언트를 사용하므로 기본 경로는 `/api/ai/hint`, 제한 시간은
기존 AI 요청과 같은 130초입니다. 배포 환경에서는 설정된 API base URL을 따릅니다.

| 필드                     | 의미                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| schemaVersion / lessonId | `1` / `week2-workflow`만 허용                                     |
| runId / graphSignature   | 실행 ID와 실행한 구성의 식별값. 인증용 증명이 아님                |
| lesson                   | 현재 강의의 title, task(scenario), summary                        |
| requirements             | 엔진 definition의 requestIds, requiredPods                        |
| workflow.nodes           | 포함 관계, 포트, 실행 상태, 버전, Kubernetes 설정. 위치·크기 제외 |
| workflow.connections     | 사용자가 직접 구성한 연결                                         |
| workflow.serviceRoutes   | Service 라벨 설정으로 파생된 요청 경로                            |
| ruleCheck                | 엔진의 success(false), message, steps, cycle, responses           |

변환 함수는 `SystemLab`의 run 상태를 받습니다. 실행 전, 애니메이션 실행 중,
중단, 성공, 다른 단원, 구성 변경 후의 오래된 결과를 거절합니다.
순환 연결로 steps가 비어 있는 실패는 허용합니다. 변환 결과는 깊은 복사본입니다.

## #22 스키마와의 차이

#22 문서의 평면 nodes/settings/edges와 issues/firstFailure 대신 현재 SystemLab의
계층형 workflow와 전체 실행 기록을 보냅니다. 백엔드는 이 v1 계약을 별도로
구현해야 합니다. 실패·차단 상태와 순환 정보를 보존하며, 첫 failed 단계만을
근본 원인이라고 단정하지 않습니다. 조건별 판정을 새로 계산하거나 성공 판정을
바꾸지는 않습니다. 현재 엔진에 없는 전체 조건별 passed/failed 목록은 제공하지 않습니다.

## 응답

```json
{
  "status": "ok",
  "concept": "Service는 대상 라벨과 일치하는 Pod로 요청을 전달합니다.",
  "hint": "Service의 대상 라벨과 Pod 라벨이 일치하나요?"
}
```

- status: `ok` 또는 `fallback`. fallback은 재요청 가능한 정상 안내 응답입니다.
- concept: 공백이 아닌 문자열, 최대 200 Unicode 코드 포인트.
- hint: 공백이 아닌 문자열, 최대 160 Unicode 코드 포인트, `?`로 끝나는 질문.
- 성공 응답 `template`은 사용하지 않습니다. 성공 요청은 프론트에서도 전송하지 않으며
  백엔드에서도 모델 호출 전에 차단해야 합니다.
- HTTP 오류·취소는 호출자에게 전달합니다. 응답 구조 오류는 안내 Error로 반환합니다.
- 프론트 판정은 보안 검증이 아닙니다. 백엔드는 입력 크기·종류·범위를 검증하고,
  실행 정보와 노드 이름을 신뢰할 수 없는 데이터로 취급해야 합니다.

백엔드 연결 시 #22의 구조화 출력, 길이 제한, JSON 검증·재시도,
실패 근거에 기반한 설명과 정답 연결을 직접 제시하지 않는 힌트 정책을 적용합니다.
