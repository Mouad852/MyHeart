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
    private String observations;
    private LocalDateTime resultedAt;

    // The storage key is deliberately absent. It is an internal detail that
    // tells a caller nothing they can use, and publishing it would hand out the
    // shape of the filesystem for free. What a client needs is whether there is
    // a report, what it is called and how big it is; the bytes come from the
    // download endpoint, addressed by result id.
    private boolean hasFile;
    private String fileName;
    private String fileContentType;
    private Long fileSize;
    private LocalDateTime fileUploadedAt;
}
