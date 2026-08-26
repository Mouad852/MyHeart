package com.medical.appointmentservice.entity;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The lifecycle of an appointment.
 *
 * An appointment is a business process, not a row that can be edited into any
 * shape. The transitions below are the only ones the clinic recognises, and
 * they are enforced in one place so no caller can invent a new path by
 * sending a different status.
 *
 * <pre>
 *   REQUESTED ──confirm──▶ CONFIRMED ──complete──▶ COMPLETED
 *       │                      │
 *       │                      ├──no-show──▶ NO_SHOW
 *       └──cancel──▶ CANCELLED ◀──cancel────┘
 * </pre>
 *
 * COMPLETED, CANCELLED and NO_SHOW are terminal. Reopening one would erase
 * clinical and billing history, so a new appointment is booked instead.
 */
public enum AppointmentStatus {

    /** A patient asked for this slot; the front desk has not agreed to it yet. */
    REQUESTED,

    /** The clinic has agreed the slot. This is where staff bookings start. */
    CONFIRMED,

    /** The consultation happened. */
    COMPLETED,

    /** Called off by either side before it happened. */
    CANCELLED,

    /** The slot was held and the patient did not attend. */
    NO_SHOW;

    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ALLOWED = Map.of(
            REQUESTED, EnumSet.of(CONFIRMED, CANCELLED),
            CONFIRMED, EnumSet.of(COMPLETED, CANCELLED, NO_SHOW),
            COMPLETED, EnumSet.noneOf(AppointmentStatus.class),
            CANCELLED, EnumSet.noneOf(AppointmentStatus.class),
            NO_SHOW, EnumSet.noneOf(AppointmentStatus.class));

    /** Statuses that still occupy a slot in the calendar. */
    public static final Set<AppointmentStatus> ACTIVE = Collections.unmodifiableSet(
            EnumSet.of(REQUESTED, CONFIRMED));

    public boolean canTransitionTo(AppointmentStatus target) {
        return target != null && ALLOWED.get(this).contains(target);
    }

    /** True when no further transition is possible. */
    public boolean isTerminal() {
        return ALLOWED.get(this).isEmpty();
    }

    /** True when this appointment still holds its place in the calendar. */
    public boolean isActive() {
        return ACTIVE.contains(this);
    }

    public Set<AppointmentStatus> allowedTransitions() {
        return Collections.unmodifiableSet(ALLOWED.get(this));
    }
}
