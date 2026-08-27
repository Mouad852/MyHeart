package com.medical.labservice.controller;

import com.medical.labservice.dto.*;
import com.medical.common.security.CallerIdentity;
import com.medical.labservice.service.LabAttachment;
import com.medical.labservice.service.LabService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/labs")
@RequiredArgsConstructor
@Slf4j
public class LabController {

    private final LabService labService;
    private final CallerIdentity callerIdentity;

    @PostMapping("/requests")
    public ResponseEntity<LabRequestDTO> createLabRequest(@Valid @RequestBody CreateLabRequestDTO request) {
        return new ResponseEntity<>(labService.createLabRequest(request), HttpStatus.CREATED);
    }

    @PostMapping("/result")
    public ResponseEntity<LabResultDTO> submitResult(@Valid @RequestBody CreateLabResultDTO resultDTO) {
        return new ResponseEntity<>(labService.submitLabResult(resultDTO), HttpStatus.CREATED);
    }

    /**
     * POST /labs/results/{resultId}/file
     * Attach the scanned or exported report to a result.
     *
     * Multipart rather than a JSON body with base64: base64 inflates the
     * payload by a third and forces the whole file through memory as a string,
     * which is a poor trade for the convenience of one content type.
     */
    @PostMapping(value = "/results/{resultId}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LabResultDTO> uploadResultFile(
            @PathVariable Long resultId,
            @RequestPart("file") MultipartFile file) {
        log.info("REST POST /labs/results/{}/file ({} bytes declared as {})",
                resultId, file.getSize(), file.getContentType());
        return ResponseEntity.ok(labService.attachFile(resultId, file));
    }

    /**
     * GET /labs/results/{resultId}/file
     * The attached report.
     *
     * Served as an attachment with nosniff, never inline. These are bytes
     * somebody uploaded, and handing them back for a browser to render in the
     * application's own origin is how an upload feature becomes a stored
     * cross-site scripting hole. The guard only admits PDF, PNG and JPEG, and
     * this header is the second lock on the same door.
     */
    @GetMapping("/results/{resultId}/file")
    public ResponseEntity<byte[]> downloadResultFile(
            @PathVariable Long resultId, Authentication authentication) {

        Long owner = labService.ownerPatientId(resultId);
        if (!callerIdentity.canRead(owner, authentication)) {
            throw new AccessDeniedException("Not permitted to read the report for result " + resultId);
        }

        LabAttachment attachment = labService.getAttachment(resultId);
        log.info("REST GET /labs/results/{}/file", resultId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(attachment.getFilename())
                        .build()
                        .toString())
                .header("X-Content-Type-Options", "nosniff")
                // Nothing here may be executed or framed, whatever it turns out
                // to contain.
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .contentLength(attachment.getSize())
                .body(attachment.getContent());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<LabRequestDTO>> getRequestsByPatient(
            @PathVariable Long patientId, Authentication authentication) {
        if (!callerIdentity.canRead(patientId, authentication)) {
            throw new AccessDeniedException("Not permitted to read lab requests of patient " + patientId);
        }
        return ResponseEntity.ok(labService.getRequestsByPatient(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LabRequestDTO> getRequestById(
            @PathVariable Long id, Authentication authentication) {
        LabRequestDTO request = labService.getRequestById(id);
        if (!callerIdentity.canRead(request.getPatientId(), authentication)) {
            throw new AccessDeniedException("Not permitted to read lab request " + id);
        }
        return ResponseEntity.ok(request);
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<List<LabResultDTO>> getResultsByRequest(
            @PathVariable Long id, Authentication authentication) {
        LabRequestDTO request = labService.getRequestById(id);
        if (!callerIdentity.canRead(request.getPatientId(), authentication)) {
            throw new AccessDeniedException("Not permitted to read the results of lab request " + id);
        }
        return ResponseEntity.ok(labService.getResultsByRequest(id));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<LabRequestDTO>> getAllRequests(Authentication authentication) {
        // A patient asking for every request gets their own. Narrowed in the
        // query rather than the response, so nothing else is ever loaded.
        if (callerIdentity.isPatientOnly(authentication)) {
            Long own = callerIdentity.patientId(authentication);
            if (own == null) {
                throw new AccessDeniedException("No patient identity in token");
            }
            return ResponseEntity.ok(labService.getRequestsByPatient(own));
        }
        return ResponseEntity.ok(labService.getAllRequests());
    }
}
