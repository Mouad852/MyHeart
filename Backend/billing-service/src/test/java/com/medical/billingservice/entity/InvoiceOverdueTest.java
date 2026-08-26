package com.medical.billingservice.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Overdue is derived, not stored")
class InvoiceOverdueTest {

    private Invoice invoice(PaymentStatus status, LocalDate dueDate) {
        return Invoice.builder()
                .appointmentId(1L)
                .patientId(1L)
                .amount(new BigDecimal("300.00"))
                .status(status)
                .dueDate(dueDate)
                .build();
    }

    @Test
    @DisplayName("an unpaid invoice past its due date is overdue")
    void unpaidAndPastDue() {
        assertThat(invoice(PaymentStatus.ISSUED, LocalDate.now().minusDays(1)).isOverdue()).isTrue();
    }

    @Test
    @DisplayName("an unpaid invoice due today is not yet overdue")
    void dueToday() {
        // The patient has until the end of the day.
        assertThat(invoice(PaymentStatus.ISSUED, LocalDate.now()).isOverdue()).isFalse();
    }

    @Test
    @DisplayName("an unpaid invoice due in the future is not overdue")
    void notYetDue() {
        assertThat(invoice(PaymentStatus.ISSUED, LocalDate.now().plusDays(7)).isOverdue()).isFalse();
    }

    @Test
    @DisplayName("a paid invoice is never overdue, however old")
    void paidIsNeverOverdue() {
        assertThat(invoice(PaymentStatus.PAID, LocalDate.now().minusYears(1)).isOverdue()).isFalse();
    }

    @Test
    @DisplayName("a voided invoice is never overdue")
    void voidedIsNeverOverdue() {
        assertThat(invoice(PaymentStatus.VOID, LocalDate.now().minusMonths(2)).isOverdue()).isFalse();
    }

    @Test
    @DisplayName("an invoice with no due date is not overdue")
    void noDueDate() {
        assertThat(invoice(PaymentStatus.ISSUED, null).isOverdue()).isFalse();
    }
}
