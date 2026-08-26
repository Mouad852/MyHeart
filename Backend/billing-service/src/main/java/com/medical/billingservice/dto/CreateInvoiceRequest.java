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

    /**
     * Which catalogue entry to price this invoice from. Optional: a general
     * consultation is assumed when it is absent.
     */
    private String serviceCode;

    /**
     * An explicit amount, which overrides the catalogue price.
     *
     * Left in for the cases a clinic actually has, such as an agreed discount
     * or a charge with no matching service. Callers that simply want the
     * standard price should send serviceCode and leave this empty.
     */
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String description;
}
