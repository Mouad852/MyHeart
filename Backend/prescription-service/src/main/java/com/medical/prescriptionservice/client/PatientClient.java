package com.medical.prescriptionservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "patient-service")
public interface PatientClient {

    @GetMapping("/patients/{id}")
    Object getPatientById(@PathVariable Long id);
}
