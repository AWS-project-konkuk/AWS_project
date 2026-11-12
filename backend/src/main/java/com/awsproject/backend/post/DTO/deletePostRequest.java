package com.awsproject.backend.post.DTO;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
public record deletePostRequest(
    @NotBlank UUID id,
    @NotBlank String password
) {}
