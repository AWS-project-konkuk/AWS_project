package com.awsproject.backend;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class ChatApiTests {
    static final HttpServer upstream;
    static volatile String response;
    static volatile String received;
    static volatile String authorization;
    static volatile String method;
    static volatile int upstreamStatus;
    static volatile long delay;
    static final AtomicInteger calls = new AtomicInteger();
    static {
        try {
            upstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            upstream.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
            upstream.createContext("/v1/chat/completions", exchange -> {
                calls.incrementAndGet();
                received = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                authorization = exchange.getRequestHeaders().getFirst("Authorization");
                method = exchange.getRequestMethod();
                String body = response;
                int status = upstreamStatus;
                try {
                    Thread.sleep(delay);
                    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(status, bytes.length);
                    exchange.getResponseBody().write(bytes);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                } finally {
                    exchange.close();
                }
            });
            upstream.start();
        } catch (Exception ex) {
            throw new ExceptionInInitializerError(ex);
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("vllm.base-url", () -> "http://127.0.0.1:" + upstream.getAddress().getPort());
        registry.add("vllm.model", () -> "test-model");
        registry.add("vllm.api-key", () -> "test-secret");
        registry.add("vllm.read-timeout", () -> "500ms");
        registry.add("vllm.system-prompt", () -> "classpath:prompts/test-system.txt");
    }

    @Autowired WebApplicationContext context;
    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
        response = "{\"id\":\"test\",\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"안녕하세요\"}}]}";
        upstreamStatus = 200;
        delay = 0;
        calls.set(0);
    }

    @AfterAll static void stop() { upstream.stop(0); }

    @Test void forwardsQuestionAndReturnsAnswer() throws Exception {
        mvc.perform(post("/api/chat").contentType("application/json")
                .content("{\"message\":\"안녕\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json;charset=UTF-8"))
                .andExpect(content().bytes("{\"answer\":\"안녕하세요\"}".getBytes(StandardCharsets.UTF_8)))
                .andExpect(jsonPath("$.answer").value("안녕하세요"));
        var json = JsonMapper.builder().build().readTree(received);
        assertEquals("test-model", json.get("model").asText());
        assertFalse(json.get("stream").asBoolean());
        assertEquals(2, json.get("messages").size());
        assertEquals("system", json.get("messages").get(0).get("role").asText());
        assertEquals("테스트용 시스템 지침입니다.\n한국어로 답변하세요.",
                json.get("messages").get(0).get("content").asText().replace("\r\n", "\n"));
        assertEquals("안녕", json.get("messages").get(1).get("content").asText());
        assertEquals("user", json.get("messages").get(1).get("role").asText());
        assertEquals("Bearer test-secret", authorization);
        assertEquals("POST", method);
    }

    @Test void forwardsConversationHistory() throws Exception {
        String messages = "[{\"role\":\"system\",\"content\":\"도우미\"},{\"role\":\"user\",\"content\":\"질문\"}]";
        mvc.perform(post("/api/chat").contentType("application/json")
                .content("{\"messages\":" + messages + "}"))
                .andExpect(status().isOk());
        var mapper = JsonMapper.builder().build();
        var actual = mapper.readTree(received).get("messages");
        var history = mapper.readTree(messages);
        assertEquals(3, actual.size());
        assertEquals("system", actual.get(0).get("role").asText());
        for (int i = 0; i < history.size(); i++) {
            assertEquals(history.get(i), actual.get(i + 1));
        }
    }

    @Test void doesNotAccumulateMessagesAcrossRequests() throws Exception {
        for (String question : new String[]{"첫 질문", "두 번째 질문"}) {
            mvc.perform(post("/api/chat").contentType("application/json")
                    .content("{\"message\":\"" + question + "\"}"))
                    .andExpect(status().isOk());
            var messages = JsonMapper.builder().build().readTree(received).get("messages");
            assertEquals(2, messages.size());
            assertEquals("system", messages.get(0).get("role").asText());
            assertEquals(question, messages.get(1).get("content").asText());
        }
    }

    @Test void rejectsInvalidRequestsBeforeCallingVllm() throws Exception {
        for (String body : new String[]{"{}", "{\"message\":\" \"}", "{\"messages\":[]}",
                "{\"messages\":[null]}", "{\"messages\":[{\"role\":\"bad\",\"content\":\"hi\"}]}",
                "{\"message\":\"hi\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}", "{"}) {
            mvc.perform(post("/api/chat").contentType("application/json").content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentType("application/json;charset=UTF-8"))
                    .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        }
        assertEquals(0, calls.get());
    }

    @Test void hidesUpstreamErrors() throws Exception {
        upstreamStatus = 401;
        response = "{\"error\":\"private upstream details\"}";
        mvc.perform(post("/api/chat").contentType("application/json").content("{\"message\":\"hi\"}"))
                .andExpect(status().isBadGateway()).andExpect(jsonPath("$.code").value("VLLM_UPSTREAM_ERROR"))
                .andExpect(content().contentType("application/json;charset=UTF-8"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private"))));
    }

    @Test void rejectsMalformedUpstreamResponses() throws Exception {
        for (String body : new String[]{"not json", "{\"choices\":[]}", "{\"choices\":[{\"message\":{}}]}"}) {
            response = body;
            mvc.perform(post("/api/chat").contentType("application/json").content("{\"message\":\"hi\"}"))
                    .andExpect(status().isBadGateway()).andExpect(jsonPath("$.code").value("VLLM_INVALID_RESPONSE"));
        }
    }

    @Test void returnsGatewayTimeout() throws Exception {
        delay = 1500;
        mvc.perform(post("/api/chat").contentType("application/json").content("{\"message\":\"hi\"}"))
                .andExpect(status().isGatewayTimeout()).andExpect(jsonPath("$.code").value("VLLM_TIMEOUT"));
    }

    @Test void allowsConfiguredFrontendAndRejectsOtherOrigins() throws Exception {
        mvc.perform(options("/api/chat").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/chat").header("Origin", "https://untrusted.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}
