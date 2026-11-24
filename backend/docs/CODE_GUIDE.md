# Backend 코드 구조와 실행 흐름 가이드

이 문서는 현재 `backend` 코드의 실제 동작을 기준으로 작성한 안내서다. 백엔드는 크게 두 기능을 제공한다.

1. 게시글과 플레이그라운드 워크플로우를 PostgreSQL(Supabase)에 저장하고 조회·수정·삭제한다.
2. 별도의 vLLM 서버를 호출해 일반 채팅, 답안 평가, 힌트, 강의 기반 챗봇 응답을 만든다.

백엔드는 AI 모델을 직접 실행하지 않는다. Java 애플리케이션은 HTTP API와 DB 처리를 담당하고, 실제 모델 추론은 외부 vLLM 서버가 담당한다.

---

## 1. 사용 기술

| 기술 | 현재 역할 |
| --- | --- |
| Java 25 | 백엔드 구현 언어 |
| Spring Boot 4.1.2 | 애플리케이션 시작, 객체 관리, 자동 설정 |
| Spring Web MVC | REST API, JSON 요청·응답, CORS |
| Jakarta Validation | DTO와 워크플로우 입력 검증 |
| Spring Data JPA / Hibernate | Java 엔티티와 PostgreSQL 테이블 연결 |
| PostgreSQL | 게시글과 JSON 워크플로우 저장 |
| Spring Security Crypto | BCrypt 비밀번호 해시만 사용 |
| Spring `RestClient` | 외부 vLLM Chat Completions API 호출 |
| JUnit / MockMvc / Mockito | 컨트롤러, 검증, AI 파이프라인 테스트 |
| Gradle Wrapper | 빌드, 테스트, 실행 JAR 생성 |

Spring Security의 로그인·인가 시스템 전체를 사용하는 것은 아니다. `spring-security-crypto`만 사용하여 게시글 비밀번호를 BCrypt로 암호화한다.

---

## 2. 전체 디렉터리 구조

```text
backend/
├─ build.gradle                         의존성, Java 버전, 테스트 설정
├─ settings.gradle                      Gradle 프로젝트 이름
├─ Dockerfile                           빌드/실행용 멀티 스테이지 이미지
├─ gradlew, gradlew.bat                 Gradle Wrapper
├─ docs/CODE_GUIDE.md                   현재 문서
└─ src/
   ├─ main/
   │  ├─ java/com/awsproject/backend/
   │  │  ├─ BackendApplication.java     애플리케이션 시작점
   │  │  ├─ config/                     공통 Bean과 CORS 설정
   │  │  ├─ post/                       게시글·워크플로우 기능
   │  │  └─ chat/                       vLLM 및 강의 기반 AI 기능
   │  └─ resources/
   │     ├─ application.properties      DB, 포트, CORS, 페이징 설정
   │     └─ prompts/system.txt           기본 채팅 시스템 프롬프트
   └─ test/
      ├─ java/                          API·검증·검색 테스트
      └─ resources/prompts/             테스트용 시스템 프롬프트
```

`build/`, `bin/`, `.gradle/`은 소스가 아니라 빌드 결과나 도구 캐시다. 동작을 이해할 때는 주로 `src/main`을 보면 된다.

---

## 3. 이해에 필요한 핵심 개념

### 3.1 Spring Bean과 의존성 주입

Spring Bean은 Spring이 생성하고 수명 주기를 관리하는 객체다.

- `@RestController`: HTTP 요청을 받는 컨트롤러
- `@Service`: 비즈니스 로직을 처리하는 서비스
- `@Component`: 일반 기능 객체
- `@Configuration`: 설정 객체
- `@Bean`: 설정 클래스가 직접 만들어 등록하는 객체

`PostController`는 생성자로 `PostService`를 받고, `PostService`는 `PostRepository`와 `PasswordEncoder`를 받는다. 코드가 직접 객체를 만들지 않아도 Spring이 필요한 구현체를 생성자에 넣어준다. 이를 의존성 주입(Dependency Injection, DI)이라고 한다.

```text
PostController
    └─ PostService
         ├─ PostRepository
         └─ PasswordEncoder(BCryptPasswordEncoder)
```

### 3.2 Controller, Service, Repository, Entity, DTO

| 계층 | 의미 | 현재 코드 |
| --- | --- | --- |
| Controller | HTTP 경로, 요청·응답 상태 담당 | `PostController`, `ChatController` |
| Service | 게시글 업무 규칙 담당 | `PostService` |
| Repository | DB 조회·저장 명령 제공 | `PostRepository` |
| Entity | DB 테이블과 연결되는 영속 객체 | `Post` |
| DTO | 외부 JSON의 요청·응답 모양 | `post/DTO/*`, `chat/DTO/*` |

Entity를 응답으로 바로 내보내지 않고 DTO로 바꾸면 비밀번호 같은 내부 필드를 숨기고 DB 구조와 API 계약을 분리할 수 있다.

### 3.3 Java `record`

`record`는 데이터 전달 객체를 간결하게 표현하는 Java 문법이다.

```java
public record CreatePostResponse(
    UUID id,
    String author,
    String title,
    OffsetDateTime createdAt
) {}
```

생성자와 `id()`, `author()` 같은 접근 메서드가 자동으로 생긴다. Spring/Jackson은 record와 JSON 사이를 변환한다.

### 3.4 JSON 변환과 입력 검증

- 역직렬화: 프론트엔드 JSON을 Java DTO로 변환
- 직렬화: Java 응답 객체를 JSON으로 변환

JSON 문법이 깨졌거나 타입이 맞지 않으면 컨트롤러 진입 전에 `HttpMessageNotReadableException`이 발생한다. DTO 변환 뒤에는 `@Valid`가 `@NotBlank`, `@Size`, 커스텀 검증 등을 실행한다.

### 3.5 트랜잭션과 Dirty Checking

트랜잭션은 여러 DB 작업을 하나의 논리적 단위로 묶는다. `PostService.updatePost()`는 `@Transactional` 안에서 게시글을 조회하고 엔티티를 바꾼다.

```text
트랜잭션 시작
  → Post 조회(영속 상태)
  → 비밀번호 검사
  → Post.update()로 필드 변경
  → Hibernate가 변경을 감지해 UPDATE 실행
  → 커밋
```

이 자동 변경 감지를 Dirty Checking이라고 한다. 따라서 `updatePost()`에는 별도의 `save()`가 없어도 수정 내용이 반영된다.

---

## 4. 애플리케이션 시작 과정

시작점은 `BackendApplication.java`다.

```java
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

`@SpringBootApplication`은 자동 설정을 활성화하고 `com.awsproject.backend` 아래의 Controller, Service, Component, Configuration 등을 탐색해 Bean으로 등록한다.

```text
application.properties와 환경변수 읽기
  → DataSource와 JPA/Hibernate 구성
  → PasswordEncoder Bean 생성
  → CORS 설정 생성
  → Controller / Service / Repository 생성
  → VllmClient 생성
      → 시스템 프롬프트 읽기
      → 내장 강의 코퍼스 압축 해제
      → BM25 검색 색인 생성
      → 외부 vLLM용 RestClient 생성
  → 내장 웹 서버가 요청 대기
```

`VllmClient` 생성 중 시스템 프롬프트나 내장 강의 데이터 읽기에 실패하면 서버 시작도 실패한다. 실제 vLLM 네트워크 연결은 AI 요청이 들어올 때 수행한다.

---

## 5. 설정과 환경변수

`application.properties`의 주요 설정은 다음과 같다.

| 설정 | 의미 |
| --- | --- |
| `spring.config.import=optional:file:.env[.properties]` | 실행 디렉터리의 `.env`를 선택적으로 읽음 |
| `server.port=${SERVER_PORT:8080}` | 서버 포트, 기본 8080 |
| `spring.datasource.url=${SUPABASE_DB_URL}` | PostgreSQL/Supabase JDBC URL |
| `spring.datasource.driver-class-name` | PostgreSQL JDBC 드라이버 |
| `spring.jpa.hibernate.ddl-auto=update` | 엔티티에 맞춰 테이블 스키마 갱신 시도 |
| `hibernate.default_schema=public` | PostgreSQL `public` 스키마 사용 |
| `app.cors.allowed-origins` | 허용 프론트엔드 origin 목록 |
| `pageable.default-page-size=30` | 기본 페이지 크기 |
| `pageable.max-page-size=30` | 최대 페이지 크기 |

`VllmProperties`는 Spring의 relaxed binding으로 보통 다음 환경변수를 받는다.

| 환경변수 | 기본값/의미 |
| --- | --- |
| `VLLM_BASE_URL` | 기본값 없음, vLLM 서버 주소 |
| `VLLM_MODEL` | 기본값 없음, 서빙된 모델 이름 |
| `VLLM_API_KEY` | 빈 문자열, 있으면 Bearer 헤더 추가 |
| `VLLM_CONNECT_TIMEOUT` | `5s` |
| `VLLM_READ_TIMEOUT` | `120s` |
| `VLLM_SYSTEM_PROMPT` | `classpath:prompts/system.txt` |
| `VLLM_ENABLE_THINKING` | `false`, Qwen 계열 thinking 제어 |

`.env`는 클래스패스가 아니라 현재 작업 디렉터리 기준이다. `backend`에서 실행하면 보통 `backend/.env`를 찾는다.

---

## 6. 게시글과 워크플로우 기능

### 6.1 `Post` 엔티티

`Post.java`는 PostgreSQL `posts` 테이블과 연결된다.

| 필드 | DB 의미 |
| --- | --- |
| `id` | UUID 기본 키, `gen_random_uuid()` 사용 |
| `author` | 작성자, TEXT, 필수 |
| `password` | BCrypt 해시, TEXT, 필수 |
| `title` | 제목, TEXT, 필수 |
| `body` | 본문, TEXT, 필수 |
| `workflow` | PostgreSQL `jsonb` |
| `createdAt` | DB `now()`로 생성 시 기록 |
| `updatedAt` | Hibernate가 수정 시 갱신 |

워크플로우 전체를 하나의 `jsonb` 값으로 저장한다. 전체 JSON을 그대로 저장하고 반환하기 쉽지만 개별 노드에 대한 DB 제약은 Java 검증에 의존한다.

JPA가 DB 행을 객체로 복원하려면 인자 없는 생성자가 필요하다. `protected Post()`가 그 역할을 한다.

### 6.2 Repository와 Service

`PostRepository extends JpaRepository<Post, UUID>` 선언만으로 Spring Data JPA가 `save`, `findById`, `findAll`, `delete` 구현체를 자동 생성한다.

`PostService`는 다음을 담당한다.

- 생성: 원문 비밀번호를 BCrypt로 해시한 뒤 저장
- 수정: 조회 → 비밀번호 비교 → 엔티티 변경
- 삭제: 조회 → 비밀번호 비교 → 삭제
- 조회: 단건, 목록, 워크플로우 조회

```text
생성 요청 평문 비밀번호
  → passwordEncoder.encode()
  → BCrypt 해시만 DB 저장

수정/삭제 평문 비밀번호
  → passwordEncoder.matches(평문, 저장된 해시)
  → 일치할 때만 진행
```

BCrypt는 매번 다른 salt를 사용하므로 해시 문자열을 직접 비교하지 않고 `matches()`를 사용한다.

### 6.3 게시글 API

기본 경로는 `/api/posts`다.

| Method/경로 | 기능 | 성공 상태 |
| --- | --- | --- |
| `POST /api/posts` | 게시글 생성 | 201 |
| `PATCH /api/posts/{id}` | 게시글 수정 | 204 |
| `DELETE /api/posts/{id}` | 게시글 삭제 | 204 |
| `GET /api/posts` | 페이지 목록 | 200 |
| `GET /api/posts/{id}` | 상세 조회 | 200 |
| `GET /api/posts/{id}/workflow` | 워크플로우만 조회 | 200 |

생성 요청은 `author`, `password`, `title`, `body`, `workflow`를 받는다. 문자열 네 개는 공백일 수 없고 워크플로우는 구조와 최소 개수 규칙을 통과해야 한다. 성공 응답은 `id`, `author`, `title`, `createdAt`만 포함한다.

수정 요청에서 비밀번호는 필수다. `title`, `body`는 null이면 기존 값을 유지하지만 현재 DTO 검증상 `workflow`는 null일 수 없고 최소 구성도 충족해야 한다. 게시글이 없으면 404, 비밀번호가 다르면 403이다.

삭제 요청은 `{ "password": "..." }` 형태이며 같은 방식으로 게시글과 비밀번호를 확인한다.

목록 응답은 다음 형태다.

```json
{
  "content": [],
  "page": 0,
  "size": 30,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false
}
```

목록 정렬은 클라이언트 `sort`를 무시하고 `createdAt DESC`, 같은 시간이면 `id DESC`로 고정한다. 최대 페이지 크기는 30이다. 목록 DTO에는 본문과 비밀번호는 없지만 현재 워크플로우는 포함된다.

전체 흐름은 다음과 같다.

```text
프론트엔드 요청
  → JSON을 Request DTO로 변환
  → @Valid 검증
  → PostController
  → PostService
  → PostRepository
  → Hibernate SQL
  → PostgreSQL/Supabase
  → Response DTO
  → JSON 응답
```

---

## 7. 워크플로우 검증

생성과 수정 DTO의 workflow에는 두 검증이 붙어 있다.

```java
@ValidWorkflow
@ValidWorkflowRequirements
JsonNode workflow
```

### 7.1 `@ValidWorkflow`: 구조 검증

`WorkflowValidator`의 주요 규칙:

- workflow는 객체이고 `version`은 정수, `graph`는 객체여야 한다.
- `entities`, `connections`는 배열이어야 한다.
- 엔티티 최대 200개, 연결 최대 500개다.
- 엔티티의 `id`, `name`, `type`, `kind`, `parent`, `position`이 유효해야 한다.
- 엔티티 ID는 중복될 수 없다.
- type은 `system` 또는 `resource`만 허용한다.
- `system`은 0 이상의 width/height를 가져야 한다.
- `resource`는 ports, version, 0 이상의 정수 replicas가 필요하다.
- 포트는 id, `in|out` direction, material, boolean multiple을 가져야 한다.
- 한 엔티티 안에서 포트 ID는 중복될 수 없다.
- 연결 ID도 중복될 수 없다.
- 연결의 from/to에는 node와 port가 필요하다.
- 연결이 가리키는 node는 실제 엔티티 ID여야 한다.

현재는 연결의 port 문자열이 해당 노드의 실제 포트 ID인지까지 대조하지 않는다. 문자열 존재와 node 존재까지만 확인한다.

구조 오류는 기존 형식으로 응답한다.

```http
HTTP 400 Bad Request
```

```json
{
  "code": "INVALID_REQUEST",
  "message": "workflow: workflow 형식이 올바르지 않습니다."
}
```

### 7.2 `@ValidWorkflowRequirements`: 최소 구성 검증

`WorkflowRequirementsValidator`는 다음 세 경우를 같은 오류로 처리한다.

- workflow가 Java null 또는 JSON null
- 엔티티 2개 미만
- 연결 1개 미만

```http
HTTP 422 Unprocessable Entity
```

```json
{
  "code": "WORKFLOW_REQUIREMENTS_NOT_MET",
  "message": "워크플로우에는 엔티티가 2개 이상, 연결이 1개 이상 필요합니다."
}
```

JSON 구조가 잘못된 입력은 최소 구성 검증기가 판단하지 않고 구조 검증에 맡긴다. 두 검증이 함께 실패할 때도 `ApiExceptionHandler`는 구조 오류를 우선해 400을 유지한다.

- 400: 서버가 기대하는 JSON 구조나 타입 자체가 잘못됨
- 422: 구조는 이해했지만 최소 업무 규칙을 충족하지 못함

---

## 8. AI 기능의 공통 구조

AI 기본 경로는 `/api/chat`이며 핵심 객체는 `VllmClient`다.

```text
ChatController
  → 목적별 프롬프트/JSON Schema 구성
  → VllmClient
      → system 메시지 추가
      → POST {VLLM_BASE_URL}/v1/chat/completions
      → 응답 구조 검증
      → 값 추출
  → 응답 DTO
```

일반 요청에는 `model`, `messages`, `stream: false`, `chat_template_kwargs.enable_thinking`이 들어간다. 구조화 응답에는 temperature, `max_tokens: 800`, `response_format: json_schema`가 추가된다.

JSON Schema는 모델이 지정된 필드와 타입을 가진 JSON을 만들도록 요구한다. 모델 출력은 완전히 신뢰할 수 없으므로 서버가 다시 파싱하고 필수 필드, 길이, enum을 검증한다.

일반 채팅은 `resources/prompts/system.txt`를 사용하고, `explain`, `hint`, 강의 `chat`은 `VllmClient.getSystemPrompt()`의 목적별 프롬프트를 사용한다.

---

## 9. AI API별 동작

### 9.1 `POST /api/chat`: 일반 채팅

단일 `message` 또는 `messages` 목록 중 정확히 하나만 허용한다.

```json
{"message":"AWS EC2가 무엇인가요?"}
```

또는:

```json
{
  "messages": [
    {"role":"user","content":"안녕하세요"},
    {"role":"assistant","content":"안녕하세요"},
    {"role":"user","content":"EC2를 설명해 주세요"}
  ]
}
```

메시지는 최대 32,000자, 목록은 1~100개이며 role은 `system`, `user`, `assistant`만 허용한다. 매 요청마다 새 메시지 목록을 만들고 서버 system prompt를 맨 앞에 붙인다. 이전 요청 대화를 서버에 누적하지 않는다.

```json
{"answer":"모델 답변"}
```

### 9.2 `POST /api/chat/ai/explain`: 학생 답안 평가

처리 순서:

1. 보기가 2개 이상인지 확인한다.
2. 정답 인덱스가 범위 안인지 확인한다.
3. 문제, 정답 보기, 해설, 학생 답변 등을 JSON prompt로 만든다.
4. `compare`, `verdict`, `feedback`을 요구하는 Schema로 모델을 호출한다.
5. 모델 JSON을 파싱하고 응답으로 변환한다.

`verdict`는 `정확`, `부분 정확`, `오개념` 중 하나다. 정확이면 display는 `correct`, 아니면 `needs_work`다.

```json
{
  "status":"ok",
  "verdict":"부분 정확",
  "display":"needs_work",
  "feedback":"구체적인 피드백"
}
```

AI 출력 검증이 두 번 실패하면 `status: fallback`과 “지금은 답안을 평가하지 못했어요”를 반환한다. 현재 Jakarta Validation이 직접 검사하는 요청 필드는 `reason`의 공백 여부와 최대 32,000자뿐이며 보기 개수와 정답 인덱스는 컨트롤러가 수동 확인한다.

### 9.3 `POST /api/chat/ai/hint`: 워크플로우 힌트

`lessonId`, 배열인 `nodes`와 `edges`, 객체인 `settings`, `ruleCheck`를 받는다. `ruleCheck.success == true`이면 모델을 호출하지 않고 목표 달성 메시지를 즉시 반환한다.

실패 상태이면 모델에 다음 필드를 요구한다.

- `error_basis`: 오류 근거, 최대 120자
- `concept`: 관련 개념, 최대 200자
- `hint`: 최대 160자이며 `?`로 끝나는 질문

AI 출력 검증이 두 번 실패하면 fallback을 반환한다.

중요: 현재 `HintResponse` record의 필드명이 `concept`가 아니라 `conecpt`다. 따라서 실제 JSON 키도 현재는 `conecpt`다.

```json
{
  "status":"fallback",
  "errorBasis":"",
  "conecpt":"지금은 힌트를 만들지 못했어요",
  "hint":"실행 결과의 실패 단계 설명을 다시 읽어볼까요?",
  "display":"지금은 힌트를 만들지 못했어요 실행 결과의 실패 단계 설명을 다시 읽어볼까요?"
}
```

### 9.4 `POST /api/chat/ai/chat`: 강의 기반 챗봇

```json
{
  "question":"Shadow 배포와 Canary 배포의 차이가 무엇인가요?",
  "lessonId":"canary"
}
```

question은 필수이고 최대 32,000자, lessonId는 선택이며 최대 200자다. 이 API는 먼저 관련 강의를 검색한 뒤 검색 결과만 모델에 제공한다. 이를 RAG(Retrieval-Augmented Generation)라고 한다.

```text
질문
  → 관련 강의 섹션 5개 검색
  → 섹션과 질문을 모델에 전달
  → answer/example/source 검증
  → 후속 권유 문장 제거
  → 중복 예시 제거
  → 출처 ID를 강의 정보로 변환
```

```json
{
  "status":"ok",
  "answer":"강의 근거 답변",
  "example":"추가 비유 또는 null",
  "source":{
    "lessonId":"canary",
    "lessonTitle":"강의 제목",
    "heading":"섹션 제목"
  }
}
```

두 번 모두 출력 검증에 실패하면 `ChatAiResponse.fallback()`이 “질문을 조금 더 짧게 다시 해 주세요”라는 fallback 응답을 만든다.

---

## 10. 강의 검색과 RAG

`LectureCorpus.java`에는 강의 목록이 GZIP 압축 후 Base64 문자열로 내장되어 있다. 시작 시 Base64 디코딩 → GZIP 해제 → JSON 변환 → 검색 색인 생성 순서로 준비한다.

검색은 단어 분석기 대신 문자 bigram을 사용한다. 텍스트를 소문자로 바꾸고 공백을 제거한 뒤 두 글자씩 자른다. 한국어와 영어가 섞인 강의에서도 별도 형태소 분석기 없이 부분 일치를 계산할 수 있다.

BM25 점수는 다음을 고려한다.

- 검색 bigram이 섹션에 등장한 횟수
- 너무 흔한 bigram의 중요도 감소(IDF)
- 긴 문서가 무조건 유리하지 않도록 길이 보정
- 요청 lessonId와 같은 lesson이면 점수 10% 증가

결과 규칙:

- 총 5개 섹션
- 한 lesson에서 최대 2개
- 본문 앞 80자가 같은 섹션은 중복 제거

`ChatResponseProcessor`는 모델 답변에서 “더 알고 싶다면 물어보세요” 같은 후속 권유를 제거한다. answer와 example의 bigram 중복률이 50% 이상이면 example을 null로 바꾼다.

---

## 11. vLLM 응답 검증, 재시도, 오류

구조화 응답은 최대 두 번 시도한다.

```text
첫 요청
  → finish_reason == length이면 재시도
  → JSON 파싱 실패이면 재시도
  → 필드/길이/enum 검증 실패이면 재시도
  → 성공하면 반환

두 번째도 실패
  → AiResponseException
  → Controller가 fallback 생성
```

강의 챗봇은 temperature `0.0`, `0.3` 순서로 시도하고 source가 실제 검색 결과 ID 또는 `없음`인지도 검사한다.

- `AiResponseException`: HTTP 호출은 됐지만 모델 출력이 요구한 JSON 규칙을 충족하지 못함
- `VllmException`: 네트워크, 타임아웃, 상위 서버 HTTP 오류, 응답 구조 문제

현재 fallback은 `AiResponseException`만 잡는다. 네트워크 실패 등 `VllmException`은 공통 처리기가 HTTP 오류로 반환한다.

| code | HTTP | 조건 |
| --- | --- | --- |
| `VLLM_NOT_CONFIGURED` | 503 | 일반 채팅의 URL 또는 모델 누락 |
| `VLLM_TIMEOUT` | 504 | 연결/응답 시간 초과 |
| `VLLM_UNAVAILABLE` | 502 | vLLM 연결 불가 |
| `VLLM_UPSTREAM_ERROR` | 502 | vLLM이 4xx/5xx 반환 |
| `VLLM_INVALID_RESPONSE` | 502 | 응답 JSON 또는 필수 값 해석 실패 |

상위 vLLM의 원문 오류 본문은 브라우저에 노출하지 않는다.

---

## 12. 공통 예외 처리

`ApiExceptionHandler`의 `@RestControllerAdvice`가 여러 컨트롤러의 예외를 공통 처리한다.

```json
{"code":"오류 코드","message":"설명"}
```

- 일반 `@Valid` 실패: `400 / INVALID_REQUEST`
- 워크플로우 최소 구성 실패만 존재: `422 / WORKFLOW_REQUIREMENTS_NOT_MET`
- 깨진 JSON/잘못된 타입: `400 / INVALID_REQUEST`
- `VllmException`: 예외가 가진 502/503/504와 전용 code

현재 모든 예외가 이 형식으로 통일된 것은 아니다. `PostService`의 `ResponseStatusException`은 Spring 기본 오류 응답으로 처리된다. `ChatController`가 직접 발생시키는 일부 `IllegalArgumentException`, `IllegalStateException`에도 전용 handler가 없어 일반적으로 500 기본 응답이 된다.

---

## 13. CORS

CORS는 브라우저의 교차 출처 요청 정책이다. `WebConfig`는 `/api/**`에 대해 설정된 origin, `GET/POST/PATCH/DELETE/OPTIONS`, `Content-Type` 헤더를 허용한다.

기본 origin은 다음 두 개다.

```text
http://localhost:5173
http://127.0.0.1:5173
```

브라우저는 실제 요청 전에 `OPTIONS` preflight를 보낼 수 있다. CORS는 로그인이나 인증 장치가 아니며 curl이나 서버 간 요청을 막는 보안 기능도 아니다.

---

## 14. 테스트

### `PostWorkflowValidationTests`

- 정상 워크플로우 허용
- 과거 형식/잘못된 구조를 저장 전에 400으로 거부
- 존재하지 않는 엔티티를 참조하는 연결 거부
- null, 엔티티 부족, 연결 부족을 422로 거부

### `PostListApiTests`

- 페이지 응답 구조
- 비밀번호 미노출
- 페이지 크기 30 제한
- 서버 고정 정렬 사용

### `ChatApiTests`

로컬 가짜 HTTP 서버를 vLLM처럼 실행하여 실제 GPU 없이 요청 전달을 검사한다.

- 모델명, system prompt, 메시지, Bearer 헤더
- 요청 간 메시지 비누적
- 입력 오류 시 vLLM 호출 전 400
- 상위 오류 은닉과 502
- 잘못된 응답 502
- 타임아웃 504
- CORS

### `ChatPipelineTests`

- BM25 관련 강의 검색과 lesson 다양성
- 후속 권유 문장 제거
- 중복 example 제거

### `BackendApplicationTests`

실제 PostgreSQL로 전체 Spring context를 검사한다. `SUPABASE_DB_URL`이 있을 때만 실행된다.

```powershell
cd backend
.\gradlew.bat test
```

---

## 15. 빌드, 실행, Docker

```powershell
cd backend
.\gradlew.bat bootRun
```

```powershell
.\gradlew.bat build
```

Dockerfile은 JDK 25 이미지에서 테스트와 bootJar를 실행한 뒤, 더 작은 JRE 25 이미지에 JAR만 복사한다. 최종 컨테이너는 root가 아닌 `10001:10001` 사용자로 실행되고 8080 포트를 노출한다.

빌드 단계의 BuildKit secret `SUPABASE_DB_URL`은 전체 context 테스트에 사용된다. secret mount는 값을 이미지 레이어에 직접 복사하지 않기 위한 방식이다.

---

## 16. 기능별 전체 호출 흐름

### 게시글 생성

```text
POST /api/posts
  → CreatePostRequest 변환/검증
  → PostController.createPost
  → PostService.createPost
  → BCrypt 해시
  → PostRepository.save
  → PostgreSQL INSERT
  → CreatePostResponse
  → 201
```

### 게시글 수정

```text
PATCH /api/posts/{id}
  → UpdatePostRequest 검증
  → PostService.updatePost(@Transactional)
  → findById → BCrypt matches → Post.update
  → Dirty Checking UPDATE
  → 204
```

### 일반 AI 채팅

```text
POST /api/chat
  → ChatRequest 검증
  → system prompt + 대화
  → vLLM /v1/chat/completions
  → choices[0].message.content
  → {answer}
```

### 구조화 AI 응답

```text
explain 또는 hint
  → 입력을 JSON prompt로 변환
  → 목적별 prompt + JSON Schema
  → vLLM 호출
  → 모델 content를 JSON 파싱
  → 필드/길이/enum 검증
  → 실패 시 한 번 재시도
  → 성공 또는 fallback
```

### 강의 기반 챗봇

```text
POST /api/chat/ai/chat
  → 질문 bigram
  → BM25 강의 검색
  → 상위 5개 섹션 + 질문을 모델에 전달
  → answer/example/source 검증
  → 후처리와 출처 변환
  → 성공 또는 fallback
```

---

## 17. 현재 코드에서 특히 알아둘 점

1. 게시글 생성과 수정 모두 유효한 workflow를 요구하며 null은 422다.
2. 수정 DTO에서 title/body는 선택적이지만 workflow는 현재 선택적이지 않다.
3. 목록 응답에도 workflow 전체 JSON이 포함된다.
4. 연결 검증은 node 존재 여부는 보지만 port가 실제 노드 포트인지까지 확인하지 않는다.
5. AI 구조화 출력은 JSON Schema와 Java 검증을 함께 사용한다.
6. AI fallback은 잘못된 모델 출력에 적용되며 네트워크 오류에는 적용되지 않는다.
7. `HintResponse`의 실제 JSON 키는 현재 `concept`가 아니라 `conecpt`다.
8. 일부 예외는 아직 `{code, message}` 형식으로 통일되지 않았다.
9. 사용자 로그인은 없고 게시글별 BCrypt 비밀번호만 사용한다.
10. 일반 채팅 이력은 서버에 저장되지 않아 프론트가 필요한 이력을 매번 보내야 한다.
11. 강의 데이터는 Java 소스의 압축 문자열이라 변경 후 재빌드가 필요하다.
12. `ddl-auto=update`는 실행 시 DB 스키마를 바꿀 수 있어 운영에서는 별도 마이그레이션 전략을 검토해야 한다.

---

## 18. 추천 코드 읽기 순서

1. `BackendApplication.java`: 시작점
2. `application.properties`: 외부 설정
3. `PostController.java`: 게시글 API
4. 게시글 DTO: JSON 계약
5. `PostService.java`: 업무 흐름
6. `Post.java`, `PostRepository.java`: DB 구조
7. 두 Workflow Validator: 검증 규칙
8. `ChatController.java`: AI API 종류
9. `VllmClient.java`: 모델 호출, Schema, 재시도
10. `LectureRetriever.java`, `ChatResponseProcessor.java`: RAG와 후처리
11. `ApiExceptionHandler.java`: 오류 응답
12. 테스트: 보장되는 동작

이 순서로 읽으면 HTTP 요청이 어느 객체를 거쳐 DB 또는 vLLM으로 이동하고 어떤 DTO와 상태 코드로 프론트엔드에 돌아오는지 전체 흐름을 연결해서 이해할 수 있다.
