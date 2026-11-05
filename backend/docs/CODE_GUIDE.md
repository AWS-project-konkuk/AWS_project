# 백엔드 코드 전체 해설

## 추가된 시스템 프롬프트 기능

`src/main/resources/prompts/system.txt`는 AI에게 전달할 지침 파일입니다. UTF-8 텍스트로 자유롭게 수정합니다.
`vllm.properties`의 `vllm.system-prompt=classpath:prompts/system.txt`가 읽을 위치를 지정합니다.

`VllmClient` 생성자는 Spring의 `Resource`로 파일을 주입받습니다.
`getContentAsString(StandardCharsets.UTF_8).strip()`으로 읽어 앞뒤 공백을 제거하고
`private final String systemPrompt`에 저장합니다. 파일을 읽을 수 없으면 `IOException`으로 시작이 실패합니다.
파일을 매 요청 다시 읽지는 않으므로 수정 후 서버 재시작이 필요합니다.

`complete()`에서는 매번 `new ArrayList<ChatRequest.Message>()`를 만들어 요청 전용 목록을 준비합니다.
프롬프트가 비어 있지 않으면 `new ChatRequest.Message("system", systemPrompt)`를 먼저 추가합니다.
그다음 `messages.addAll(request.conversation())`으로 이번 요청의 질문이나 이력을 붙이고,
`.body(Map.of("model", model, "messages", messages, "stream", false))`로 전달합니다.
원본 요청 목록은 수정하지 않으며 이전 요청을 누적하지 않습니다. 빈 프롬프트 파일은 추가 지침을 끄는 용도로 사용할 수 있습니다.

아래 기존 설명에서 `request.conversation()`은 입력을 정규화하는 단계이고,
실제 전송 목록은 이제 시스템 프롬프트와 해당 입력을 합친 `messages`입니다.
예를 들어 최종 전송은 `{"messages":[{"role":"system","content":"파일의 지침"},{"role":"user","content":"질문"}],"model":"설정한 모델명","stream":false}` 형태입니다.

테스트는 별도의 `src/test/resources/prompts/test-system.txt`를 사용하므로 사용자가 실제 프롬프트를 수정해도 테스트 문구는 유지됩니다.
`forwardsQuestionAndReturnsAnswer`는 프롬프트의 역할, 한글과 줄바꿈, 질문 위치를 확인합니다.
`forwardsConversationHistory`는 프롬프트 뒤에 원래 대화가 순서대로 유지되는지 확인합니다.
`doesNotAccumulateMessagesAcrossRequests`는 두 번 요청해도 각각 시스템 메시지와 해당 질문만 전송되는지 확인합니다.

## 1. 요청이 처리되는 순서

```text
프론트엔드 POST /api/chat
  → Spring이 JSON을 ChatRequest로 변환하고 검증
  → ChatController.chat()
  → VllmClient.complete()
  → vLLM POST /v1/chat/completions
  → vLLM JSON을 Completion 객체로 변환
  → 첫 번째 답변 문자열 추출
  → ChatResponse 객체 생성
  → Spring이 {"answer":"..."} JSON으로 반환

검증 실패 또는 통신 오류
  → ApiExceptionHandler
  → HTTP 오류 상태와 {"code":"...","message":"..."} 반환
```

Spring Boot 서버와 vLLM 서버는 별도 프로세스입니다. Java에서 모델을 직접 실행하지 않고 HTTP로 호출합니다.
현재는 비스트리밍 방식이라 답변 전체가 도착할 때까지 기다립니다. DB에 대화를 저장하지 않습니다.

## 2. 디렉터리와 파일 역할

Java 파일은 `src/main/java/com/awsproject/backend/` 아래에 있습니다.

| 파일 | 역할 |
| --- | --- |
| `BackendApplication.java` | 애플리케이션 시작 |
| `chat/ChatRequest.java` | 입력 데이터 형식과 유효성 검사 |
| `chat/ChatController.java` | 프론트엔드 HTTP 요청 접수 및 응답 |
| `chat/VllmClient.java` | vLLM HTTP 호출과 답변 추출 |
| `chat/VllmException.java` | vLLM 관련 오류 정보 전달 |
| `chat/ApiExceptionHandler.java` | 예외를 오류 JSON으로 변환 |
| `config/WebConfig.java` | 브라우저 CORS 허용 설정 |
| `src/main/resources/application.properties` | 백엔드 공통 설정 |
| `src/main/resources/vllm.properties` | vLLM 접속 설정 |
| `src/test/java/com/awsproject/backend/BackendApplicationTests.java` | 시작 검증 |
| `src/test/java/com/awsproject/backend/ChatApiTests.java` | API 및 모의 vLLM 연동 검증 |
| `build.gradle` | Java 버전, 라이브러리, 빌드 설정 |
| `settings.gradle` | Gradle 프로젝트 이름 |

## 3. Java 문법과 Spring 공통 요소

- `package`: 클래스가 속한 이름 공간입니다. 폴더 구조와 대응합니다.
- `import`: 다른 패키지의 타입을 짧은 이름으로 쓰도록 가져옵니다. `*`는 해당 패키지의 타입들을 대상으로 합니다. 파일을 실행하는 명령이 아닙니다.
- `public`: 다른 클래스에서도 접근할 수 있습니다. `private`은 해당 클래스 내부로 접근을 제한합니다.
- `final`: 필드에 저장한 참조를 다시 대입하지 못하게 합니다. 참조한 객체의 모든 내용이 불변이라는 뜻은 아닙니다.
- `record`: 데이터를 담는 타입입니다. 생성자, 필드 접근 메서드, 값 비교 등을 Java가 만들어줍니다. 예를 들어 `ChatResponse(String answer)`에는 `answer()`가 생깁니다.
- `@...`: 어노테이션입니다. Spring이나 검증 라이브러리가 이 표시를 읽고 동작을 정합니다.
- 생성자 주입: Spring이 필요한 객체를 생성자 인자로 전달합니다. Controller가 직접 `new VllmClient(...)`를 작성할 필요가 없습니다.
- JSON 변환: HTTP 본문의 JSON과 Java 객체 사이 변환은 Spring의 메시지 변환기가 처리합니다.

## 4. BackendApplication.java

`@SpringBootApplication`은 자동 설정과 컴포넌트 검색을 활성화합니다. 이 클래스의 패키지와 하위 패키지에서 Controller, Client, 설정 클래스 등을 찾습니다.

`public static void main(String[] args)`는 Java 프로그램 시작점입니다. `static`이므로 객체를 먼저 만들 필요가 없습니다. `args`는 실행 인자입니다.

`SpringApplication.run(BackendApplication.class, args)`가 Spring 컨테이너와 내장 웹 서버를 시작합니다. `.class`는 해당 클래스에 대한 타입 정보를 넘기는 표현입니다.

## 5. application.properties와 vllm.properties

`application.properties`의 각 줄:

- `spring.application.name=backend`: 애플리케이션 이름입니다.
- `server.port=${SERVER_PORT:8080}`: `SERVER_PORT`가 있으면 사용하고, 없으면 8080에서 요청을 받습니다.
- `spring.config.import=classpath:vllm.properties`: 실행 클래스패스에 포함된 별도 설정 파일을 읽습니다. `src/main/resources`의 파일들이 빌드 시 클래스패스에 복사됩니다.
- `app.cors.allowed-origins=...`: 프론트엔드 출처 목록입니다. 환경변수가 없으면 로컬 Vite 주소 두 개를 사용합니다.

`vllm.properties`의 각 줄:

```properties
vllm.base-url=http://localhost:8000
vllm.model=
vllm.api-key=${VLLM_API_KEY:}
vllm.connect-timeout=5s
vllm.read-timeout=120s
```

- `base-url`: vLLM 서버의 주소입니다. `/v1` 경로는 코드에서 추가하므로 여기에 넣지 않습니다.
- `model`: vLLM이 제공하는 정확한 모델명입니다. 빈 값은 미설정을 뜻하며, 요청 시 503으로 안내합니다.
- `api-key`: 인증 키입니다. 기본 표현은 환경변수가 있으면 그 값을, 없으면 빈 문자열을 사용합니다. 파일에 직접 지정할 수도 있지만 실제 키를 저장소에 커밋하지 않아야 합니다.
- `connect-timeout`: 연결 수립을 기다리는 제한 시간입니다.
- `read-timeout`: HTTP 요청의 응답을 기다리는 제한 시간입니다.
- `#`로 시작하는 줄은 주석이며 설정에 영향을 주지 않습니다.

파일 변경 후 서버를 재시작해야 합니다. 패키징된 JAR에는 파일 사본이 포함되므로 JAR 실행 시에는 다시 빌드해야 합니다.
기존 환경변수 `VLLM_BASE_URL`, `VLLM_MODEL`은 Spring 설정 우선순위에 따라 파일을 덮어쓸 수 있습니다.

## 6. ChatRequest.java

이 record는 두 가지 요청을 표현합니다.

```json
{"message":"질문"}
```

또는:

```json
{"messages":[{"role":"user","content":"질문"}]}
```

`@Size(max = 32000) String message`는 단일 질문의 길이를 제한합니다. `@Size`만으로 null을 금지하지는 않습니다. 두 입력 중 하나를 고를 수 있어야 하기 때문입니다.

`@Size(min = 1, max = 100) List<@NotNull @Valid Message> messages`는 대화 목록입니다. 목록이 제공되면 1~100개여야 하고, 각 원소는 null이 아니어야 하며, `@Valid`가 내부 Message까지 검증합니다.

`@AssertTrue`가 붙은 `isInputValid()`는 반드시 true여야 합니다.

```java
return message != null
        ? !message.isBlank() && messages == null
        : messages != null && !messages.isEmpty();
```

`조건 ? 참일 때 값 : 거짓일 때 값`은 삼항 연산자입니다. 위 코드는 다음 조건입니다.

1. `message`가 있으면 공백이 아니어야 하고 `messages`는 없어야 합니다.
2. `message`가 없으면 비어 있지 않은 `messages`가 있어야 합니다.

`&&`는 두 조건이 모두 참이어야 하며 왼쪽이 거짓이면 오른쪽은 평가하지 않습니다. 덕분에 null 목록에 `isEmpty()`를 호출하지 않습니다.

`conversation()`은 입력을 vLLM의 공통 형식으로 맞춥니다. 단일 질문이면 `List.of(new Message("user", message))`로 원소 하나의 목록을 만들고, 이력이면 기존 목록을 그대로 반환합니다.

내부 record `Message`의 `role`은 `@NotBlank`와 `@Pattern`으로 `system`, `user`, `assistant` 중 하나인지 검사합니다. `content`는 공백이 아닌 최대 32,000자 문자열입니다. 이미지와 도구 호출 형식은 지원하지 않습니다.

## 7. ChatController.java

- `@RestController`: 웹 요청을 처리하며 반환값을 HTTP 본문으로 보냅니다.
- `@RequestMapping("/api/chat")`: 이 클래스의 기본 URL 경로입니다.
- `private final VllmClient client`: vLLM 호출 담당 객체를 저장합니다.
- 생성자 `ChatController(VllmClient client)`: Spring이 전달한 객체를 `this.client`에 저장합니다. `this`는 현재 객체입니다.
- `@PostMapping(produces = "application/json;charset=UTF-8")`: POST 요청을 `chat()`에 연결하고 응답이 UTF-8 JSON임을 명시합니다. Windows PowerShell 등의 클라이언트가 한글을 잘못 해석하지 않도록 문자셋을 안내합니다.
- `@RequestBody`: 요청 JSON을 `ChatRequest`로 읽습니다.
- `@Valid`: Controller 본문 실행 전에 입력 검증을 수행합니다.
- `client.complete(request)`: vLLM에 요청하고 답변 문자열을 받습니다.
- `new ChatResponse(...)`: 받은 문자열을 응답 객체에 넣습니다.
- `record ChatResponse(String answer)`: 최종 JSON이 `{"answer":"..."}`가 되도록 응답 필드를 정의합니다.

현재 중간 비즈니스 로직이 작아서 별도의 Service 없이 Controller가 Client를 호출합니다.

## 8. VllmClient.java

### 객체와 생성자

`@Component`는 Spring이 이 객체를 관리하도록 합니다. `RestClient client`는 HTTP 통신 객체이고 `String model`은 서버에 전달할 모델명입니다.

생성자의 `@Value("${vllm.…}")`는 설정 값을 주입합니다. `Duration`은 시간 길이를 표현하며 `5s`, `120s` 같은 설정이 이 타입으로 변환됩니다.

`HttpClient.newBuilder().connectTimeout(connectTimeout).build()`는 연결 시간 제한을 둔 Java HTTP 클라이언트를 생성합니다.

`JdkClientHttpRequestFactory`는 Java HTTP 클라이언트를 Spring RestClient에서 사용하도록 연결합니다. `setReadTimeout(readTimeout)`은 응답 대기 제한을 설정합니다.

`RestClient.builder()`는 설정을 모아서 HTTP 호출 객체를 만듭니다. `var`는 오른쪽 표현식으로부터 변수 타입을 추론하는 Java 문법입니다.

`baseUrl.replaceAll("/+$", "")`는 주소 맨 끝의 슬래시들을 제거합니다. 정규식 `/+`는 하나 이상의 슬래시, `$`는 문자열 끝을 뜻합니다.

`requestFactory(factory)`는 앞에서 만든 통신 설정을 적용합니다. 키가 공백이 아니면 `defaultHeader("Authorization", "Bearer " + apiKey)`로 인증 헤더를 추가합니다. 마지막 `build()`로 객체를 완성합니다.

### complete()의 정상 흐름

`model.isBlank()`이면 실제 요청을 보내지 않고 503 오류를 만듭니다. 모델명을 임의로 추측하지 않기 위해서입니다.

```java
var response = client.post().uri("/v1/chat/completions")
        .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
        .body(Map.of("model", model, "messages", request.conversation(), "stream", false))
        .retrieve().body(Completion.class);
```

각 호출은 순서대로 다음을 의미합니다.

1. `post()`: POST 요청을 준비합니다.
2. `uri(...)`: 기본 서버 주소에 API 경로를 붙입니다.
3. `contentType(...)`: 보내는 본문이 JSON이라고 알립니다.
4. `accept(...)`: JSON 응답을 받겠다고 알립니다.
5. `Map.of(...)`: 모델명, 대화 목록, 스트리밍 해제를 가진 본문을 구성합니다.
6. `retrieve().body(Completion.class)`: 요청을 실행하고 응답 JSON을 Completion으로 변환합니다.

응답을 받은 뒤 `response`, `choices`, 첫 번째 choice, 그 안의 `message`, `content`가 존재하는지 확인합니다. `||`는 하나라도 참이면 참이며 앞 조건이 참이면 뒤는 평가하지 않습니다. 이 순서로 null 접근이나 빈 목록 접근을 방지합니다.

구조가 잘못되면 502를 만들고, 정상이면 `response.choices().getFirst().message().content()`로 첫 번째 답변 문자열을 반환합니다. 빈 문자열 자체는 허용하지만 null 답변은 허용하지 않습니다.

### 예외 처리

`try`는 정상 처리 영역이고 `catch`는 특정 실패를 잡는 영역입니다.

- `ResourceAccessException`: 연결 또는 I/O 문제입니다. 원인 예외를 `getCause()`로 따라가며 `HttpTimeoutException` 또는 `SocketTimeoutException`이면 504, 그 외에는 연결 불가 502로 변환합니다.
- `RestClientResponseException`: vLLM이 오류 HTTP 상태를 반환했습니다. 프론트엔드에는 502와 공통 설명을 보냅니다. vLLM이 보낸 원본 오류 본문은 노출하지 않습니다.
- `RestClientException`: 위에 해당하지 않는 HTTP 클라이언트 처리 실패입니다. JSON을 해석할 수 없는 경우 등을 502로 변환합니다.

현재 자동 재시도는 없습니다. 오류를 받은 호출자가 다음 요청 여부를 결정합니다.

### 응답 record 세 개

```java
public record Completion(List<Choice> choices) {}
public record Choice(Reply message) {}
public record Reply(String content) {}
```

vLLM의 중첩 JSON 구조를 표현합니다. `choices` 배열 안에 `message`가 있고, 그 안에 답변 `content`가 있습니다. 모델명, 토큰 사용량 등 다른 응답 정보는 프론트엔드로 전달하지 않습니다.

## 9. VllmException.java

`extends RuntimeException`은 일반 Java 예외를 확장한 사용자 정의 예외라는 뜻입니다.

`status`는 프론트엔드로 보낼 HTTP 상태이고 `code`는 프로그램에서 구분하기 위한 문자열입니다. 생성자의 `super(message)`는 부모 예외 클래스에 설명을 저장합니다. 나중에 `getMessage()`로 읽습니다.

`status()`와 `code()`는 저장된 값을 반환합니다. Client는 이 예외를 던지고, Handler가 HTTP 응답으로 바꿉니다. 이 클래스 자체가 응답을 보내는 것은 아닙니다.

## 10. ApiExceptionHandler.java

`@RestControllerAdvice`는 Controller 처리 중 발생하는 예외를 공통으로 처리합니다.

`@ExceptionHandler(VllmException.class)`가 붙은 `vllm()`은 예외의 상태, 코드, 설명으로 응답합니다. `ResponseEntity.status(...).body(...)`는 HTTP 상태와 JSON 본문을 함께 지정합니다.

두 번째 `@ExceptionHandler`는 다음 두 상황을 처리합니다.

- `MethodArgumentNotValidException`: 질문 공백, 잘못된 role 등 검증 실패.
- `HttpMessageNotReadableException`: 깨진 JSON 또는 요청 객체로 읽을 수 없는 본문.

`invalidRequest()`는 두 경우 모두 400과 `INVALID_REQUEST`를 반환합니다. 매개변수 `ex`는 현재 본문에서는 사용하지 않으며 내부 예외 상세를 그대로 노출하지 않습니다.

`record ApiError(String code, String message)`가 오류 JSON 필드를 정의합니다. 이 Handler가 모든 종류의 서버 오류를 처리하는 것은 아닙니다. 등록하지 않은 예외는 Spring 기본 처리에 맡깁니다.

`JSON_UTF8` 상수와 `ResponseEntity.contentType(JSON_UTF8)`는 이 Handler가 반환하는 오류에도
`application/json;charset=UTF-8`을 지정하여 한글 오류 메시지의 인코딩을 명시합니다.

## 11. WebConfig.java

`@Configuration`은 Spring 설정 클래스입니다. `implements WebMvcConfigurer`를 통해 웹 MVC 설정을 확장합니다.

생성자는 `app.cors.allowed-origins`를 문자열 배열로 주입받습니다. 쉼표로 구분한 설정이 여러 출처로 나뉩니다.

`@Override`는 인터페이스가 제공하는 메서드를 구현했다는 표시입니다. `addCorsMappings()`에서:

- `addMapping("/api/**")`: `/api/` 아래 경로에 적용합니다.
- `allowedOrigins(...)`: 허용할 프론트엔드의 프로토콜·호스트·포트를 지정합니다.
- `allowedMethods("POST", "OPTIONS")`: POST 및 브라우저 사전 확인 요청을 허용합니다.
- `allowedHeaders("Content-Type")`: JSON 요청 헤더를 허용합니다.

CORS는 브라우저의 교차 출처 접근에 관한 설정입니다. 사용자 인증 기능을 대신하지 않습니다. 현재 API에 별도의 사용자 로그인 검증은 없습니다.

## 12. BackendApplicationTests.java

`@SpringBootTest`가 실제 Spring 애플리케이션 컨텍스트를 생성합니다. `@Test`가 붙은 `contextLoads()`는 본문이 비어 있어도 컨텍스트 초기화에 실패하면 테스트가 실패합니다.

이 테스트는 실제 vLLM을 호출하지 않습니다. 설정 파일을 읽고 필요한 객체들을 만들 수 있는지 검증합니다.

## 13. ChatApiTests.java

### 모의 vLLM 준비

`HttpServer`는 테스트용 실제 로컬 HTTP 서버입니다. `127.0.0.1`의 포트 `0`은 운영체제가 사용 가능한 포트를 배정하라는 뜻입니다.

`static` 필드는 테스트 인스턴스들이 공유합니다. `volatile`은 서버 스레드와 테스트 스레드 사이의 값 변경이 보이도록 합니다. `AtomicInteger calls`는 호출 횟수를 스레드 안전하게 셉니다.

`static { ... }` 초기화 블록에서 서버를 만들고 가상 스레드 실행기를 지정합니다. `/v1/chat/completions` 요청을 받으면 다음을 수행합니다.

1. 호출 횟수를 증가시킵니다.
2. 요청 본문을 UTF-8로 읽어 `received`에 저장합니다.
3. 인증 헤더와 HTTP 메서드를 저장합니다.
4. 테스트에서 지정한 응답과 상태를 지역 변수로 가져옵니다.
5. `Thread.sleep(delay)`로 지연 응답을 흉내 냅니다.
6. JSON 헤더, 상태, UTF-8 바이트를 응답으로 씁니다.
7. `finally`에서 요청 연결을 닫습니다.

중단 예외는 스레드의 중단 상태를 복원합니다. 서버 초기화 실패는 `ExceptionInInitializerError`로 전달하여 테스트 준비 실패로 처리합니다.

### 테스트 설정과 생명주기

`@DynamicPropertySource`는 실제 설정 파일 대신 테스트 주소, 모델명, 인증 키, 500ms 제한을 주입합니다. 실제 모델 서버에 요청을 보내지 않습니다.

`@Autowired WebApplicationContext`는 Spring 웹 설정 전체를 받습니다. `MockMvc`는 외부 백엔드 포트를 열지 않고 Controller와 검증, 예외 처리, CORS를 실행합니다. 반면 백엔드에서 모의 vLLM으로 가는 구간은 실제 HTTP 통신입니다.

`@BeforeEach setUp()`은 테스트마다 MockMvc와 응답 상태, 지연, 호출 수를 초기화합니다. `@AfterAll stop()`은 모든 테스트가 끝난 뒤 모의 서버를 종료합니다.

### 각 테스트가 검증하는 것

| 메서드 | 검증 내용 |
| --- | --- |
| `forwardsQuestionAndReturnsAnswer` | 프론트엔드 답변, 모델명, stream=false, 질문, role, 인증 헤더, POST 메서드 |
| `forwardsConversationHistory` | messages 목록이 구조와 순서를 유지하는지 |
| `rejectsInvalidRequestsBeforeCallingVllm` | 빈 입력, 잘못된 역할, 중복 입력, 깨진 JSON이 400이며 vLLM 호출은 0회인지 |
| `hidesUpstreamErrors` | vLLM 401을 백엔드 502로 바꾸고 원본 오류 내용을 숨기는지 |
| `rejectsMalformedUpstreamResponses` | JSON이 아니거나 답변 구조가 없으면 502인지 |
| `returnsGatewayTimeout` | 1500ms 지연이 500ms 제한을 넘어 504가 되는지 |
| `allowsConfiguredFrontendAndRejectsOtherOrigins` | 허용한 출처의 사전 요청은 성공하고 다른 출처는 거부하는지 |

`mvc.perform(...)`은 요청 실행, `andExpect(...)`는 응답 검증입니다. `jsonPath("$.answer")`는 JSON 최상위의 answer를 읽습니다. `assertEquals`는 값이 같은지, `assertFalse`는 거짓인지 확인합니다. `JsonMapper.readTree()`는 JSON을 트리로 읽어 필드나 전체 구조를 비교합니다.

테스트의 `throws Exception`은 예상치 못한 예외가 발생하면 테스트 실패로 넘깁니다. 현재 테스트는 실제 GPU 추론, 실제 모델명 유효성, 배포 네트워크 상태까지 확인하지는 않습니다.

## 14. 빌드와 보조 파일

`build.gradle`:

- `java` 플러그인: Java 컴파일과 테스트 작업을 제공합니다.
- `org.springframework.boot`: 실행 가능한 Spring Boot JAR을 생성합니다.
- `io.spring.dependency-management`: Spring Boot에 맞는 의존성 버전을 관리합니다.
- `group`, `version`, `description`: 프로젝트 식별 정보입니다. `0.0.1-SNAPSHOT`은 이 애플리케이션의 개발 버전이며 Spring Boot 버전과 별개입니다.
- `java.toolchain.languageVersion`: JDK 25를 사용하도록 지정합니다.
- `mavenCentral()`: 라이브러리를 다운로드할 저장소입니다.
- `implementation`: 실행 코드에서 사용하는 Validation과 Web MVC 라이브러리입니다.
- `testImplementation`: 테스트에서만 사용하는 라이브러리입니다.
- `testRuntimeOnly`: 테스트 실행 시 필요한 JUnit 런처입니다.
- `useJUnitPlatform()`: JUnit 플랫폼으로 테스트를 실행합니다.

`settings.gradle`의 `rootProject.name = 'backend'`는 Gradle 프로젝트 이름입니다.

`gradlew`와 `gradlew.bat`은 자동 생성된 Gradle 실행 스크립트입니다. 전자는 Unix 계열, 후자는 Windows에서 사용합니다. 실행 경로와 Java를 찾고 JVM 옵션을 준비한 뒤 Wrapper JAR에 명령 인자를 전달하고 종료 상태를 반환합니다. 애플리케이션 로직은 들어 있지 않습니다.

`gradle/wrapper/gradle-wrapper.jar`는 Gradle 배포본을 준비하는 바이너리입니다. `gradle-wrapper.properties`는 다운로드 주소, 캐시 위치, 다운로드 제한 시간, 재시도 설정을 지정합니다. 직접 작성한 비즈니스 코드가 아니므로 수정할 필요가 없습니다.

`.gitignore`는 빌드 결과와 IDE 파일 등을 Git 추적 대상에서 제외합니다. Wrapper JAR은 예외로 포함해 다른 환경에서도 빌드할 수 있게 합니다. `.gitattributes`는 파일의 줄바꿈 등 Git 처리 방식을 정합니다.

`README.md`는 실행과 API 사용 안내이고 이 문서는 코드 해설입니다. `build/`와 `.gradle/`은 실행 도구가 생성하는 결과 및 캐시이므로 직접 수정하지 않습니다.

## 15. 실제 사용 예시

`vllm.properties`에서 실제 서버 주소와 모델명을 채운 후:

```powershell
cd backend
.\gradlew.bat bootRun
```

프론트엔드가 `POST http://localhost:8080/api/chat`에 `{"message":"안녕"}`을 보내면 백엔드가 vLLM 형식으로 변환합니다.

```json
{"model":"설정한 모델명","messages":[{"role":"user","content":"안녕"}],"stream":false}
```

vLLM 응답이 아래와 같으면:

```json
{"choices":[{"message":{"role":"assistant","content":"안녕하세요"}}]}
```

프론트엔드에는 아래처럼 반환합니다.

```json
{"answer":"안녕하세요"}
```

현재 프론트엔드 코드 자체에는 변경을 가하지 않았습니다. 이 문서의 프론트엔드 요청은 API 계약을 설명하는 예시입니다.
