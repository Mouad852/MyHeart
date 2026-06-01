package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import com.medical.appointmentservice.exception.ExternalServiceException;
import org.springframework.stereotype.Component;

@Component
public class PatientClientFallback implements PatientClient {

    @Override
    public PatientInfo getPatientById(Long id) {
        throw new ExternalServiceException("Patient service is currently unavailable. Cannot validate patient id=" + id);
    }
}
