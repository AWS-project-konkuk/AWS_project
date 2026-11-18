package com.awsproject.backend.chat;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.GZIPInputStream;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

public final class LectureRetriever {
    private static final int RESULT_COUNT = 5;
    private static final int MAX_PER_LESSON = 2;
    private static final double K1 = 1.2;
    private static final double B = 0.75;

    private final List<IndexedSection> sections;
    private final Map<String, Double> inverseDocumentFrequency;
    private final double averageLength;

    public LectureRetriever(ObjectMapper objectMapper) {
        List<Section> corpus = readCorpus(objectMapper);
        var documentFrequency = new HashMap<String, Integer>();
        var indexed = new ArrayList<IndexedSection>(corpus.size());
        long totalLength = 0;

        for (Section section : corpus) {
            Map<String, Integer> frequencies = termFrequencies(
                    section.lesson() + " " + section.lessonTitle() + " "
                            + section.heading() + " " + section.text());
            int length = frequencies.values().stream().mapToInt(Integer::intValue).sum();
            totalLength += length;
            frequencies.keySet().forEach(term -> documentFrequency.merge(term, 1, Integer::sum));
            indexed.add(new IndexedSection(section, frequencies, length));
        }

        this.sections = List.copyOf(indexed);
        this.averageLength = sections.isEmpty() ? 1.0 : (double) totalLength / sections.size();
        this.inverseDocumentFrequency = new HashMap<>();
        int documentCount = sections.size();
        documentFrequency.forEach((term, count) -> inverseDocumentFrequency.put(term,
                Math.log(1.0 + (documentCount - count + 0.5) / (count + 0.5))));
    }

    public List<Section> search(String query, String lessonId) {
        Set<String> queryTerms = new HashSet<>(bigrams(query));
        var scores = new ArrayList<ScoredSection>(sections.size());
        for (IndexedSection indexed : sections) {
            double score = 0.0;
            for (String term : queryTerms) {
                int frequency = indexed.termFrequencies().getOrDefault(term, 0);
                if (frequency == 0) {
                    continue;
                }
                double lengthNormalization = 1.0 - B + B * indexed.length() / averageLength;
                score += inverseDocumentFrequency.getOrDefault(term, 0.0)
                        * frequency * (K1 + 1.0) / (frequency + K1 * lengthNormalization);
            }
            if (lessonId != null && !lessonId.isBlank()
                    && lessonId.equals(indexed.section().lesson())) {
                score *= 1.1;
            }
            scores.add(new ScoredSection(indexed.section(), score));
        }
        scores.sort(Comparator.comparingDouble(ScoredSection::score).reversed());

        var result = new ArrayList<Section>(RESULT_COUNT);
        var seenText = new LinkedHashSet<String>();
        var perLesson = new HashMap<String, Integer>();
        for (ScoredSection scored : scores) {
            Section section = scored.section();
            String duplicateKey = section.text().substring(0, Math.min(80, section.text().length()));
            if (!seenText.add(duplicateKey)
                    || perLesson.getOrDefault(section.lesson(), 0) >= MAX_PER_LESSON) {
                continue;
            }
            perLesson.merge(section.lesson(), 1, Integer::sum);
            result.add(section);
            if (result.size() == RESULT_COUNT) {
                break;
            }
        }
        return List.copyOf(result);
    }

    private static List<Section> readCorpus(ObjectMapper objectMapper) {
        byte[] compressed = Base64.getDecoder().decode(LectureCorpus.GZIP_BASE64);
        try (var gzip = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            return objectMapper.readValue(gzip, new TypeReference<List<Section>>() {
            });
        } catch (IOException exception) {
            throw new IllegalStateException("강의 검색 색인을 읽을 수 없습니다.", exception);
        }
    }

    private static Map<String, Integer> termFrequencies(String text) {
        var frequencies = new HashMap<String, Integer>();
        bigrams(text).forEach(term -> frequencies.merge(term, 1, Integer::sum));
        return frequencies;
    }

    static List<String> bigrams(String text) {
        String normalized = text.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        var result = new ArrayList<String>(Math.max(0, normalized.length() - 1));
        for (int i = 0; i + 1 < normalized.length(); i++) {
            result.add(normalized.substring(i, i + 2));
        }
        return result;
    }

    public record Section(
            String id,
            String lesson,
            String unit,
            @JsonProperty("lesson_title") String lessonTitle,
            String heading,
            String text) {
    }

    private record IndexedSection(Section section, Map<String, Integer> termFrequencies, int length) {
    }

    private record ScoredSection(Section section, double score) {
    }
}
