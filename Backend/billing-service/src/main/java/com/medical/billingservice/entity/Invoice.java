package com.medical.billingservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    /** How long a patient has to settle an invoice. */
    private static final int PAYMENT_TERMS_DAYS = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private String description;

    /** Which catalogue entry priced this invoice. */
    @Column(name = "service_code", length = 40)
    private String serviceCode;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    /** After this date an unpaid invoice counts as overdue. */
    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "payment_method", length = 40)
    private String paymentMethod;

    @Column(name = "void_reason", length = 500)
    private String voidReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    /**
     * Overdue is derived rather than stored, so it cannot drift out of date
     * between runs of a scheduled job.
     */
    @Transient
    public boolean isOverdue() {
        return status != null
                && status.isOutstanding()
                && dueDate != null
                && dueDate.isBefore(LocalDate.now());
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PaymentStatus.ISSUED;
        }
        if (this.issuedAt == null) {
            this.issuedAt = this.createdAt;
        }
        if (this.dueDate == null) {
            this.dueDate = this.createdAt.toLocalDate().plusDays(PAYMENT_TERMS_DAYS);
        }
    }
}
