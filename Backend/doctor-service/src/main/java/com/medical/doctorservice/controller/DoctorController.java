package com.medical.doctorservice.controller;

import com.medical.doctorservice.dto.DoctorDTO;
import com.medical.doctorservice.dto.PageResponse;
import com.medical.doctorservice.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Doctor CRUD operations.
 */
@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
@Slf4j
public class DoctorController {

    private final DoctorService doctorService;

    /** POST /doctors */
    @PostMapping
    public ResponseEntity<DoctorDTO.Response> createDoctor(
            @Valid @RequestBody DoctorDTO.Request request) {
        log.info("REST POST /doctors - Creating doctor: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.createDoctor(request));
    }

    /**
     * GET /doctors
     * A page of doctors, optionally narrowed by a search term.
     */
    @GetMapping
    public ResponseEntity<PageResponse<DoctorDTO.Response>> getDoctors(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        log.info("REST GET /doctors - page={} size={} q={}",
                pageable.getPageNumber(), pageable.getPageSize(), q);
        return ResponseEntity.ok(doctorService.getDoctors(q, pageable));
    }

    /**
     * GET /doctors/batch?ids=1,2,3
     * Several doctors in one call, so a caller enriching a list does not have
     * to make one request per row.
     */
    @GetMapping("/batch")
    public ResponseEntity<List<DoctorDTO.Response>> getDoctorsByIds(
            @RequestParam List<Long> ids) {
        log.info("REST GET /doctors/batch - {} ids", ids.size());
        return ResponseEntity.ok(doctorService.getDoctorsByIds(ids));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO.Response> getDoctorById(@PathVariable Long id) {
        log.info("REST GET /doctors/{}", id);
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    /** PUT /doctors/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<DoctorDTO.Response> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody DoctorDTO.Request request) {
        log.info("REST PUT /doctors/{}", id);
        return ResponseEntity.ok(doctorService.updateDoctor(id, request));
    }

    /** DELETE /doctors/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        log.info("REST DELETE /doctors/{}", id);
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
