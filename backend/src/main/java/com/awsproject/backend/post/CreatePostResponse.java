package com.awsproject.backend.post;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreatePostResponse(UUID id, String author, String title, OffsetDateTime createdAt) {
}
