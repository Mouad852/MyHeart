package com.medical.appointmentservice.controller;

import com.medical.appointmentservice.dto.AppointmentDTO;
import com.medical.appointmentservice.dto.AppointmentFilter;
import com.medical.appointmentservice.dto.PageResponse;
import com.medical.appointmentservice.entity.AppointmentStatus;
import com.medical.common.security.CallerIdentity;
import com.medical.appointmentservice.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
            @Valid @RequestBody AppointmentDTO.Request request,
            Authentication authentication) {

        // Who is asking decides what is created. The desk books a slot; a
        // patient can only request one, and the patientId on the request is
        // replaced with their own rather than trusted from the body, so nobody
        // can book time in somebody else's name.
        AppointmentStatus initialStatus = AppointmentStatus.CONFIRMED;
        if (callerIdentity.isPatientOnly(authentication)) {
            Long own = callerIdentity.patientId(authentication);
            if (own == null) {
                throw new AccessDeniedException("No patient identity in token");
            }
            request.setPatientId(own);
            initialStatus = AppointmentStatus.REQUESTED;
        }

        log.info("REST POST /appointments - patientId={}, doctorId={}, initialStatus={}",
                request.getPatientId(), request.getDoctorId(), initialStatus);
        AppointmentDTO.Response response =
                appointmentService.createAppointment(request, initialStatus);
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
     * GET /appointments/search
     * A page of appointments narrowed by any combination of doctor, patient,
     * status and date window.
     *
     * A patient may only ever search their own appointments; the filter is
     * overwritten with their own id rather than trusted from the query string.
     */
    @GetMapping("/search")
    public ResponseEntity<PageResponse<AppointmentDTO.Response>> searchAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(size = 20, sort = "appointmentDate") Pageable pageable,
            Authentication authentication) {

        Long effectivePatientId = patientId;
        if (callerIdentity.isPatientOnly(authentication)) {
            effectivePatientId = callerIdentity.patientId(authentication);
            if (effectivePatientId == null) {
                throw new AccessDeniedException("No patient identity in token");
            }
        }

        AppointmentFilter filter = AppointmentFilter.builder()
                .doctorId(doctorId)
                .patientId(effectivePatientId)
                .status(status)
                .from(from)
                .to(to)
                .build();

        return ResponseEntity.ok(appointmentService.getAppointments(filter, pageable));
    }

    /**
     * GET /appointments/my-day
     * The signed-in doctor's own calendar for a given day, defaulting to today.
     *
     * The doctor comes from the token's doctorId claim, not from a parameter,
     * so this cannot be pointed at a colleague's day.
     */
    @GetMapping("/my-day")
    public ResponseEntity<PageResponse<AppointmentDTO.Response>> myDay(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @PageableDefault(size = 50, sort = "appointmentDate") Pageable pageable,
            Authentication authentication) {

        Long doctorId = callerIdentity.doctorId(authentication);
        if (doctorId == null) {
            throw new AccessDeniedException(
                    "This account is not linked to a doctor record, so it has no calendar.");
        }

        LocalDate target = day != null ? day : LocalDate.now();
        log.info("REST GET /appointments/my-day doctorId={} day={}", doctorId, target);

        return ResponseEntity.ok(appointmentService.getAppointments(
                AppointmentFilter.forDay(doctorId, target), pageable));
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
        if (!callerIdentity.canRead(appointment.getPatientId(), authentication)) {
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
    public ResponseEntity<AppointmentDTO.Response> cancelAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST PATCH /appointments/{}/cancel", id);
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, reason));
    }

    /**
     * PATCH /appointments/{id}/confirm
     * The front desk agrees to a slot a patient asked for.
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<AppointmentDTO.Response> confirmAppointment(@PathVariable Long id) {
        log.info("REST PATCH /appointments/{}/confirm", id);
        return ResponseEntity.ok(
                appointmentService.changeStatus(id, AppointmentStatus.CONFIRMED, null));
    }

    /**
     * PATCH /appointments/{id}/complete
     * The consultation happened.
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentDTO.Response> completeAppointment(@PathVariable Long id) {
        log.info("REST PATCH /appointments/{}/complete", id);
        return ResponseEntity.ok(
                appointmentService.changeStatus(id, AppointmentStatus.COMPLETED, null));
    }

    /**
     * PATCH /appointments/{id}/no-show
     * The slot was held and the patient did not attend.
     */
    @PatchMapping("/{id}/no-show")
    public ResponseEntity<AppointmentDTO.Response> markNoShow(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST PATCH /appointments/{}/no-show", id);
        return ResponseEntity.ok(
                appointmentService.changeStatus(id, AppointmentStatus.NO_SHOW, reason));
    }

}
