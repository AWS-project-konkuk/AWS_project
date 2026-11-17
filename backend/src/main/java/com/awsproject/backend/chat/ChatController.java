package com.awsproject.backend.chat;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import com.awsproject.backend.chat.DTO.ExplainRequest;
import com.awsproject.backend.chat.DTO.ExplainResponse;

@RestController
@RequestMapping("/api")
public class ChatController {
    private final VllmClient client;

    public ChatController(VllmClient client) {
        this.client = client;
    }

    // Explicit charset also supports clients such as Windows PowerShell 5.1.
    @PostMapping(produces = "application/json;charset=UTF-8")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return new ChatResponse(client.complete(request));
    }

    public record ChatResponse(String answer) {}

    @PostMapping("/ai/explain")
    public ExplainResponse explain(@Valid @RequestBody ExplainRequest request) {
        return new ExplainResponse("ok", "정확", "correct", "정확하게 이해하셨어요");
    }

    @PostMapping("/ai/hint")
    public ChatResponse hint(@Valid @RequestBody ChatRequest request) {
        return new ChatResponse(null);
    }

    @PostMapping("/ai/chat")
    public ChatResponse chatWithAI(@Valid @RequestBody ChatRequest request) {
        return new ChatResponse(null);
    }
}
