package com.awsproject.backend.post.DTO;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.awsproject.backend.post.Post;

import tools.jackson.databind.JsonNode;

public record AllPostResponse (
    UUID id,
    String author,
    String title,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    JsonNode workflow)
{
    public static AllPostResponse from(Post post) {
        return new AllPostResponse(
            post.getId(),
            post.getAuthor(),
            post.getTitle(),
            post.getCreatedAt(),
            post.getUpdatedAt(),
            post.getWorkflow());
    }
}
