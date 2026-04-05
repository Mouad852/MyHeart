package com.medical.patientservice.exception;

import lombok.*;

/**
 * Standard error response structure returned by the API on exceptions.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private String timestamp;
    private int status;
    private String error;
    private String message;
}
