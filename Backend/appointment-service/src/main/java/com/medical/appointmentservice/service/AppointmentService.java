package com.medical.appointmentservice.service;

import com.medical.appointmentservice.dto.AppointmentDTO;
import com.medical.appointmentservice.entity.AppointmentStatus;

import java.util.List;

/**
 * Appointment service interface defining business operations.
 */
public interface AppointmentService {

    AppointmentDTO.Response createAppointment(AppointmentDTO.Request request);

    List<AppointmentDTO.Response> getAllAppointments();

    /** Appointments belonging to one patient, used to scope a patient's own view. */
    List<AppointmentDTO.Response> getAppointmentsForPatient(Long patientId);

    AppointmentDTO.Response getAppointmentById(Long id);

    AppointmentDTO.Response updateAppointment(Long id, AppointmentDTO.Request request);

    AppointmentDTO.Response cancelAppointment(Long id, String reason);

    /**
     * Move an appointment to another lifecycle state, rejecting any transition
     * the lifecycle does not allow.
     */
    AppointmentDTO.Response changeStatus(Long id, AppointmentStatus target, String reason);
}
