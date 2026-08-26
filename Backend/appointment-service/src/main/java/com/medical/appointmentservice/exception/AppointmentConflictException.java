package com.medical.appointmentservice.exception;

/**
 * Raised when a booking would overlap an appointment that already holds the
 * slot, for either the doctor or the patient.
 */
public class AppointmentConflictException extends RuntimeException {

    public AppointmentConflictException(String message) {
        super(message);
    }
}
