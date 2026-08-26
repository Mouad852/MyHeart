package com.medical.patientservice.controller;

import com.medical.patientservice.dto.PageResponse;
import com.medical.patientservice.dto.PatientDTO;
import com.medical.patientservice.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Patient operations.
 * Exposes endpoints under /patients.
 *
 * Read access is guarded by {@link com.medical.patientservice.security.PatientAccessGuard}:
 * staff may read any record, a patient may read only their own. Write access is
 * restricted by role in SecurityConfig.
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
     * A page of patients, newest first, optionally narrowed by a search term.
     *
     * Paged rather than unbounded: a clinic with ten thousand patients should
     * not send all of them to fill one screen.
     *
     * @param q free text matched against name, email and phone
     */
    @GetMapping
    @PreAuthorize("@patientAccess.canReadAll(authentication)")
    public ResponseEntity<PageResponse<PatientDTO.Response>> getPatients(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        log.info("REST GET /patients - page={} size={} q={}",
                pageable.getPageNumber(), pageable.getPageSize(), q);
        return ResponseEntity.ok(patientService.getPatients(q, pageable));
    }

    /**
     * GET /patients/batch?ids=1,2,3
     * Several patients in one call.
     *
     * Exists so that appointment-service can enrich a page of appointments with
     * one request instead of one per row.
     */
    @GetMapping("/batch")
    @PreAuthorize("@patientAccess.canReadAll(authentication)")
    public ResponseEntity<List<PatientDTO.Response>> getPatientsByIds(
            @RequestParam List<Long> ids) {
        log.info("REST GET /patients/batch - {} ids", ids.size());
        return ResponseEntity.ok(patientService.getPatientsByIds(ids));
    }

    /**
     * GET /patients/{id}
     * Retrieve a specific patient by their ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@patientAccess.canRead(#id, authentication)")
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
