package com.medical.appointmentservice.repository;

import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Spring Data JPA Repository for Appointment entity.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByDoctorIdAndAppointmentDateBetween(
            Long doctorId,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByPatientIdAndDoctorIdAndAppointmentDate(
            Long patientId,
            Long doctorId,
            LocalDateTime appointmentDate
    );

    /**
     * Active appointments for a doctor that overlap the given interval.
     *
     * Overlap is half-open: a slot ending exactly when another begins does not
     * clash, so back-to-back bookings are allowed. Only REQUESTED and
     * CONFIRMED occupy the calendar; a cancelled slot frees its time.
     *
     * excludedId lets a reschedule ignore the appointment being moved, which
     * would otherwise always conflict with itself.
     *
     * Native because the end of a slot is start + duration, and expressing
     * that arithmetic portably in JPQL is more trouble than it is worth.
     */
    @Query(value = """
            SELECT * FROM appointments a
            WHERE a.doctor_id = :doctorId
              AND a.status IN (:activeStatuses)
              AND (CAST(:excludedId AS BIGINT) IS NULL OR a.id <> :excludedId)
              AND a.appointment_date < :endExclusive
              AND :startInclusive < a.appointment_date
                  + (a.duration_minutes * INTERVAL '1 minute')
            ORDER BY a.appointment_date
            """, nativeQuery = true)
    List<Appointment> findDoctorConflicts(
            @Param("doctorId") Long doctorId,
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive,
            @Param("activeStatuses") Collection<String> activeStatuses,
            @Param("excludedId") Long excludedId
    );

    /** The same overlap rule for a patient, who cannot be in two places at once. */
    @Query(value = """
            SELECT * FROM appointments a
            WHERE a.patient_id = :patientId
              AND a.status IN (:activeStatuses)
              AND (CAST(:excludedId AS BIGINT) IS NULL OR a.id <> :excludedId)
              AND a.appointment_date < :endExclusive
              AND :startInclusive < a.appointment_date
                  + (a.duration_minutes * INTERVAL '1 minute')
            ORDER BY a.appointment_date
            """, nativeQuery = true)
    List<Appointment> findPatientConflicts(
            @Param("patientId") Long patientId,
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive,
            @Param("activeStatuses") Collection<String> activeStatuses,
            @Param("excludedId") Long excludedId
    );

    /**
     * Appointments matching whichever filters the caller supplied.
     *
     * Every filter is optional: a null means "do not narrow by this". One query
     * covers the whole calendar, a doctor's day, a patient's history and a
     * status board, instead of a method per combination.
     */
    @Query("""
            SELECT a FROM Appointment a
            WHERE (:doctorId IS NULL OR a.doctorId = :doctorId)
              AND (:patientId IS NULL OR a.patientId = :patientId)
              AND (:status IS NULL OR a.status = :status)
              AND (CAST(:from AS timestamp) IS NULL OR a.appointmentDate >= :from)
              AND (CAST(:to AS timestamp) IS NULL OR a.appointmentDate < :to)
            """)
    Page<Appointment> findFiltered(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("status") AppointmentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );
}
