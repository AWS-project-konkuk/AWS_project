package com.awsproject.backend.post.DTO;

import jakarta.validation.constraints.NotBlank;
public record DeletePostRequest(
    @NotBlank String password
) {}
