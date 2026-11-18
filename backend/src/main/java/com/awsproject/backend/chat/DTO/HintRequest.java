package com.awsproject.backend.chat.DTO;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;

public record HintRequest(
    @NotBlank String lessonId,
    @NotNull JsonNode nodes,
    @NotNull JsonNode edges,
    @NotNull JsonNode settings,
    @NotNull RuleCheck ruleCheck
) {
    public record Lesson(
        @NotBlank String id,
        @NotBlank String takeaway
    ){}
    public record RuleCheck(
        @NotNull Boolean success,
        List<String> issues,
        @JsonProperty("first_failure") String firstFailure
    ){}
    
}
