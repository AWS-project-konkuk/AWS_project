package com.awsproject.backend.chat;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.core.io.Resource;

@ConfigurationProperties(prefix = "vllm")
public record VllmProperties(
        @DefaultValue("") String baseUrl,
        @DefaultValue("") String model,
        @DefaultValue("") String apiKey,
        @DefaultValue("5s") Duration connectTimeout,
        @DefaultValue("120s") Duration readTimeout,
        @DefaultValue("classpath:prompts/system.txt") Resource systemPrompt,

        // Qwen3의 <think> 출력 여부
        @DefaultValue("false") boolean enableThinking) {}