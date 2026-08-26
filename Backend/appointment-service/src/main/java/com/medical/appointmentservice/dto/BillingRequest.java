package com.medical.appointmentservice.dto;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class BillingRequest {
    private Long appointmentId;
    private Long patientId;
    /** Which catalogue entry billing should price this from. */
    private String serviceCode;
    private String description;
}
