package com.medical.doctorservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO classes for Doctor API request/response.
 */
public class DoctorDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Specialty is required")
        private String specialty;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long id;
        private String name;
        private String specialty;
        private String email;
        private String createdAt;
        private String updatedAt;
    }
}
