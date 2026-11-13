package com.awsproject.backend.post.DTO;

import java.util.UUID;

import tools.jackson.databind.JsonNode;

import java.time.OffsetDateTime;

public record AllPostResponse (
    UUID id,
    String author,
    String title,
    String body,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    JsonNode workflow)
{}
