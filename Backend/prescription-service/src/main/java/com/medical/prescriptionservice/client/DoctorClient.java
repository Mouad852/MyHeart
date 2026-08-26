package com.medical.prescriptionservice.client;

import com.medical.prescriptionservice.dto.PartyInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "doctor-service")
public interface DoctorClient {

    @GetMapping("/doctors/{id}")
    PartyInfo.Doctor getDoctorById(@PathVariable Long id);
}
