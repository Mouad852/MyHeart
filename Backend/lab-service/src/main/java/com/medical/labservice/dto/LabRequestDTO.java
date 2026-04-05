package com.medical.labservice.dto;

import com.medical.labservice.entity.RequestStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabRequestDTO {
    private Long id;
    private Long patientId;
    private Long doctorId;
    private String testName;
    private String testDescription;
    private RequestStatus status;
    private LocalDateTime requestedAt;
}
