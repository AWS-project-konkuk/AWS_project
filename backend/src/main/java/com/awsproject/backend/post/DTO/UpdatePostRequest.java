package com.awsproject.backend.post.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import tools.jackson.databind.JsonNode;

import com.awsproject.backend.post.validation.ValidWorkflow;
import com.awsproject.backend.post.validation.ValidWorkflowRequirements;

public record UpdatePostRequest ( 
    @NotBlank String password,
    @Pattern(
        regexp = "(?s).*\\S.*",
        message = "제목은 공백일 수 없습니다."
    ) 
    String title,
    @Pattern(
        regexp = "(?s).*\\S.*",
        message = "내용은 공백일 수 없습니다."
    ) 
    String body,
    @ValidWorkflow
    @ValidWorkflowRequirements
    JsonNode workflow) {
}
