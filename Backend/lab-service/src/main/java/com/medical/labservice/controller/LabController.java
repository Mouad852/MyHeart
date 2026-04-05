package com.medical.labservice.controller;

import com.medical.labservice.dto.*;
import com.medical.labservice.service.LabService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/labs")
@RequiredArgsConstructor
public class LabController {

    private final LabService labService;

    @PostMapping("/request")
    public ResponseEntity<LabRequestDTO> createLabRequest(@Valid @RequestBody CreateLabRequestDTO request) {
        return new ResponseEntity<>(labService.createLabRequest(request), HttpStatus.CREATED);
    }

    @PostMapping("/result")
    public ResponseEntity<LabResultDTO> submitResult(@Valid @RequestBody CreateLabResultDTO resultDTO) {
        return new ResponseEntity<>(labService.submitLabResult(resultDTO), HttpStatus.CREATED);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<LabRequestDTO>> getRequestsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(labService.getRequestsByPatient(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabRequestDTO> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(labService.getRequestById(id));
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<List<LabResultDTO>> getResultsByRequest(@PathVariable Long id) {
        return ResponseEntity.ok(labService.getResultsByRequest(id));
    }
}
