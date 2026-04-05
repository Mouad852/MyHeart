package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fallback implementation for PatientClient.
 *
 * When the Patient Service is unreachable or returns an error,
 * Feign will invoke this fallback instead of propagating the exception.
 *
 * This is a basic circuit-breaker pattern — it prevents cascading failures
 * across the system.
 *
 * Note: For production, use Spring Cloud Circuit Breaker (Resilience4j)
 * for more advanced retry, timeout, and fallback policies.
 */
@Component
@Slf4j
public class PatientClientFallback implements PatientClient {

    @Override
    public PatientInfo getPatientById(Long id) {
        log.warn("Patient service unavailable. Returning fallback for patient ID: {}", id);
        return PatientInfo.builder()
                .id(id)
                .name("Patient service unavailable")
                .email("N/A")
                .phone("N/A")
                .build();
    }
}
