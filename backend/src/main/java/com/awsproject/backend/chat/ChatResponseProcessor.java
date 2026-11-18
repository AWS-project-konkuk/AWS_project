package com.awsproject.backend.chat;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

final class ChatResponseProcessor {
    private static final Pattern FOLLOW_UP = Pattern.compile(
            "[^.?!]*(?:더 알고 싶|물어보세요|물어봐\\s*주세요|말씀해\\s*주세요|질문해\\s*주세요|궁금한\\s*(?:점|부분)이 있)[^.?!]*[.?!]?\\s*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private ChatResponseProcessor() {
    }

    static String stripFollowUp(String answer) {
        String cleaned = FOLLOW_UP.matcher(answer).replaceAll("").strip();
        return cleaned.isEmpty() ? answer.strip() : cleaned;
    }

    static String dedupeExample(String answer, String example) {
        if (example == null || example.isBlank()) {
            return null;
        }
        Set<String> answerBigrams = bigrams(answer);
        Set<String> exampleBigrams = bigrams(example);
        if (exampleBigrams.isEmpty()) {
            return example.strip();
        }
        var overlap = new HashSet<>(answerBigrams);
        overlap.retainAll(exampleBigrams);
        return (double) overlap.size() / exampleBigrams.size() >= 0.5 ? null : example.strip();
    }

    static Set<String> bigrams(String text) {
        String normalized = text.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        var result = new HashSet<String>();
        for (int i = 0; i + 1 < normalized.length(); i++) {
            result.add(normalized.substring(i, i + 2));
        }
        return result;
    }
}
