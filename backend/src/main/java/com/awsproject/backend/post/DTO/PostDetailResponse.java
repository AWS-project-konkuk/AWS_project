package com.awsproject.backend.post.DTO;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.awsproject.backend.post.Post;

import tools.jackson.databind.JsonNode;

public record PostDetailResponse(
    UUID id,
    String author,
    String title,
    String body,
    JsonNode workflow,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {
        
    public static PostDetailResponse from(Post post) {
        return new PostDetailResponse(
            post.getId(),
            post.getAuthor(),
            post.getTitle(),
            post.getBody(),
            post.getWorkflow(),
            post.getCreatedAt(),
            post.getUpdatedAt());
    }
}