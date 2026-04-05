package com.medical.labservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private String testName;

    private String testDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @PrePersist
    protected void onCreate() {
        this.requestedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = RequestStatus.PENDING;
        }
    }
}
