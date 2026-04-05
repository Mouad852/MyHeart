package com.medical.patientservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO classes for Patient request/response.
 * Separating DTOs from entities keeps the API contract stable
 * even if internal entity changes.
 */
public class PatientDTO {

    /**
     * Used for creating and updating a patient (inbound).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Phone must be valid (7-15 digits)")
        private String phone;
    }

    /**
     * Used for sending patient data to callers (outbound).
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long id;
        private String name;
        private String email;
        private String phone;
        private String createdAt;
        private String updatedAt;
    }
}
