package com.awsproject.backend.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatAiRequest(
        @NotBlank @Size(max = 32000) String question,
        @Size(max = 200) String lessonId) {
}
