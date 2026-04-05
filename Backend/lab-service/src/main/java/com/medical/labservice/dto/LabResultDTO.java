package com.medical.labservice.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultDTO {
    private Long id;
    private Long labRequestId;
    private String resultText;
    private String filePath;
    private String observations;
    private LocalDateTime resultedAt;
}
