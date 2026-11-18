package com.awsproject.backend.chat.DTO;

public record HintResponse(
    String status,
    String errorBasis,
    String conecpt,
    String hint,
    String display
) {
    
}
