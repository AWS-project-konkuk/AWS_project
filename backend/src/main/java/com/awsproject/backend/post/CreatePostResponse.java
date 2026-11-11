package com.awsproject.backend.post;

import java.time.OffsetDateTime;
import java.util.UUID;

public class CreatePostResponse {
    UUID id;
    String author;
    String title;
    OffsetDateTime createdAt;

    public CreatePostResponse(UUID id, String author, String title, OffsetDateTime createdAt) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.createdAt = createdAt;
    }
}
