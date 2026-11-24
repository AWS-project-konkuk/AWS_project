package com.awsproject.backend.post.DTO;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.JsonNode;

import com.awsproject.backend.post.validation.ValidWorkflow;
import com.awsproject.backend.post.validation.ValidWorkflowRequirements;


public record CreatePostRequest(
    @NotBlank String author,
    @NotBlank String password,
    @NotBlank String title,
    @NotBlank String body,
    @ValidWorkflow
    @ValidWorkflowRequirements
    JsonNode workflow) {
}
