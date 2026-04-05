package com.medical.appointmentservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a call to an external microservice (patient-service or doctor-service)
 * fails or the target resource is not found in the remote service.
 * Maps to HTTP 422 Unprocessable Entity — the request was valid but we couldn't
 * complete it due to a dependency failure.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class ExternalServiceException extends RuntimeException {
    public ExternalServiceException(String message) {
        super(message);
    }
}
