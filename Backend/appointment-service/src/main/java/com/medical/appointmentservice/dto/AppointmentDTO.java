package com.medical.appointmentservice.dto;

import com.medical.appointmentservice.entity.AppointmentStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTOs for the Appointment Service API.
 */
public class AppointmentDTO {

    /**
     * Inbound: Used when creating a new appointment.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotNull(message = "Patient ID is required")
        private Long patientId;

        @NotNull(message = "Doctor ID is required")
        private Long doctorId;

        @NotNull(message = "Appointment date is required")
        @Future(message = "Appointment date must be in the future")
        private LocalDateTime appointmentDate;

        private String notes;

        /**
         * How long the slot should last. Optional: the clinic default applies
         * when it is absent.
         */
        @Min(value = 5, message = "An appointment must last at least 5 minutes")
        @Max(value = 480, message = "An appointment cannot last longer than 8 hours")
        private Integer durationMinutes;

        /**
         * Which clinic service this appointment is for, which decides what the
         * invoice charges. Billing assumes a general consultation when absent.
         */
        private String serviceCode;
    }

    /**
     * Outbound: Full appointment details including patient and doctor info.
     * The patient and doctor fields are populated by calling
     * the respective services via Feign clients.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long id;
        private Long patientId;
        private Long doctorId;
        private LocalDateTime appointmentDate;
        private AppointmentStatus status;
        private Integer durationMinutes;
        private String cancellationReason;
        /** Which states this appointment may move to next, for the UI to offer. */
        private java.util.Set<AppointmentStatus> allowedTransitions;
        private String notes;
        private String createdAt;

        // Enriched data fetched from other microservices
        private PatientInfo patient;
        private DoctorInfo doctor;
    }

    /**
     * Lightweight patient info embedded in appointment response.
     * Mirrors the fields from patient-service's PatientDTO.Response.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientInfo {
        private Long id;
        private String name;
        private String email;
        private String phone;
    }

    /**
     * Lightweight doctor info embedded in appointment response.
     * Mirrors the fields from doctor-service's DoctorDTO.Response.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorInfo {
        private Long id;
        private String name;
        private String specialty;
        private String email;
    }
}
