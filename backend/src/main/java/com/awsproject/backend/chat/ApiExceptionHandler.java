package com.awsproject.backend.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final MediaType JSON_UTF8 = MediaType.parseMediaType("application/json;charset=UTF-8");
    @ExceptionHandler(VllmException.class)
    public ResponseEntity<ApiError> vllm(VllmException ex) {
        return ResponseEntity.status(ex.status()).contentType(JSON_UTF8)
                .body(new ApiError(ex.code(), ex.getMessage()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ApiError> invalidRequest(Exception ex) {
        return ResponseEntity.badRequest().contentType(JSON_UTF8).body(new ApiError("INVALID_REQUEST",
                "message 또는 messages 중 하나를 올바른 JSON 형식으로 보내주세요."));
    }

    public record ApiError(String code, String message) {}
}
