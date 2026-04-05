package com.medical.prescriptionservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {
    private Long id;
    private Long patientId;
    private Long doctorId;
    private String diagnosis;
    private String notes;
    private List<PrescriptionItemDTO> items;
    private LocalDateTime createdAt;
}
