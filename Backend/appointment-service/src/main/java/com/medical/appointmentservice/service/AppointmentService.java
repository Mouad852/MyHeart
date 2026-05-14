package com.medical.appointmentservice.service;

import com.medical.appointmentservice.dto.AppointmentDTO;

import java.util.List;

/**
 * Appointment service interface defining business operations.
 */
public interface AppointmentService {

    AppointmentDTO.Response createAppointment(AppointmentDTO.Request request);

    List<AppointmentDTO.Response> getAllAppointments();

    AppointmentDTO.Response getAppointmentById(Long id);

    AppointmentDTO.Response updateAppointment(Long id, AppointmentDTO.Request request);

    AppointmentDTO.Response cancelAppointment(Long id);
}
