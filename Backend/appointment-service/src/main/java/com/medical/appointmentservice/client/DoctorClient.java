package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client for the Doctor Service.
 * Resolves "doctor-service" via Eureka service registry.
 */
@FeignClient(name = "doctor-service", fallback = DoctorClientFallback.class)
public interface DoctorClient {

    /**
     * Calls GET http://doctor-service/doctors/{id}
     */
    @GetMapping("/doctors/{id}")
    DoctorInfo getDoctorById(@PathVariable("id") Long id);
}
