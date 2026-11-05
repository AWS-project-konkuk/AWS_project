# Backend

프론트엔드의 JSON 요청을 vLLM Chat Completions API로 전달하고 답변을 JSON으로 반환합니다.

- Java 25 (JDK 필요)
- Spring Boot 4.1.2
- Gradle Wrapper 포함 (Gradle 별도 설치 불필요)
- Spring Web MVC, Validation

## 실행

먼저 `src/main/resources/vllm.properties` 파일에서 `vllm.base-url`과 `vllm.model`을 실제 서버 값으로 수정합니다.
인증이 필요하면 `vllm.api-key`에 값을 설정하거나 `VLLM_API_KEY` 환경변수를 사용합니다.
실제 키를 파일에 적었다면 저장소에 커밋하지 마세요.

프로젝트 루트에서 PowerShell로 실행합니다.

```powershell
cd backend
.\gradlew.bat bootRun
```

기본 포트는 `8080`입니다. API 경로는 `POST /api/chat`이며 `/` 요청의 404 응답은 정상입니다.
종료하려면 `Ctrl+C`를 누릅니다. 최초 실행 시 Gradle 및 의존성 다운로드를 위한 인터넷 연결이 필요합니다.

## 빌드 및 테스트

```powershell
.\gradlew.bat build
```

테스트는 애플리케이션 초기화와 모의 HTTP vLLM 서버를 통한 요청 전달, 응답 변환,
입력 검증, 서버 오류, 잘못된 응답, 타임아웃, CORS를 검증합니다. 실제 GPU 서버는 필요하지 않습니다.
빌드 결과는 `build/libs/`에 생성됩니다.

## API 사용

### 백엔드 프롬프트 수정

`src/main/resources/prompts/system.txt`에 원하는 지침을 UTF-8 일반 텍스트로 작성하세요.
JSON이나 따옴표 없이 여러 줄로 작성할 수 있습니다. 기본 예시는 AWS 학습 도우미입니다.
서버 시작 시 읽으며, 각 요청의 `messages` 맨 앞에 `system` 역할로 한 번 추가합니다.
사용자 질문은 그 뒤에 `user` 역할로 전달합니다. 요청 간 질문은 누적하거나 저장하지 않습니다.
빈 파일이면 백엔드 프롬프트를 추가하지 않습니다. 파일이 없거나 읽을 수 없으면 서버 시작이 실패합니다.
수정 후 재시작하고, JAR 배포 시에는 다시 빌드하세요.
파일 위치는 `vllm.properties`의 `vllm.system-prompt`에서 변경할 수 있습니다.
기존 `messages` 입력은 순서를 유지해 시스템 프롬프트 뒤에 붙습니다. 클라이언트가 보낸 system 메시지도 유지됩니다.

`POST http://localhost:8080/api/chat`, `Content-Type: application/json`

```json
{"message":"AWS EC2가 뭔지 설명해줘"}
```

대화 이력이 필요한 경우 `message` 대신 `messages`를 보냅니다. 백엔드가 이력을 저장하지는 않습니다.

```json
{"messages":[{"role":"user","content":"안녕"},{"role":"assistant","content":"안녕하세요"},{"role":"user","content":"방금 뭐라고 했지?"}]}
```

`message`와 `messages`는 동시에 보낼 수 없습니다. 각 내용은 공백이 아닌 최대 32,000자이며,
`messages`는 1~100개, 역할은 `system`, `user`, `assistant`를 지원합니다.
멀티모달 입력 및 도구 호출은 현재 지원하지 않습니다.

응답:

정상 응답과 애플리케이션 오류 JSON에 `Content-Type: application/json;charset=UTF-8`을 명시합니다.
Windows PowerShell에서도 `Invoke-RestMethod`로 한글 응답을 읽을 수 있도록 하기 위한 설정입니다.
요청 본문은 아래 예시처럼 UTF-8 바이트로 보내세요.

```json
{"answer":"AWS EC2는 ..."}
```

vLLM에는 설정된 모델과 `messages`, `stream: false`를 보내며,
응답의 `choices[0].message.content`를 `answer`로 반환합니다. 전체 원본 응답이나 스트리밍은 반환하지 않습니다.
채팅을 지원하고 chat template이 준비된 vLLM 모델이 필요합니다.

PowerShell 테스트 (백엔드를 실행한 상태에서 다른 터미널 사용):

```powershell
$body = @{ message = "AWS EC2가 뭔지 설명해줘" } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8080/api/chat' -Method Post `
  -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

## 설정 파일

vLLM 관련 설정은 `src/main/resources/vllm.properties` 한 곳에서 관리합니다.
`application.properties`의 `spring.config.import`가 이 파일을 읽습니다.

```properties
vllm.base-url=http://localhost:8000
vllm.model=your-served-model-name
vllm.api-key=${VLLM_API_KEY:}
vllm.connect-timeout=5s
vllm.read-timeout=120s
```

`vllm.model`은 실제 모델명을 모르므로 비워두었습니다. 설정 전 API 요청은 503을 반환합니다.
설정 변경 후 서버를 재시작하세요. JAR로 실행할 경우 이 파일은 JAR에 포함되므로 다시 빌드해야 합니다.
Spring의 환경변수 우선순위에 따라 기존 `VLLM_BASE_URL`, `VLLM_MODEL` 환경변수가 있으면 파일보다 우선합니다.
파일 값을 사용하려면 해당 환경변수를 제거한 터미널에서 실행하세요.

## 환경변수 (선택 사항)

| 변수 | 기본값 / 설명 |
| --- | --- |
| `SERVER_PORT` | `8080` |
| `VLLM_BASE_URL` | `http://localhost:8000` — `/v1`을 제외한 서버 주소 |
| `VLLM_MODEL` | 기본값 없음. 서버에 등록된 모델명을 반드시 지정 |
| `VLLM_API_KEY` | 기본값 없음. 설정 시 Bearer 인증 사용 |
| `VLLM_CONNECT_TIMEOUT` | `5s` |
| `VLLM_READ_TIMEOUT` | `120s` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` — 쉼표로 구분 |

환경변수 없이도 위 설정 파일로 실행할 수 있습니다. `.env` 파일은 자동으로 읽지 않습니다.
프론트엔드 포트가 다르면 `CORS_ALLOWED_ORIGINS`를 해당 출처로 설정합니다.

## 오류 응답

오류는 `{"code":"오류 코드","message":"설명"}` 형식입니다.

| HTTP | code | 의미 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | JSON 파싱 또는 입력 검증 실패 |
| 503 | `VLLM_NOT_CONFIGURED` | 모델명 미설정 |
| 502 | `VLLM_UNAVAILABLE` | vLLM 연결 실패 |
| 502 | `VLLM_UPSTREAM_ERROR` | vLLM이 오류 상태 반환 |
| 502 | `VLLM_INVALID_RESPONSE` | JSON 또는 답변 형식 오류 |
| 504 | `VLLM_TIMEOUT` | vLLM 연결/응답 시간 초과 |

이 프로젝트는 프론트엔드 파일을 수정하지 않습니다. 실제 화면에서 호출하려면 별도로 프론트엔드 연결이 필요합니다.
실제 vLLM 환경의 연결 검증은 해당 서버 주소와 모델명 설정 후 진행합니다.

## 코드 설명

각 파일의 역할과 코드 블록별 설명은 [코드 전체 해설](docs/CODE_GUIDE.md)을 참고하세요.
