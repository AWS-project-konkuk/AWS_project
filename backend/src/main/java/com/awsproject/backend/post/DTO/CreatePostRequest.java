package com.awsproject.backend.post.DTO;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.JsonNode;


public record CreatePostRequest(
    @NotBlank String author,
    @NotBlank String password,
    @NotBlank String title,
    @NotBlank String body,
    JsonNode workflow) {
}
