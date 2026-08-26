package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import com.medical.appointmentservice.exception.ExternalServiceException;
import com.medical.appointmentservice.exception.ResourceNotFoundException;
import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for doctor-service.
 *
 * A plain `fallback` class cannot see why it was triggered, so a 404 (the doctor
 * does not exist) and a genuine outage become indistinguishable — both would be
 * reported to the caller as "service unavailable".
 *
 * FallbackFactory receives the cause, so a missing doctor is reported as 404 and
 * only real failures are reported as 503.
 */
@Component
@Slf4j
public class DoctorClientFallbackFactory implements FallbackFactory<DoctorClient> {

    @Override
    public DoctorClient create(Throwable cause) {
        return doctorId -> {
            if (cause instanceof FeignException.NotFound) {
                log.warn("Doctor not found with ID: {}", doctorId);
                throw new ResourceNotFoundException("Doctor not found with ID: " + doctorId);
            }
            log.error("doctor-service unavailable while validating doctor id={}: {}", doctorId, cause.toString());
            throw new ExternalServiceException(
                    "Doctor service is currently unavailable. Cannot validate doctor id=" + doctorId);
        };
    }
}
