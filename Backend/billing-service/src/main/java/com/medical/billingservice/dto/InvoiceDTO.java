package com.medical.billingservice.dto;

import com.medical.billingservice.entity.PaymentStatus;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDTO {

    private Long id;
    private Long appointmentId;
    private Long patientId;
    private BigDecimal amount;
    private PaymentStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private String serviceCode;
    private String currency;
    private LocalDate dueDate;
    /** Derived from the due date rather than stored, so it cannot go stale. */
    private boolean overdue;
    private String voidReason;
    /** Which states this invoice may move to next, for the UI to offer. */
    private Set<PaymentStatus> allowedTransitions;
}
