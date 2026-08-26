package com.medical.billingservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class ClinicServiceDTO {

    @Data
    public static class Request {

        @NotBlank(message = "A service code is required")
        private String code;

        @NotBlank(message = "A service name is required")
        private String name;

        private String description;

        @PositiveOrZero(message = "A price cannot be negative")
        private BigDecimal price;

        private Integer durationMinutes;

        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String code;
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private Integer durationMinutes;
        private Boolean active;
    }
}
