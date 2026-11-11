package com.awsproject.backend.post;

import tools.jackson.databind.JsonNode;

public record CreatePostRequest(
    String author,
    String password,
    String title,
    String body,
    JsonNode workflow) {
}
