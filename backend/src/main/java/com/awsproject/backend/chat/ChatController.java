package com.awsproject.backend.chat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.awsproject.backend.chat.DTO.ExplainRequest;
import com.awsproject.backend.chat.DTO.ExplainResponse;
import com.awsproject.backend.chat.DTO.HintRequest;
import com.awsproject.backend.chat.DTO.HintResponse;

import jakarta.validation.Valid;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final VllmClient client;
    private final ObjectMapper objectMapper;

    public ChatController(VllmClient client, ObjectMapper objectMapper) {
        this.client = client;
        this.objectMapper = objectMapper;
    }

    // Explicit charset also supports clients such as Windows PowerShell 5.1.
    @PostMapping(produces = "application/json;charset=UTF-8")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return new ChatResponse(client.complete(request));
    }

    public record ChatResponse(String answer) {}

    @PostMapping("/ai/explain")
    public ExplainResponse explain(@Valid @RequestBody ExplainRequest request) {
        if(request.options().length < 2){
            throw new IllegalStateException("옵션이 2개 이상이어야 합니다.");
        }
        if (request.correct() < 0 || request.correct() >= request.options().length) {
            throw new IllegalArgumentException("올바르지 않은 정답 인덱스입니다.");
        }
        String correctOption = request.options()[request.correct()];

        Map<String, Object> userData = new LinkedHashMap<>();

        String wrongOption = request.options()[
            request.correct() == 0 ? 1 : 0
        ];

        userData.put("question", request.question());
        userData.put("correct_option", correctOption);
        userData.put("explanation", request.explanation());
        userData.put("student_answer", request.reason());
        userData.put("wrong_option_not_student", wrongOption);

        Map<String, Object> explainSchema = Map.of(
            "type", "object",
            "properties", Map.of(
                "compare", Map.of(
                    "type", "string",
                    "maxLength",300
                ),
                "verdict", Map.of(
                "type", "string",
                "enum", List.of("정확", "부분 정확", "오개념")
                ),
            "feedback", Map.of(
                "type", "string",
                "maxLength", 250
                )
            ),
            "required", List.of("compare", "verdict", "feedback")
        );

        try {
            String userPrompt = objectMapper.writeValueAsString(userData);
            ChatRequest aiRequest = new ChatRequest(userPrompt, null);
            Map<String, Object> result = client.ask(aiRequest, explainSchema, "explain", 0.2);
            String verdict = (String) result.get("verdict");
            String feedback = (String) result.get("feedback");
            String display = "정확".equals(verdict) ? "correct" : "needs_work";
            if(verdict == null || feedback == null){
                throw new IllegalStateException("AI응답을 JSON으로 변환하지 못했습니다.");
            }
            ExplainResponse response = new ExplainResponse("ok", verdict, display, feedback);
            return response;
        } catch (JacksonException e) {
            throw new IllegalStateException(
        "User Prompt JSON 생성에 실패했습니다.", e);
        } catch (AiResponseException e) {
            return new ExplainResponse(
                "fallback",
                null,
                null,
                "지금은 답안을 평가하지 못했어요"
            );
        }
    }

    @PostMapping("/ai/hint")
    public HintResponse hint(@Valid @RequestBody HintRequest request) {
        if (!request.nodes().isArray()
                || !request.edges().isArray()
                || !request.settings().isObject()) {
            throw new IllegalArgumentException(
                "nodes와 edges는 배열, settings는 객체여야 합니다."
            );
        }

        if(Boolean.TRUE.equals(request.ruleCheck().success())){
            String display = "모든 단계가 성공했어요! 이번 실습의 목표를 달성했습니다.";
            return new HintResponse("ok", "", "", "", display);
        }

        Map<String, Object> ruleCheckData = new LinkedHashMap<>();

        ruleCheckData.put("success", request.ruleCheck().success());
        ruleCheckData.put("issues", request.ruleCheck().issues());
        ruleCheckData.put(
            "first_failure",
            request.ruleCheck().firstFailure()
        );

        Map<String, Object> userData = new LinkedHashMap<>();

        userData.put("lessonId", request.lessonId());
        userData.put("nodes", request.nodes());
        userData.put("edges", request.edges());
        userData.put("settings", request.settings());
        userData.put("ruleCheck", request.ruleCheck());

        Map<String, Object> hintSchema = Map.of(
            "type", "object",
            "properties", Map.of(
                "error_basis", Map.of(
                    "type", "string",
                    "maxLength", 120
                ),
                "concept", Map.of(
                    "type", "string",
                    "maxLength", 200
                ),
                "hint", Map.of(
                    "type", "string",
                    "maxLength", 160
                )
            ),
            "required", List.of("error_basis", "concept", "hint")
        );

        try{
            String userPrompt = objectMapper.writeValueAsString(userData);
            ChatRequest aiRequest = new ChatRequest(userPrompt, null);
            Map<String, Object> result = client.ask(aiRequest, hintSchema, "hint", 0.2);
            String errorBasis = (String) result.get("error_basis");
            String concept = (String) result.get("concept");
            String hint = (String) result.get("hint");
            if(errorBasis == null || concept == null || hint == null){
                throw new IllegalStateException("AI응답을 JSON으로 변환하지 못했습니다.");
            }
            String display = (concept + " " + hint).strip();
            HintResponse response = new HintResponse("ok", errorBasis, concept, hint, display);
            return response;
        } catch (JacksonException e) {
            throw new IllegalStateException("Hint User Prompt JSON 생성에 실패했습니다.", e);
        } catch (AiResponseException e) {
            String concept = "지금은 힌트를 만들지 못했어요";

            String hint = "실행 결과의 실패 단계 설명을 다시 읽어볼까요?";
            return new HintResponse("fallback", "", concept, hint, concept + " " + hint);
        }
    }

    @PostMapping("/ai/chat")
    public ChatAiResponse chatWithAI(@Valid @RequestBody ChatAiRequest request) {
        try {
            return client.askChat(request.question(), request.lessonId());
        } catch (AiResponseException exception) {
            return ChatAiResponse.fallback();
        }
    }
}
