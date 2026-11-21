# 노드 실습 AI 조언 API

프론트엔드 호출 함수와 데이터 변환을 모든 SystemLab 실습의 실행 결과 패널에 연결했습니다.
실패한 실행이 완료된 뒤 버튼을 눌러 요청합니다. 자동 호출은 하지 않습니다.
실습 조언은 백엔드의 `POST /api/chat/ai/hint`를 사용합니다.

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
기존 Axios 클라이언트를 사용하므로 기본 경로는 `/api/chat/ai/hint`, 제한 시간은
기존 AI 요청과 같은 130초입니다. 배포 환경에서는 설정된 API base URL을 따릅니다.

| 필드      | 의미                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------- |
| lessonId  | 시스템 실습이 있는 강의 ID (예: `week2-workflow`, `week3-workflow`)                             |
| nodes     | 부모 노드, 포트, 버전, Kubernetes 설정을 담은 배열. 위치와 크기는 제외                         |
| edges     | 직접 연결(`manual`)과 Service가 만든 요청 경로(`service-route`)를 담은 배열                     |
| settings  | 강의 정보, 요청 ID와 최소 Pod 수, 수집된 응답, 순환 연결, 실행 지표(`metrics`)와 관찰 조건(`observations`) |
| ruleCheck | `success: false`, 실패·차단 메시지 배열 `issues`, 첫 실패 또는 차단 근거 문자열 `first_failure` |

변환 함수는 `SystemLab`의 run 상태를 받습니다. 실행 전, 애니메이션 실행 중,
중단, 성공, 다른 단원, 구성 변경 후의 오래된 결과를 거절합니다.
순환 연결로 steps가 비어 있는 실패는 허용합니다. 변환 결과는 깊은 복사본입니다.

실행 ID와 구성 서명은 화면에서 이전 응답을 폐기하는 데 사용합니다.
`first_failure`는 실행 엔진이 처음 기록한 실패 또는 차단 메시지입니다.
순환 연결처럼 실행 단계가 없는 경우에는 전체 실패 메시지를 사용합니다.

## 응답

```json
{
  "status": "ok",
  "errorBasis": "Service 대상 라벨에 맞는 요청 입력이 없습니다.",
  "conecpt": "Service는 대상 라벨과 일치하는 Pod로 요청을 전달합니다.",
  "hint": "Service의 대상 라벨과 Pod 라벨이 일치하나요?",
  "display": "Service는 대상 라벨과 일치하는 Pod로 요청을 전달합니다. Service의 대상 라벨과 Pod 라벨이 일치하나요?"
}
```

- status: `ok` 또는 `fallback`. fallback은 재요청 가능한 정상 안내 응답입니다.
- 프론트엔드 API 함수가 백엔드의 `conecpt`를 `concept`로 변환합니다. 서버가 오타를 수정하면 `concept`도 받습니다.
- `concept`는 최대 200자, `hint`는 최대 160자이며 `?`로 끝나는 질문입니다.
- 화면은 `concept`와 `hint`를 따로 표시합니다.
- 성공한 실습에서는 조언 요청을 보내지 않습니다.
- HTTP 오류·취소는 호출자에게 전달합니다. 응답 구조 오류는 안내 Error로 반환합니다.
