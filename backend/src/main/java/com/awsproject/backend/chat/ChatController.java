package com.awsproject.backend.chat;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
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
}
