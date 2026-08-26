package com.medical.appointmentservice.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Appointment lifecycle")
class AppointmentStatusTest {

    @Nested
    @DisplayName("allowed transitions")
    class Allowed {

        @Test
        @DisplayName("a requested slot can be confirmed or cancelled")
        void requestedTransitions() {
            assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.CONFIRMED)).isTrue();
            assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
        }

        @Test
        @DisplayName("a confirmed slot can complete, cancel or become a no-show")
        void confirmedTransitions() {
            assertThat(AppointmentStatus.CONFIRMED.canTransitionTo(AppointmentStatus.COMPLETED)).isTrue();
            assertThat(AppointmentStatus.CONFIRMED.canTransitionTo(AppointmentStatus.CANCELLED)).isTrue();
            assertThat(AppointmentStatus.CONFIRMED.canTransitionTo(AppointmentStatus.NO_SHOW)).isTrue();
        }
    }

    @Nested
    @DisplayName("rejected transitions")
    class Rejected {

        @Test
        @DisplayName("a requested slot cannot skip straight to completed")
        void cannotSkipConfirmation() {
            assertThat(AppointmentStatus.REQUESTED.canTransitionTo(AppointmentStatus.COMPLETED)).isFalse();
        }

        @Test
        @DisplayName("a cancelled appointment cannot be revived")
        void cancelledIsFinal() {
            assertThat(AppointmentStatus.CANCELLED.canTransitionTo(AppointmentStatus.CONFIRMED)).isFalse();
            assertThat(AppointmentStatus.CANCELLED.canTransitionTo(AppointmentStatus.COMPLETED)).isFalse();
        }

        @Test
        @DisplayName("a completed appointment cannot be cancelled afterwards")
        void completedIsFinal() {
            assertThat(AppointmentStatus.COMPLETED.canTransitionTo(AppointmentStatus.CANCELLED)).isFalse();
        }

        @Test
        @DisplayName("a no-show cannot be completed later")
        void noShowIsFinal() {
            assertThat(AppointmentStatus.NO_SHOW.canTransitionTo(AppointmentStatus.COMPLETED)).isFalse();
        }

        @ParameterizedTest
        @EnumSource(AppointmentStatus.class)
        @DisplayName("no status can transition to itself")
        void noSelfTransition(AppointmentStatus status) {
            assertThat(status.canTransitionTo(status)).isFalse();
        }

        @ParameterizedTest
        @EnumSource(AppointmentStatus.class)
        @DisplayName("a null target is never allowed")
        void nullTargetRejected(AppointmentStatus status) {
            assertThat(status.canTransitionTo(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("calendar occupancy")
    class Occupancy {

        @Test
        @DisplayName("only requested and confirmed hold a slot")
        void activeStatuses() {
            assertThat(AppointmentStatus.REQUESTED.isActive()).isTrue();
            assertThat(AppointmentStatus.CONFIRMED.isActive()).isTrue();
        }

        @Test
        @DisplayName("a finished or abandoned appointment frees its slot")
        void terminalStatusesFreeTheSlot() {
            assertThat(AppointmentStatus.COMPLETED.isActive()).isFalse();
            assertThat(AppointmentStatus.CANCELLED.isActive()).isFalse();
            assertThat(AppointmentStatus.NO_SHOW.isActive()).isFalse();
        }

        @Test
        @DisplayName("terminal states offer no onward transitions")
        void terminalStatesAreClosed() {
            assertThat(AppointmentStatus.COMPLETED.isTerminal()).isTrue();
            assertThat(AppointmentStatus.CANCELLED.isTerminal()).isTrue();
            assertThat(AppointmentStatus.NO_SHOW.isTerminal()).isTrue();
            assertThat(AppointmentStatus.REQUESTED.isTerminal()).isFalse();
            assertThat(AppointmentStatus.CONFIRMED.isTerminal()).isFalse();
        }
    }
}
