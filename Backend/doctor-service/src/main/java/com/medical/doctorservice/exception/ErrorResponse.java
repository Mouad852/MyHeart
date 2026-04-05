package com.medical.doctorservice.exception;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ErrorResponse {
    private String timestamp;
    private int status;
    private String error;
    private String message;
}
