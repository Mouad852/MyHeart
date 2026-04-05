package com.medical.labservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateLabResultDTO {

    @NotNull(message = "Lab Request ID is required")
    private Long labRequestId;

    private String resultText;

    /** Simulated file path / mock S3 key */
    private String filePath;

    private String observations;
}
