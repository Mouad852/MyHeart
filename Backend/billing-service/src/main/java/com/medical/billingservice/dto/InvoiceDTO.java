package com.medical.billingservice.dto;

import com.medical.billingservice.entity.PaymentStatus;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
}
