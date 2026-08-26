package com.medical.appointmentservice.dto;

import com.medical.appointmentservice.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * What to narrow an appointment search by. Every field is optional.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentFilter {

    private Long doctorId;
    private Long patientId;
    private AppointmentStatus status;

    /** Inclusive start of the window. */
    private LocalDateTime from;

    /** Exclusive end of the window. */
    private LocalDateTime to;

    /**
     * A whole day, which is what a "today" view actually wants. Expressed as
     * midnight to midnight so an appointment at 23:30 is still today.
     */
    public static AppointmentFilter forDay(Long doctorId, LocalDate day) {
        return AppointmentFilter.builder()
                .doctorId(doctorId)
                .from(day.atStartOfDay())
                .to(day.plusDays(1).atStartOfDay())
                .build();
    }
}
