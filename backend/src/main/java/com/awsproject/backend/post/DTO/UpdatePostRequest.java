package com.awsproject.backend.post.DTO;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.JsonNode;

public record UpdatePostRequest ( 
    @NotBlank String password,
    String title,
    String body,
    JsonNode workflow) {
}
