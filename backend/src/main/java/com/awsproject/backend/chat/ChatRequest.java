package com.awsproject.backend.chat;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @Size(max = 32000) String message,
        @Size(min = 1, max = 100) List<@NotNull @Valid Message> messages) {

    @AssertTrue(message = "Provide either a non-blank message or non-empty messages, but not both")
    public boolean isInputValid() {
        return message != null
                ? !message.isBlank() && messages == null
                : messages != null && !messages.isEmpty();
    }

    public List<Message> conversation() {
        return message != null ? List.of(new Message("user", message)) : messages;
    }

    public record Message(
            @NotBlank @Pattern(regexp = "system|user|assistant") String role,
            @NotBlank @Size(max = 32000) String content) {}
}
