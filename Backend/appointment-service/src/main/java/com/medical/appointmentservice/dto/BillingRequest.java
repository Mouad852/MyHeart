package com.medical.appointmentservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BillingRequest {
    private Long appointmentId;
    private Long patientId;
    private BigDecimal amount;
    private String description;
}
