package com.medical.prescriptionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
