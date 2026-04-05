package com.medical.appointmentservice.service;

import com.medical.appointmentservice.client.BillingClient;
import com.medical.appointmentservice.client.DoctorClient;
import com.medical.appointmentservice.client.PatientClient;
import com.medical.appointmentservice.dto.AppointmentDTO;
import com.medical.appointmentservice.dto.AppointmentDTO.DoctorInfo;
import com.medical.appointmentservice.dto.AppointmentDTO.PatientInfo;
import com.medical.appointmentservice.dto.BillingRequest;
import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.Appointment.AppointmentStatus;
import com.medical.appointmentservice.exception.ExternalServiceException;
import com.medical.appointmentservice.exception.ResourceNotFoundException;
import com.medical.appointmentservice.repository.AppointmentRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AppointmentServiceImpl - Contains the core business logic.
 *
 * Inter-service communication flow (createAppointment):
 *  1. Validate that the patient exists  → calls patient-service via PatientClient (Feign)
 *  2. Validate that the doctor exists   → calls doctor-service via DoctorClient (Feign)
 *  3. Persist the appointment in appointmentdb
 *  4. Enrich the response with patient/doctor details
 *
 * If either patient or doctor is not found (404 from the remote service),
 * we throw ExternalServiceException with a meaningful message.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientClient patientClient;
    private final DoctorClient doctorClient;
    private final BillingClient billingClient;

    @Override
    public AppointmentDTO.Response createAppointment(AppointmentDTO.Request request) {
        log.info("Creating appointment: patientId={}, doctorId={}",
                request.getPatientId(), request.getDoctorId());

        // ─── Step 1: Verify patient exists via Patient Service ───────────────
        PatientInfo patient = verifyPatient(request.getPatientId());

        // ─── Step 2: Verify doctor exists via Doctor Service ─────────────────
        DoctorInfo doctor = verifyDoctor(request.getDoctorId());

        // ─── Step 3: Persist the appointment ─────────────────────────────────
        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentDate(request.getAppointmentDate())
                .notes(request.getNotes())
                .status(AppointmentStatus.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with ID: {}", saved.getId());

        // ─── Step 4: Trigger invoice creation in billing-service ─────────────
        try {
            BillingRequest billingRequest = BillingRequest.builder()
                    .appointmentId(saved.getId())
                    .patientId(saved.getPatientId())
                    .amount(BigDecimal.valueOf(100.00))  // Default consultation fee
                    .description("Consultation invoice for appointment #" + saved.getId())
                    .build();
            billingClient.createInvoice(billingRequest);
            log.info("Invoice creation triggered for appointmentId={}", saved.getId());
        } catch (Exception e) {
            // Billing failure must NOT roll back the appointment
            log.warn("Could not create invoice for appointmentId={}: {}", saved.getId(), e.getMessage());
        }

        // ─── Step 5: Return enriched response ────────────────────────────────
        return mapToResponse(saved, patient, doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDTO.Response> getAllAppointments() {
        log.info("Fetching all appointments");

        return appointmentRepository.findAll()
                .stream()
                .map(appointment -> {
                    // Enrich each appointment with patient/doctor info
                    PatientInfo patient = safeGetPatient(appointment.getPatientId());
                    DoctorInfo doctor = safeGetDoctor(appointment.getDoctorId());
                    return mapToResponse(appointment, patient, doctor);
                })
                .collect(Collectors.toList());
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
    public AppointmentDTO.Response cancelAppointment(Long id) {
        log.info("Cancelling appointment with ID: {}", id);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment updated = appointmentRepository.save(appointment);

        PatientInfo patient = safeGetPatient(updated.getPatientId());
        DoctorInfo doctor = safeGetDoctor(updated.getDoctorId());

        log.info("Appointment cancelled with ID: {}", updated.getId());
        return mapToResponse(updated, patient, doctor);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Call patient-service to verify a patient exists.
     * Throws ExternalServiceException if not found (FeignException.NotFound = HTTP 404).
     */
    private PatientInfo verifyPatient(Long patientId) {
        try {
            log.info("Verifying patient exists: ID={}", patientId);
            PatientInfo patient = patientClient.getPatientById(patientId);
            log.info("Patient verified: {}", patient.getName());
            return patient;
        } catch (FeignException.NotFound e) {
            log.error("Patient not found with ID: {}", patientId);
            throw new ExternalServiceException("Patient not found with ID: " + patientId);
        } catch (FeignException e) {
            log.error("Error calling patient-service: {}", e.getMessage());
            throw new ExternalServiceException("Could not reach patient-service: " + e.getMessage());
        }
    }

    /**
     * Call doctor-service to verify a doctor exists.
     * Throws ExternalServiceException if not found.
     */
    private DoctorInfo verifyDoctor(Long doctorId) {
        try {
            log.info("Verifying doctor exists: ID={}", doctorId);
            DoctorInfo doctor = doctorClient.getDoctorById(doctorId);
            log.info("Doctor verified: {}", doctor.getName());
            return doctor;
        } catch (FeignException.NotFound e) {
            log.error("Doctor not found with ID: {}", doctorId);
            throw new ExternalServiceException("Doctor not found with ID: " + doctorId);
        } catch (FeignException e) {
            log.error("Error calling doctor-service: {}", e.getMessage());
            throw new ExternalServiceException("Could not reach doctor-service: " + e.getMessage());
        }
    }

    /**
     * Silently fetch patient info for read operations.
     * Returns fallback data if the service is unavailable (doesn't throw).
     */
    private PatientInfo safeGetPatient(Long patientId) {
        try {
            return patientClient.getPatientById(patientId);
        } catch (FeignException e) {
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
        } catch (FeignException e) {
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
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt() != null
                        ? appointment.getCreatedAt().toString() : null)
                .patient(patient)
                .doctor(doctor)
                .build();
    }
}
