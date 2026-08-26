package com.medical.appointmentservice.service;

import com.medical.appointmentservice.entity.Appointment;
import com.medical.appointmentservice.entity.AppointmentStatus;
import com.medical.appointmentservice.exception.AppointmentConflictException;
import com.medical.appointmentservice.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Booking rules")
class BookingRulesTest {

    private static final Long PATIENT_ID = 1L;
    private static final Long DOCTOR_ID = 2L;
    private static final int DURATION = 30;

    @Mock
    private AppointmentRepository appointmentRepository;

    private BookingRules bookingRules;
    private LocalDateTime slot;

    @BeforeEach
    void setUp() {
        bookingRules = new BookingRules(appointmentRepository);
        slot = LocalDateTime.now().plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);
    }

    private Appointment existing(LocalDateTime start) {
        return Appointment.builder()
                .id(99L)
                .patientId(PATIENT_ID)
                .doctorId(DOCTOR_ID)
                .appointmentDate(start)
                .durationMinutes(DURATION)
                .status(AppointmentStatus.CONFIRMED)
                .build();
    }

    private void noConflicts() {
        when(appointmentRepository.findDoctorConflicts(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(appointmentRepository.findPatientConflicts(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    @DisplayName("a free slot is accepted")
    void freeSlotAccepted() {
        noConflicts();

        assertThatCode(() ->
                bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, DURATION, null))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a doctor cannot be double booked")
    void doctorDoubleBookingRejected() {
        when(appointmentRepository.findDoctorConflicts(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of(existing(slot)));

        assertThatThrownBy(() ->
                bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, DURATION, null))
                .isInstanceOf(AppointmentConflictException.class)
                .hasMessageContaining("doctor already has an appointment");
    }

    @Test
    @DisplayName("a patient cannot be in two places at once")
    void patientDoubleBookingRejected() {
        when(appointmentRepository.findDoctorConflicts(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(appointmentRepository.findPatientConflicts(anyLong(), any(), any(), any(), any()))
                .thenReturn(List.of(existing(slot)));

        assertThatThrownBy(() ->
                bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, DURATION, null))
                .isInstanceOf(AppointmentConflictException.class)
                .hasMessageContaining("patient already has an appointment");
    }

    @Test
    @DisplayName("only active statuses are considered when looking for clashes")
    void onlyActiveStatusesBlockASlot() {
        noConflicts();

        bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, DURATION, null);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> statuses = ArgumentCaptor.forClass(Collection.class);
        org.mockito.Mockito.verify(appointmentRepository)
                .findDoctorConflicts(eq(DOCTOR_ID), any(), any(), statuses.capture(), any());

        // A cancelled or completed appointment must not keep holding its slot.
        assertThat(statuses.getValue())
                .containsExactlyInAnyOrder("REQUESTED", "CONFIRMED")
                .doesNotContain("CANCELLED", "COMPLETED", "NO_SHOW");
    }

    @Test
    @DisplayName("the searched window is exactly the slot being booked")
    void windowMatchesTheRequestedSlot() {
        noConflicts();

        bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, 45, null);

        ArgumentCaptor<LocalDateTime> start = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> end = ArgumentCaptor.forClass(LocalDateTime.class);
        org.mockito.Mockito.verify(appointmentRepository)
                .findDoctorConflicts(eq(DOCTOR_ID), start.capture(), end.capture(), any(), any());

        assertThat(start.getValue()).isEqualTo(slot);
        assertThat(end.getValue()).isEqualTo(slot.plusMinutes(45));
    }

    @Test
    @DisplayName("rescheduling excludes the appointment being moved")
    void rescheduleExcludesItself() {
        noConflicts();

        bookingRules.assertNoConflict(PATIENT_ID, DOCTOR_ID, slot, DURATION, 42L);

        ArgumentCaptor<Long> excluded = ArgumentCaptor.forClass(Long.class);
        org.mockito.Mockito.verify(appointmentRepository)
                .findDoctorConflicts(eq(DOCTOR_ID), any(), any(), any(), excluded.capture());

        // Without this the appointment would always clash with its own old slot.
        assertThat(excluded.getValue()).isEqualTo(42L);
    }

    @Test
    @DisplayName("a booking in the past is rejected")
    void pastBookingRejected() {
        assertThatThrownBy(() ->
                bookingRules.assertNotInThePast(LocalDateTime.now().minusMinutes(1)))
                .isInstanceOf(AppointmentConflictException.class)
                .hasMessageContaining("already passed");
    }

    @Test
    @DisplayName("a future booking passes the time check")
    void futureBookingAccepted() {
        assertThatCode(() -> bookingRules.assertNotInThePast(slot))
                .doesNotThrowAnyException();
    }
}
