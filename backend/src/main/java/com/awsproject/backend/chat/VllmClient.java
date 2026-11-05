package com.awsproject.backend.chat;

import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

@Component
public class VllmClient {
    private final RestClient client;
    private final String model;
    private final String systemPrompt;

    public VllmClient(
            @Value("${vllm.base-url}") String baseUrl,
            @Value("${vllm.model}") String model,
            @Value("${vllm.api-key}") String apiKey,
            @Value("${vllm.connect-timeout}") Duration connectTimeout,
            @Value("${vllm.read-timeout}") Duration readTimeout,
            @Value("${vllm.system-prompt:classpath:prompts/system.txt}") Resource promptResource) throws IOException {
        this.model = model;
        this.systemPrompt = promptResource.getContentAsString(StandardCharsets.UTF_8).strip();
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(connectTimeout).build());
        factory.setReadTimeout(readTimeout);
        var builder = RestClient.builder().baseUrl(baseUrl.replaceAll("/+$", ""))
                .requestFactory(factory);
        if (!apiKey.isBlank()) {
            builder.defaultHeader("Authorization", "Bearer " + apiKey);
        }
        this.client = builder.build();
    }

    public String complete(ChatRequest request) {
        if (model.isBlank()) {
            throw new VllmException(HttpStatus.SERVICE_UNAVAILABLE, "VLLM_NOT_CONFIGURED",
                    "vLLM 모델이 설정되지 않았습니다.");
        }
        try {
            // Build a fresh list for every request; no conversation is stored here.
            var messages = new ArrayList<ChatRequest.Message>();
            if (!systemPrompt.isBlank()) {
                messages.add(new ChatRequest.Message("system", systemPrompt));
            }
            messages.addAll(request.conversation());
            var response = client.post().uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                    .body(Map.of("model", model, "messages", messages, "stream", false))
                    .retrieve().body(Completion.class);
            if (response == null || response.choices() == null || response.choices().isEmpty()
                    || response.choices().getFirst() == null
                    || response.choices().getFirst().message() == null
                    || response.choices().getFirst().message().content() == null) {
                throw new VllmException(HttpStatus.BAD_GATEWAY, "VLLM_INVALID_RESPONSE",
                        "vLLM 응답에 답변이 없습니다.");
            }
            return response.choices().getFirst().message().content();
        } catch (ResourceAccessException ex) {
            for (Throwable cause = ex; cause != null; cause = cause.getCause()) {
                if (cause instanceof HttpTimeoutException || cause instanceof SocketTimeoutException) {
                    throw new VllmException(HttpStatus.GATEWAY_TIMEOUT, "VLLM_TIMEOUT",
                            "vLLM 응답 대기 시간이 초과되었습니다.");
                }
            }
            throw new VllmException(HttpStatus.BAD_GATEWAY, "VLLM_UNAVAILABLE",
                    "vLLM 서버에 연결할 수 없습니다.");
        } catch (RestClientResponseException ex) {
            // Do not expose upstream bodies, credentials, or infrastructure details to browsers.
            throw new VllmException(HttpStatus.BAD_GATEWAY, "VLLM_UPSTREAM_ERROR",
                    "vLLM 서버가 요청을 처리하지 못했습니다.");
        } catch (RestClientException ex) {
            throw new VllmException(HttpStatus.BAD_GATEWAY, "VLLM_INVALID_RESPONSE",
                    "vLLM 응답을 해석할 수 없습니다.");
        }
    }

    public record Completion(List<Choice> choices) {}
    public record Choice(Reply message) {}
    public record Reply(String content) {}
}
