package com.medical.labservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long labRequestId;

    @Column(columnDefinition = "TEXT")
    private String resultText;

    /** Simulated file path (local storage or mock S3 key) */
    private String filePath;

    private String observations;

    @Column(nullable = false)
    private LocalDateTime resultedAt;

    @PrePersist
    protected void onCreate() {
        this.resultedAt = LocalDateTime.now();
    }
}
