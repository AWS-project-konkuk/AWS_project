package com.awsproject.backend.chat;

public record ChatAiResponse(
        String status,
        String answer,
        String example,
        Source source) {

    public record Source(String lessonId, String lessonTitle, String heading) {
    }

    public static ChatAiResponse fallback() {
        return new ChatAiResponse(
                "fallback",
                "지금은 답변을 만들지 못했어요. 질문을 조금 더 짧게 다시 해 주세요.",
                null,
                null);
    }
}
