package com.medical.patientservice.controller;

import com.medical.patientservice.dto.PatientDTO;
import com.medical.patientservice.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Patient operations.
 * Exposes endpoints under /patients.
 *
 * All input validation is triggered via @Valid annotation.
 * HTTP status codes follow REST conventions:
 *   - 200 OK for GET/PUT
 *   - 201 Created for POST
 *   - 204 No Content for DELETE
 */
@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@Slf4j
public class PatientController {

    private final PatientService patientService;

    /**
     * POST /patients
     * Create a new patient.
     */
    @PostMapping
    public ResponseEntity<PatientDTO.Response> createPatient(
            @Valid @RequestBody PatientDTO.Request request) {
        log.info("REST POST /patients - Creating patient: {}", request.getEmail());
        PatientDTO.Response response = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /patients
     * Retrieve all patients.
     */
    @GetMapping
    public ResponseEntity<List<PatientDTO.Response>> getAllPatients() {
        log.info("REST GET /patients - Fetching all patients");
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    /**
     * GET /patients/{id}
     * Retrieve a specific patient by their ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO.Response> getPatientById(@PathVariable Long id) {
        log.info("REST GET /patients/{} - Fetching patient", id);
        return ResponseEntity.ok(patientService.getPatientById(id));
    }

    /**
     * PUT /patients/{id}
     * Update an existing patient by ID.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO.Response> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody PatientDTO.Request request) {
        log.info("REST PUT /patients/{} - Updating patient", id);
        return ResponseEntity.ok(patientService.updatePatient(id, request));
    }

    /**
     * DELETE /patients/{id}
     * Delete a patient by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        log.info("REST DELETE /patients/{} - Deleting patient", id);
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
