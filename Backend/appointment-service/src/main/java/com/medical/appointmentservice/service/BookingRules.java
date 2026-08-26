package com.medical.appointmentservice.service;

import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.AppointmentStatus;
import com.medical.appointmentservice.exception.AppointmentConflictException;
import com.medical.appointmentservice.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The rules that decide whether a slot may be booked.
 *
 * Kept apart from AppointmentServiceImpl because these are the rules a clinic
 * would argue about, and they deserve to be readable and testable without a
 * database or a Feign client in the way.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingRules {

    private static final DateTimeFormatter HUMAN_TIME = DateTimeFormatter.ofPattern("d MMM yyyy 'at' HH:mm");

    private final AppointmentRepository appointmentRepository;

    private static final Set<String> ACTIVE_STATUS_NAMES = AppointmentStatus.ACTIVE.stream()
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    /**
     * Rejects a booking that would overlap an existing one, for the doctor or
     * for the patient.
     *
     * @param excludedId the appointment being rescheduled, so it does not
     *                   conflict with itself; null when booking new
     */
    public void assertNoConflict(Long patientId, Long doctorId, LocalDateTime start,
                                 int durationMinutes, Long excludedId) {
        LocalDateTime end = start.plusMinutes(durationMinutes);
        Collection<String> active = ACTIVE_STATUS_NAMES;

        List<Appointment> doctorClashes =
                appointmentRepository.findDoctorConflicts(doctorId, start, end, active, excludedId);
        if (!doctorClashes.isEmpty()) {
            Appointment clash = doctorClashes.get(0);
            log.warn("Doctor {} is already booked at {}; rejecting overlap requested for {}",
                    doctorId, clash.getAppointmentDate(), start);
            throw new AppointmentConflictException(
                    "That doctor already has an appointment on "
                            + HUMAN_TIME.format(clash.getAppointmentDate())
                            + ". Choose another time or another doctor.");
        }

        List<Appointment> patientClashes =
                appointmentRepository.findPatientConflicts(patientId, start, end, active, excludedId);
        if (!patientClashes.isEmpty()) {
            Appointment clash = patientClashes.get(0);
            log.warn("Patient {} is already booked at {}; rejecting overlap requested for {}",
                    patientId, clash.getAppointmentDate(), start);
            throw new AppointmentConflictException(
                    "This patient already has an appointment on "
                            + HUMAN_TIME.format(clash.getAppointmentDate())
                            + ". A patient cannot be in two places at once.");
        }
    }

    /**
     * Rejects a booking in the past.
     *
     * Bean validation carries @Future on the entity, but that fires only on
     * the way into the database and gives a message about a field rather than
     * about the clinic's rule.
     */
    public void assertNotInThePast(LocalDateTime start) {
        if (start.isBefore(LocalDateTime.now())) {
            throw new AppointmentConflictException(
                    "That time has already passed. Appointments can only be booked in the future.");
        }
    }
}
