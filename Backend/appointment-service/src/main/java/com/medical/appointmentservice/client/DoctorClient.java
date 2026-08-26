package com.medical.appointmentservice.client;

import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collection;
import java.util.List;

/**
 * Feign Client for the Doctor Service.
 * Resolves "doctor-service" via Eureka service registry.
 */
@FeignClient(name = "doctor-service", fallbackFactory = DoctorClientFallbackFactory.class)
public interface DoctorClient {

    /**
     * Calls GET http://doctor-service/doctors/{id}
     */
    @GetMapping("/doctors/{id}")
    DoctorInfo getDoctorById(@PathVariable("id") Long id);

    /**
     * Calls GET http://doctor-service/doctors/batch?ids=1,2,3
     *
     * One request for a whole page of appointments, instead of one per row.
     */
    @GetMapping("/doctors/batch")
    List<DoctorInfo> getDoctorsByIds(@RequestParam("ids") Collection<Long> ids);
}
