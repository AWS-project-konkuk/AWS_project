package com.awsproject.backend.chat.DTO;

public record ExplainResponse(
    String status, 
    String verdict, 
    String display,
    String feedback){}
