package com.awsproject.backend.chat;

import org.springframework.http.HttpStatus;

public class VllmException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public VllmException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
}
