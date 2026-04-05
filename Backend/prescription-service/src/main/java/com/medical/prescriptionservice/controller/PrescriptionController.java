package com.medical.prescriptionservice.controller;

import com.medical.prescriptionservice.dto.CreatePrescriptionRequest;
import com.medical.prescriptionservice.dto.PrescriptionDTO;
import com.medical.prescriptionservice.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<PrescriptionDTO> createPrescription(@Valid @RequestBody CreatePrescriptionRequest request) {
        return new ResponseEntity<>(prescriptionService.createPrescription(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctor(doctorId));
    }
}
