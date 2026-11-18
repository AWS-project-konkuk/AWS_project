package com.awsproject.backend.chat;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
@EnableConfigurationProperties(VllmProperties.class)
public class VllmClient {
    private final RestClient client;
    private final String model;
    private final String baseUrl;
    private final String systemPrompt;
    private final boolean enableThinking;
    private final ObjectMapper objectMapper;

    public VllmClient(VllmProperties props) throws IOException {
        this.model = props.model();
        this.baseUrl = props.baseUrl().replaceAll("/+$", "");
        this.enableThinking = props.enableThinking();
        this.systemPrompt = props.systemPrompt().getContentAsString(StandardCharsets.UTF_8).strip();
        this.objectMapper = new ObjectMapper();
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(props.connectTimeout())
                .build());
        factory.setReadTimeout(props.readTimeout());
        var builder = RestClient.builder().baseUrl(baseUrl).requestFactory(factory);
        if (!props.apiKey().isBlank()) {
            builder.defaultHeader("Authorization", "Bearer " + props.apiKey());
        }
        this.client = builder.build();
    }

    public String complete(ChatRequest request) {
        if (model.isBlank() || baseUrl.isBlank()) {
            throw new VllmException(HttpStatus.SERVICE_UNAVAILABLE, "VLLM_NOT_CONFIGURED",
                    "vLLM 서버 주소 또는 모델이 설정되지 않았습니다.");
        }
        try {
            // Build a fresh list for every request; no conversation is stored here.
            var messages = new ArrayList<ChatRequest.Message>();
            if (!systemPrompt.isBlank()) {
                messages.add(new ChatRequest.Message("system", systemPrompt));
            }
            messages.addAll(request.conversation());

            var body = new LinkedHashMap<String, Object>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("stream", false);
            body.put("chat_template_kwargs", Map.of("enable_thinking", enableThinking));

            var response = client.post().uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                    .body(body)
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

    public record PostResult(String content, String finishReason){}

    public PostResult post(
        ChatRequest request,
        Map<String, Object> schema,
        String name,
        double temperature
    ){
        try {
            // Build a fresh list for every request; no conversation is stored here.
            var messages = new ArrayList<ChatRequest.Message>();
            if (!systemPrompt.isBlank()) {
                messages.add(new ChatRequest.Message("system", systemPrompt));
                //system prompt 수정 필요
            }
            messages.addAll(request.conversation());

            var body = new LinkedHashMap<String, Object>();
            body.put("model", model);
            body.put("temperature", temperature);
            body.put("max_tokens", 800);
            body.put("messages", messages);
            body.put("stream", false);
            body.put("chat_template_kwargs", Map.of("enable_thinking", enableThinking));
            body.put("response_format", Map.of(
                "type", "json_schema",
                "json_schema", Map.of("name", name, "schema", schema)));

            var response = client.post().uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve().body(Completion.class);
            if (response == null || response.choices() == null || response.choices().isEmpty()
                    || response.choices().getFirst() == null
                    || response.choices().getFirst().message() == null
                    || response.choices().getFirst().message().content() == null
                    || response.choices().getFirst().finishReason() == null) {
                throw new VllmException(HttpStatus.BAD_GATEWAY, "VLLM_INVALID_RESPONSE",
                        "vLLM 응답에 답변이 없습니다.");
            }
            return new PostResult(response.choices().getFirst().message().content(), response.choices().getFirst().finishReason());
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

    private boolean isValidResponse(
        Map<String, Object> parsed,
        String name
    ){
        if(name.equals("explain")){
            if(!parsed.containsKey("verdict") || !parsed.containsKey("feedback")|| !parsed.containsKey("compare")){
                return false;
            }
            if(!(parsed.get("verdict") instanceof String verdict) || !(parsed.get("feedback") instanceof String feedback) || !(parsed.get("compare") instanceof String compare)){
                return false;
            }
            if(!Set.of("정확", "부분 정확", "오개념").contains(verdict) || feedback.length() > 250 || compare.length() > 300){
                return false;
            }
            
            return true;
        }else{
            return false;
        }
            
        
    }

    public Map<String, Object> ask(ChatRequest request, Map<String, Object> schema, String name, double temperature){
        for(int attempt = 0; attempt < 2; attempt++){
            try{
            PostResult result = post(request, schema, name, temperature);
            if("length".equals(result.finishReason())){
                continue;
            }

            Map<String, Object> parsed = objectMapper.readValue(
            result.content(),
            new TypeReference<Map<String, Object>>() {}
            );

            if(!isValidResponse(parsed, name)){
                continue;
            }

            return parsed;
            }catch (JacksonException e){
                if(attempt == 1){
                    throw new AiResponseException("AI 응답 JSON 파싱에 실패했습니다.");
                }
            } 
        }
        throw new AiResponseException("AI 응답 검증에 두번 실패했습니다.");
    } 

    
    public record Completion(List<Choice> choices) {}
    public record Choice(Reply message, @JsonProperty("finish_reason") String finishReason) {}
    public record Reply(String content) {}
}
