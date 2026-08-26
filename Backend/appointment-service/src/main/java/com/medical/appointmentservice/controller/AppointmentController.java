package com.medical.appointmentservice.controller;

import com.medical.appointmentservice.dto.AppointmentDTO;
import com.medical.appointmentservice.security.CallerIdentity;
import com.medical.appointmentservice.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Appointment operations.
 * Endpoints:
 * POST /appointments - create appointment
 * GET /appointments - list all appointments
 * GET /appointments/{id} - get by ID
 * PATCH /appointments/{id}/cancel - cancel appointment
 */
@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Slf4j
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final CallerIdentity callerIdentity;

    /**
     * POST /appointments
     * Creates a new appointment after verifying patient and doctor exist.
     */
    @PostMapping
    public ResponseEntity<AppointmentDTO.Response> createAppointment(
            @Valid @RequestBody AppointmentDTO.Request request) {
        log.info("REST POST /appointments - patientId={}, doctorId={}",
                request.getPatientId(), request.getDoctorId());
        AppointmentDTO.Response response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /appointments
     * Returns all appointments enriched with patient and doctor details.
     */
    @GetMapping
    public ResponseEntity<List<AppointmentDTO.Response>> getAllAppointments(
            Authentication authentication) {
        // A patient sees only their own appointments. The narrowing happens in
        // the query, not in the response, so nothing extra is ever serialised.
        if (callerIdentity.isPatientOnly(authentication)) {
            Long patientId = callerIdentity.patientId(authentication);
            if (patientId == null) {
                throw new AccessDeniedException("No patient identity in token");
            }
            return ResponseEntity.ok(appointmentService.getAppointmentsForPatient(patientId));
        }
        log.info("REST GET /appointments");
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    /**
     * GET /appointments/{id}
     * Returns a single appointment by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO.Response> getAppointmentById(
            @PathVariable Long id, Authentication authentication) {
        log.info("REST GET /appointments/{}", id);
        AppointmentDTO.Response appointment = appointmentService.getAppointmentById(id);

        // The row has to be fetched before ownership can be judged, so the
        // check happens here rather than in a @PreAuthorize expression.
        if (!callerIdentity.canReadAppointmentOf(appointment.getPatientId(), authentication)) {
            throw new AccessDeniedException("Not permitted to read appointment " + id);
        }
        return ResponseEntity.ok(appointment);
    }

    /**
     * PATCH /appointments/{id}
     * Updates an existing appointment (patient, doctor, date, notes).
     */
    @PatchMapping("/{id}")
    public ResponseEntity<AppointmentDTO.Response> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentDTO.Request request) {
        log.info("REST PATCH /appointments/{} - Updating with patientId={}, doctorId={}",
                id, request.getPatientId(), request.getDoctorId());
        AppointmentDTO.Response response = appointmentService.updateAppointment(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /appointments/{id}/cancel
     * Cancels an existing appointment.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDTO.Response> cancelAppointment(@PathVariable Long id) {
        log.info("REST PATCH /appointments/{}/cancel", id);
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }
}
