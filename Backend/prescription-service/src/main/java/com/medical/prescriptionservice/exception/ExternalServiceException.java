package com.medical.prescriptionservice.exception;

public class ExternalServiceException extends RuntimeException {
    public ExternalServiceException(String message) {
        super(message);
    }
}
