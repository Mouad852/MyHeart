package com.medical.billingservice.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Invoice lifecycle")
class PaymentStatusTest {

    @Test
    @DisplayName("an issued invoice can be paid or voided")
    void issuedTransitions() {
        assertThat(PaymentStatus.ISSUED.canTransitionTo(PaymentStatus.PAID)).isTrue();
        assertThat(PaymentStatus.ISSUED.canTransitionTo(PaymentStatus.VOID)).isTrue();
    }

    @Test
    @DisplayName("a paid invoice can only be refunded")
    void paidTransitions() {
        assertThat(PaymentStatus.PAID.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
        // Voiding a paid invoice would lose the fact that money changed hands.
        assertThat(PaymentStatus.PAID.canTransitionTo(PaymentStatus.VOID)).isFalse();
        assertThat(PaymentStatus.PAID.canTransitionTo(PaymentStatus.ISSUED)).isFalse();
    }

    @Test
    @DisplayName("a voided invoice cannot be paid later")
    void voidIsFinal() {
        assertThat(PaymentStatus.VOID.canTransitionTo(PaymentStatus.PAID)).isFalse();
        assertThat(PaymentStatus.VOID.isTerminal()).isTrue();
    }

    @Test
    @DisplayName("a refund is the end of the road")
    void refundIsFinal() {
        assertThat(PaymentStatus.REFUNDED.isTerminal()).isTrue();
        assertThat(PaymentStatus.REFUNDED.allowedTransitions()).isEmpty();
    }

    @Test
    @DisplayName("only an issued invoice counts as money still owed")
    void outstanding() {
        assertThat(PaymentStatus.ISSUED.isOutstanding()).isTrue();
        assertThat(PaymentStatus.PAID.isOutstanding()).isFalse();
        assertThat(PaymentStatus.VOID.isOutstanding()).isFalse();
        assertThat(PaymentStatus.REFUNDED.isOutstanding()).isFalse();
    }

    @ParameterizedTest
    @EnumSource(PaymentStatus.class)
    @DisplayName("no status can transition to itself")
    void noSelfTransition(PaymentStatus status) {
        assertThat(status.canTransitionTo(status)).isFalse();
    }

    @ParameterizedTest
    @EnumSource(PaymentStatus.class)
    @DisplayName("a null target is never allowed")
    void nullTargetRejected(PaymentStatus status) {
        assertThat(status.canTransitionTo(null)).isFalse();
    }
}
