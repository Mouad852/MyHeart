package com.medical.billingservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A service the clinic offers and what it costs.
 *
 * Prices live here rather than in whichever service happens to create an
 * invoice, so changing what a consultation costs is a data change made by an
 * administrator, not a code change and a redeploy.
 */
@Entity
@Table(name = "clinic_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable identifier used by other services, for example CONSULTATION. */
    @NotBlank
    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @NotBlank
    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @PositiveOrZero
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 30;

    /** Retired services stay for the invoices that reference them. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
