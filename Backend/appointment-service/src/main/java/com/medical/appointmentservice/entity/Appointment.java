package com.medical.appointmentservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Appointment JPA Entity mapped to 'appointments' table in appointmentdb.
 *
 * Important design note:
 * This service stores ONLY the IDs of the patient and doctor,
 * NOT their full objects. This is the correct microservices pattern —
 * each service owns its own data. The full patient/doctor details
 * are fetched at query time via Feign clients.
 */
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Patient ID is required")
    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.CONFIRMED;

    /**
     * How long this appointment occupies the calendar. Stored per row so that
     * changing the clinic default later cannot reshape bookings already made.
     */
    @Min(value = 5, message = "An appointment must last at least 5 minutes")
    @Max(value = 480, message = "An appointment cannot last longer than 8 hours")
    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "status_changed_at")
    private LocalDateTime statusChangedAt;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** End of the slot. The interval is treated as half-open: [start, end). */
    public LocalDateTime getEndTime() {
        int minutes = durationMinutes != null ? durationMinutes : 30;
        return appointmentDate != null ? appointmentDate.plusMinutes(minutes) : null;
    }
}
