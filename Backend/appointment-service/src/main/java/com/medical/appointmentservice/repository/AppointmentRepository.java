package com.medical.appointmentservice.repository;

import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.Appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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
}
