package com.medical.appointmentservice.exception;

import com.medical.appointmentservice.entity.AppointmentStatus;

/**
 * Raised when a caller asks for a status change the lifecycle does not allow,
 * such as completing an appointment that was already cancelled.
 */
public class InvalidStatusTransitionException extends RuntimeException {

    public InvalidStatusTransitionException(AppointmentStatus from, AppointmentStatus to) {
        super(buildMessage(from, to));
    }

    private static String buildMessage(AppointmentStatus from, AppointmentStatus to) {
        if (from.isTerminal()) {
            return "This appointment is already " + from.name().toLowerCase().replace('_', ' ')
                    + " and cannot be changed. Book a new appointment instead.";
        }
        return "An appointment cannot go from " + from + " to " + to
                + ". Allowed from " + from + ": " + from.allowedTransitions() + ".";
    }
}
