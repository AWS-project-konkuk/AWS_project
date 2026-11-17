package com.awsproject.backend.chat.DTO;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public record ExplainRequest(
    String lessonId,
    String question,
    String[] options,
    int correct,
    String explanation,
    int selected,
    @NotBlank 
    @Size(max =32000) 
    String reason) {
    
}
