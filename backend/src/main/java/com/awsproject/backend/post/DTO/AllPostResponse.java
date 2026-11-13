package com.awsproject.backend.post.DTO;

import java.time.OffsetDateTime;
import java.util.UUID;

import tools.jackson.databind.JsonNode;

public record AllPostResponse (
    UUID id,
    String author,
    String title,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    JsonNode workflow)
{}
