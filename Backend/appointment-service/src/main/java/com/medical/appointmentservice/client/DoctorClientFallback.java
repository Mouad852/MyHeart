package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fallback for DoctorClient when doctor-service is unavailable.
 */
@Component
@Slf4j
public class DoctorClientFallback implements DoctorClient {

    @Override
    public DoctorInfo getDoctorById(Long id) {
        log.warn("Doctor service unavailable. Returning fallback for doctor ID: {}", id);
        return DoctorInfo.builder()
                .id(id)
                .name("Doctor service unavailable")
                .specialty("N/A")
                .email("N/A")
                .build();
    }
}
