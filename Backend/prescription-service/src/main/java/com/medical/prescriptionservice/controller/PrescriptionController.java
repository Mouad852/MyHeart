package com.medical.prescriptionservice.controller;

import com.medical.prescriptionservice.dto.CreatePrescriptionRequest;
import com.medical.prescriptionservice.dto.PrescriptionDTO;
import com.medical.common.security.CallerIdentity;
import com.medical.prescriptionservice.service.PrescriptionPrinter;
import com.medical.prescriptionservice.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
@Slf4j
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PrescriptionPrinter printer;
    private final CallerIdentity callerIdentity;

    @PostMapping
    public ResponseEntity<PrescriptionDTO> createPrescription(@Valid @RequestBody CreatePrescriptionRequest request) {
        return new ResponseEntity<>(prescriptionService.createPrescription(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescriptionById(
            @PathVariable Long id, Authentication authentication) {
        PrescriptionDTO prescription = prescriptionService.getPrescriptionById(id);
        // The row has to be read before ownership can be judged, so the check
        // happens here rather than in a @PreAuthorize expression.
        if (!callerIdentity.canRead(prescription.getPatientId(), authentication)) {
            throw new AccessDeniedException("Not permitted to read prescription " + id);
        }
        return ResponseEntity.ok(prescription);
    }

    /**
     * GET /prescriptions/{id}/document
     * The prescription as a printable PDF, the thing a patient actually carries
     * to a pharmacy.
     */
    @GetMapping(value = "/{id}/document", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getPrescriptionDocument(
            @PathVariable Long id, Authentication authentication) {

        PrescriptionDTO prescription = prescriptionService.getPrescriptionById(id);
        if (!callerIdentity.canRead(prescription.getPatientId(), authentication)) {
            throw new AccessDeniedException("Not permitted to print prescription " + id);
        }

        log.info("REST GET /prescriptions/{}/document", id);
        byte[] pdf = printer.print(id);

        return ResponseEntity.ok()
                // "inline" so the browser opens it in a viewer. Someone checking
                // a prescription usually wants to read it, not find it in a
                // downloads folder.
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(printer.filenameFor(id))
                        .build()
                        .toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByPatient(
            @PathVariable Long patientId, Authentication authentication) {
        if (!callerIdentity.canRead(patientId, authentication)) {
            throw new AccessDeniedException("Not permitted to read prescriptions of patient " + patientId);
        }
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctor(doctorId));
    }

    @GetMapping
    public ResponseEntity<List<PrescriptionDTO>> getAllPrescriptions(Authentication authentication) {
        // A patient asking for "all prescriptions" gets their own. The narrowing
        // happens in the query rather than the response, so nothing that is not
        // theirs is ever loaded, let alone serialised.
        if (callerIdentity.isPatientOnly(authentication)) {
            Long own = callerIdentity.patientId(authentication);
            if (own == null) {
                throw new AccessDeniedException("No patient identity in token");
            }
            return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(own));
        }
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }
}
