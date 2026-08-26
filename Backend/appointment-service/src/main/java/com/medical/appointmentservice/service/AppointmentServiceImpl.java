package com.medical.appointmentservice.service;

import com.medical.appointmentservice.client.BillingClient;
import com.medical.appointmentservice.client.DoctorClient;
import com.medical.appointmentservice.client.PatientClient;
import com.medical.appointmentservice.dto.AppointmentDTO;
import com.medical.appointmentservice.dto.AppointmentFilter;
import com.medical.appointmentservice.dto.PageResponse;
import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import com.medical.appointmentservice.dto.BillingRequest;
import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.AppointmentStatus;
import com.medical.appointmentservice.exception.ExternalServiceException;
import com.medical.appointmentservice.exception.InvalidStatusTransitionException;
import com.medical.appointmentservice.exception.ResourceNotFoundException;
import com.medical.appointmentservice.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AppointmentServiceImpl - Contains the core business logic.
 *
 * Inter-service communication flow (createAppointment):
 * 1. Validate that the patient exists → calls patient-service via PatientClient
 * (Feign)
 * 2. Validate that the doctor exists → calls doctor-service via DoctorClient
 * (Feign)
 * 3. Persist the appointment in appointmentdb
 * 4. Enrich the response with patient/doctor details
 *
 * If either patient or doctor is not found (404 from the remote service),
 * we throw ExternalServiceException with a meaningful message.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    /** Clinic default when a caller does not ask for a specific length. */
    private static final int DEFAULT_DURATION_MINUTES = 30;

    private final AppointmentRepository appointmentRepository;
    private final BookingRules bookingRules;
    private final PatientClient patientClient;
    private final DoctorClient doctorClient;
    private final BillingClient billingClient;

    @Override
    public AppointmentDTO.Response createAppointment(AppointmentDTO.Request request) {
        return createAppointment(request, AppointmentStatus.CONFIRMED);
    }

    /**
     * @param initialStatus CONFIRMED when the desk books the slot itself,
     *        REQUESTED when a patient is asking for one. A request is not a
     *        booking: it holds no slot until somebody agrees to it.
     */
    @Override
    public AppointmentDTO.Response createAppointment(
            AppointmentDTO.Request request, AppointmentStatus initialStatus) {
        log.info("Creating appointment: patientId={}, doctorId={}, initialStatus={}",
                request.getPatientId(), request.getDoctorId(), initialStatus);

        // ─── Step 1: Verify patient exists via Patient Service ───────────────
        PatientInfo patient = verifyPatient(request.getPatientId());

        // ─── Step 2: Verify doctor exists via Doctor Service ─────────────────
        DoctorInfo doctor = verifyDoctor(request.getDoctorId());

        // ─── Step 3: Apply the booking rules ─────────────────────────────────
        int duration = request.getDurationMinutes() != null
                ? request.getDurationMinutes()
                : DEFAULT_DURATION_MINUTES;
        bookingRules.assertNotInThePast(request.getAppointmentDate());
        bookingRules.assertNoConflict(request.getPatientId(), request.getDoctorId(),
                request.getAppointmentDate(), duration, null);

        // ─── Step 4: Persist the appointment ─────────────────────────────────
        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentDate(request.getAppointmentDate())
                .durationMinutes(duration)
                .notes(request.getNotes())
                .status(initialStatus)
                .statusChangedAt(LocalDateTime.now())
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with ID: {}", saved.getId());

        // ─── Step 5: Trigger invoice creation in billing-service ─────────────
        // A patient asking for a time has not incurred a charge. Invoicing on
        // REQUESTED would bill people for appointments the clinic may never
        // agree to, and leave a void invoice behind for every one it declines.
        if (initialStatus == AppointmentStatus.CONFIRMED) {
            raiseInvoice(saved, request.getServiceCode());
        }

        // ─── Step 6: Return enriched response ────────────────────────────────
        return mapToResponse(saved, patient, doctor);
    }

    /**
     * Ask billing for an invoice.
     *
     * Billing is idempotent by appointment, so calling this from both the
     * booking path and the confirmation path cannot charge a patient twice.
     * Failure is logged and swallowed on purpose: an unbilled appointment is a
     * problem for the accounts, a lost appointment is a problem for a patient
     * standing at the desk.
     */
    private void raiseInvoice(Appointment appointment, String serviceCode) {
        try {
            // No amount is sent. What a consultation costs is billing's business,
            // and it reads the price from the clinic's service catalogue, so a
            // price change is an administrative act rather than a redeploy here.
            BillingRequest billingRequest = BillingRequest.builder()
                    .appointmentId(appointment.getId())
                    .patientId(appointment.getPatientId())
                    .serviceCode(serviceCode)
                    .description("Consultation invoice for appointment #" + appointment.getId())
                    .build();
            billingClient.createInvoice(billingRequest);
            log.info("Invoice creation triggered for appointmentId={}", appointment.getId());
        } catch (Exception e) {
            log.warn("Could not create invoice for appointmentId={}: {}",
                    appointment.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getAllAppointments() {
        log.info("Fetching all appointments");
        return enrich(appointmentRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentDTO.Response> getAppointments(AppointmentFilter filter, Pageable pageable) {
        AppointmentFilter safe = filter != null ? filter : AppointmentFilter.builder().build();
        log.info("Fetching appointments page {} doctorId={} patientId={} status={} from={} to={}",
                pageable.getPageNumber(), safe.getDoctorId(), safe.getPatientId(),
                safe.getStatus(), safe.getFrom(), safe.getTo());

        Page<Appointment> page = appointmentRepository.findFiltered(
                safe.getDoctorId(), safe.getPatientId(), safe.getStatus(),
                safe.getFrom(), safe.getTo(), pageable);

        // Enrich the page in two calls rather than two per row.
        List<AppointmentDTO.Response> enriched = enrich(page.getContent());

        return PageResponse.<AppointmentDTO.Response>builder()
                .content(enriched)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getAppointmentsForPatient(Long patientId) {
        log.info("Fetching appointments for patientId={}", patientId);

        return enrich(appointmentRepository.findByPatientId(patientId));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentDTO.Response getAppointmentById(Long id) {
        log.info("Fetching appointment with ID: {}", id);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        PatientInfo patient = safeGetPatient(appointment.getPatientId());
        DoctorInfo doctor = safeGetDoctor(appointment.getDoctorId());

        return mapToResponse(appointment, patient, doctor);
    }

    @Override
    public AppointmentDTO.Response updateAppointment(Long id, AppointmentDTO.Request request) {
        log.info("Updating appointment with ID: {}", id);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if (request.getPatientId() != null) {
            verifyPatient(request.getPatientId());
            appointment.setPatientId(request.getPatientId());
        }

        if (request.getDoctorId() != null) {
            verifyDoctor(request.getDoctorId());
            appointment.setDoctorId(request.getDoctorId());
        }

        if (request.getAppointmentDate() != null) {
            // Moving a booking re-runs the same rules, excluding this row so it
            // cannot conflict with the slot it is leaving.
            int duration = request.getDurationMinutes() != null
                    ? request.getDurationMinutes()
                    : appointment.getDurationMinutes();
            bookingRules.assertNotInThePast(request.getAppointmentDate());
            bookingRules.assertNoConflict(appointment.getPatientId(), appointment.getDoctorId(),
                    request.getAppointmentDate(), duration, appointment.getId());
            appointment.setAppointmentDate(request.getAppointmentDate());
            appointment.setDurationMinutes(duration);
        }

        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment updated with ID: {}", updated.getId());
        PatientInfo patient = safeGetPatient(updated.getPatientId());
        DoctorInfo doctor = safeGetDoctor(updated.getDoctorId());

        return mapToResponse(updated, patient, doctor);
    }

    @Override
    public AppointmentDTO.Response cancelAppointment(Long id, String reason) {
        return changeStatus(id, AppointmentStatus.CANCELLED, reason);
    }

    @Override
    public AppointmentDTO.Response changeStatus(Long id, AppointmentStatus target, String reason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        AppointmentStatus current = appointment.getStatus();
        if (!current.canTransitionTo(target)) {
            log.warn("Rejected status change {} to {} on appointment {}", current, target, id);
            throw new InvalidStatusTransitionException(current, target);
        }

        appointment.setStatus(target);
        appointment.setStatusChangedAt(LocalDateTime.now());
        if (target == AppointmentStatus.CANCELLED || target == AppointmentStatus.NO_SHOW) {
            appointment.setCancellationReason(reason);
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment {} moved from {} to {}", id, current, target);

        // Agreeing to a requested slot is the point at which the clinic has
        // committed to the work, so that is where the invoice belongs.
        if (current == AppointmentStatus.REQUESTED && target == AppointmentStatus.CONFIRMED) {
            raiseInvoice(updated, null);
        }

        PatientInfo patient = safeGetPatient(updated.getPatientId());
        DoctorInfo doctor = safeGetDoctor(updated.getDoctorId());
        return mapToResponse(updated, patient, doctor);
    }

    /**
     * Attach patient and doctor details to a list of appointments.
     *
     * This used to call patient-service and doctor-service once per row, so a
     * page of twenty appointments meant forty remote calls. Now it collects the
     * distinct ids and asks each service once, which is two calls regardless of
     * page size.
     *
     * Anyone missing from the batch response is shown as "Unavailable" rather
     * than failing the whole list: the appointments themselves are still useful.
     */
    private List<AppointmentDTO.Response> enrich(List<Appointment> appointments) {
        if (appointments.isEmpty()) {
            return List.of();
        }

        Set<Long> patientIds = appointments.stream()
                .map(Appointment::getPatientId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> doctorIds = appointments.stream()
                .map(Appointment::getDoctorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, PatientInfo> patients = safeGetPatients(patientIds);
        Map<Long, DoctorInfo> doctors = safeGetDoctors(doctorIds);

        return appointments.stream()
                .map(appointment -> mapToResponse(
                        appointment,
                        patients.getOrDefault(appointment.getPatientId(),
                                unavailablePatient(appointment.getPatientId())),
                        doctors.getOrDefault(appointment.getDoctorId(),
                                unavailableDoctor(appointment.getDoctorId()))))
                .collect(Collectors.toList());
    }

    private Map<Long, PatientInfo> safeGetPatients(Set<Long> ids) {
        try {
            return patientClient.getPatientsByIds(ids).stream()
                    .filter(p -> p.getId() != null)
                    .collect(Collectors.toMap(PatientInfo::getId, p -> p, (a, b) -> a));
        } catch (ExternalServiceException | ResourceNotFoundException e) {
            log.warn("Could not batch fetch {} patients: {}", ids.size(), e.getMessage());
            return Map.of();
        }
    }

    private Map<Long, DoctorInfo> safeGetDoctors(Set<Long> ids) {
        try {
            return doctorClient.getDoctorsByIds(ids).stream()
                    .filter(d -> d.getId() != null)
                    .collect(Collectors.toMap(DoctorInfo::getId, d -> d, (a, b) -> a));
        } catch (ExternalServiceException | ResourceNotFoundException e) {
            log.warn("Could not batch fetch {} doctors: {}", ids.size(), e.getMessage());
            return Map.of();
        }
    }

    private PatientInfo unavailablePatient(Long id) {
        return PatientInfo.builder().id(id).name("Unavailable").build();
    }

    private DoctorInfo unavailableDoctor(Long id) {
        return DoctorInfo.builder().id(id).name("Unavailable").build();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Call patient-service to verify a patient exists.
     *
     * Errors are classified by {@link com.medical.appointmentservice.client.PatientClientFallbackFactory}:
     * a missing patient surfaces as ResourceNotFoundException (404) and an outage
     * as ExternalServiceException (503). Both propagate to the caller unchanged.
     */
    private PatientInfo verifyPatient(Long patientId) {
        log.info("Verifying patient exists: ID={}", patientId);
        PatientInfo patient = patientClient.getPatientById(patientId);
        log.info("Patient verified: {}", patient.getName());
        return patient;
    }

    /**
     * Call doctor-service to verify a doctor exists.
     *
     * Errors are classified by {@link com.medical.appointmentservice.client.DoctorClientFallbackFactory}:
     * a missing doctor surfaces as ResourceNotFoundException (404) and an outage
     * as ExternalServiceException (503). Both propagate to the caller unchanged.
     */
    private DoctorInfo verifyDoctor(Long doctorId) {
        log.info("Verifying doctor exists: ID={}", doctorId);
        DoctorInfo doctor = doctorClient.getDoctorById(doctorId);
        log.info("Doctor verified: {}", doctor.getName());
        return doctor;
    }

    /**
     * Silently fetch patient info for read operations.
     * Returns fallback data if the service is unavailable (doesn't throw).
     */
    private PatientInfo safeGetPatient(Long patientId) {
        try {
            return patientClient.getPatientById(patientId);
        } catch (ExternalServiceException | ResourceNotFoundException e) {
            // The circuit breaker converts remote failures into these two types;
            // a raw FeignException never reaches this point.
            log.warn("Could not fetch patient info for ID: {} - {}", patientId, e.getMessage());
            return PatientInfo.builder().id(patientId).name("Unavailable").build();
        }
    }

    /**
     * Silently fetch doctor info for read operations.
     */
    private DoctorInfo safeGetDoctor(Long doctorId) {
        try {
            return doctorClient.getDoctorById(doctorId);
        } catch (ExternalServiceException | ResourceNotFoundException e) {
            // The circuit breaker converts remote failures into these two types;
            // a raw FeignException never reaches this point.
            log.warn("Could not fetch doctor info for ID: {} - {}", doctorId, e.getMessage());
            return DoctorInfo.builder().id(doctorId).name("Unavailable").build();
        }
    }

    /**
     * Maps Appointment entity + enriched data into a Response DTO.
     */
    private AppointmentDTO.Response mapToResponse(
            Appointment appointment, PatientInfo patient, DoctorInfo doctor) {
        return AppointmentDTO.Response.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .appointmentDate(appointment.getAppointmentDate())
                .status(appointment.getStatus())
                .durationMinutes(appointment.getDurationMinutes())
                .cancellationReason(appointment.getCancellationReason())
                .allowedTransitions(appointment.getStatus().allowedTransitions())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt() != null
                        ? appointment.getCreatedAt().toString()
                        : null)
                .patient(patient)
                .doctor(doctor)
                .build();
    }
}
