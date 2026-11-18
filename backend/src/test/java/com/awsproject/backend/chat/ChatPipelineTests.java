package com.awsproject.backend.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

class ChatPipelineTests {
    @Test
    void bm25FindsRelevantLectureSectionsAndDiversifiesLessons() {
        var retriever = new LectureRetriever(new ObjectMapper());

        var hits = retriever.search("Shadow 배포와 Canary 배포는 뭐가 달라요?", "canary");

        assertEquals(5, hits.size());
        assertTrue(hits.stream().anyMatch(section -> section.lesson().equals("canary")));
        assertTrue(hits.stream().anyMatch(section -> section.lesson().equals("shadow")));
        var counts = hits.stream().collect(Collectors.groupingBy(
                LectureRetriever.Section::lesson, Collectors.counting()));
        assertTrue(counts.values().stream().allMatch(count -> count <= 2));
    }

    @Test
    void removesUnnecessaryFollowUpSentence() {
        String answer = "Canary는 일부 사용자에게 새 모델 응답을 전달합니다. "
                + "더 알고 싶다면 언제든 물어보세요.";

        assertEquals(
                "Canary는 일부 사용자에게 새 모델 응답을 전달합니다.",
                ChatResponseProcessor.stripFollowUp(answer));
    }

    @Test
    void removesExampleWhenItRepeatsTheAnswer() {
        String answer = "EC2는 프로그램을 실행하는 가상 서버입니다.";

        assertNull(ChatResponseProcessor.dedupeExample(
                answer,
                "EC2는 프로그램을 실행하는 서버예요."));
        assertEquals(
                "주방이 재료를 조리하는 것과 비슷해요.",
                ChatResponseProcessor.dedupeExample(
                        answer,
                        "주방이 재료를 조리하는 것과 비슷해요."));
    }
}
