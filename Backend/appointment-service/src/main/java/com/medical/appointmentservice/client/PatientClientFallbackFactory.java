package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import com.medical.appointmentservice.exception.ExternalServiceException;
import com.medical.appointmentservice.exception.ResourceNotFoundException;
import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

/**
 * Fallback factory for patient-service.
 *
 * See {@link DoctorClientFallbackFactory} for why a FallbackFactory is used here
 * rather than a plain fallback class: only the factory can inspect the cause and
 * tell "patient does not exist" (404) apart from "patient-service is down" (503).
 */
@Component
@Slf4j
public class PatientClientFallbackFactory implements FallbackFactory<PatientClient> {

    @Override
    public PatientClient create(Throwable cause) {
        return new PatientClient() {

            @Override
            public PatientInfo getPatientById(Long patientId) {
                if (cause instanceof FeignException.NotFound) {
                    log.warn("Patient not found with ID: {}", patientId);
                    throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
                }
                log.error("patient-service unavailable while validating patient id={}: {}",
                        patientId, cause.toString());
                throw new ExternalServiceException(
                        "Patient service is currently unavailable. Cannot validate patient id=" + patientId);
            }

            @Override
            public List<PatientInfo> getPatientsByIds(Collection<Long> ids) {
                // Enrichment is decorative: a list of appointments is still
                // useful with names missing, so degrade instead of failing.
                log.warn("patient-service unavailable while enriching {} appointments: {}",
                        ids.size(), cause.toString());
                return List.of();
            }
        };
    }
}
