package com.medical.billingservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateInvoiceRequest {

    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String description;
}
