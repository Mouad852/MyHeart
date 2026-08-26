package com.medical.prescriptionservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The people a prescription names.
 *
 * The Feign clients used to return raw Object, which meant nothing could be
 * read from them without casting a LinkedHashMap by hand. The printed
 * prescription needs real names, so the responses are typed.
 *
 * Both are annotated to ignore unknown fields: patient-service and
 * doctor-service are free to add columns without breaking prescriptions.
 */
public class PartyInfo {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Patient {
        private Long id;
        private String name;
        private String email;
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Doctor {
        private Long id;
        private String name;
        private String specialty;
        private String email;
    }
}
