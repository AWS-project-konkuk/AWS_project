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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validationError(MethodArgumentNotValidException ex) {
        boolean hasInvalidWorkflowFormat = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .anyMatch(error -> "ValidWorkflow".equals(error.getCode()));
        boolean hasInvalidWorkflowRequirements = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .anyMatch(error -> "ValidWorkflowRequirements".equals(error.getCode()));

        if (!hasInvalidWorkflowFormat && hasInvalidWorkflowRequirements) {
            return ResponseEntity.unprocessableEntity().contentType(JSON_UTF8)
                    .body(new ApiError(
                            "WORKFLOW_REQUIREMENTS_NOT_MET",
                            "워크플로우에는 엔티티가 2개 이상, 연결이 1개 이상 필요합니다."
                    ));
        }

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("요청 값을 확인해주세요.");

        return ResponseEntity.badRequest().contentType(JSON_UTF8)
                .body(new ApiError("INVALID_REQUEST", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformedRequest(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().contentType(JSON_UTF8)
                .body(new ApiError("INVALID_REQUEST",
                        "요청 본문의 JSON 형식과 필드 타입을 확인해주세요."));
    }

    public record ApiError(String code, String message) {}
}
