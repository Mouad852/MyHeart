package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import com.medical.appointmentservice.exception.ExternalServiceException;
import org.springframework.stereotype.Component;

@Component
public class DoctorClientFallback implements DoctorClient {

    @Override
    public DoctorInfo getDoctorById(Long id) {
        throw new ExternalServiceException("Doctor service is currently unavailable. Cannot validate doctor id=" + id);
    }
}
