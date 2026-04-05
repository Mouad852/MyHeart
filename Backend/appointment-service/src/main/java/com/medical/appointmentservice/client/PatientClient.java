package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client for the Patient Service.
 *
 * How it works:
 * - @FeignClient tells Spring Cloud to create an HTTP client proxy for this interface.
 * - "name" must match the spring.application.name of the patient-service.
 *   Feign uses Eureka to resolve this name to an actual host:port at runtime.
 * - The method signatures mirror the patient-service REST endpoints exactly.
 *
 * No manual HTTP code needed — Spring generates the implementation automatically.
 */
@FeignClient(name = "patient-service", fallback = PatientClientFallback.class)
public interface PatientClient {

    /**
     * Calls GET http://patient-service/patients/{id}
     * Returns patient info or triggers fallback on failure.
     */
    @GetMapping("/patients/{id}")
    PatientInfo getPatientById(@PathVariable("id") Long id);
}
