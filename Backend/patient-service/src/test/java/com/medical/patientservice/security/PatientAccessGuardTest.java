package com.medical.patientservice.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The rule under test: a patient may read exactly one record, their own.
 * Everything else is either staff access or a denial.
 */
class PatientAccessGuardTest {

    private final PatientAccessGuard guard = new PatientAccessGuard();

    /** Builds a JWT-backed authentication carrying the given roles and claims. */
    private Authentication tokenWith(List<String> roles, Map<String, Object> extraClaims) {
        Jwt.Builder builder = Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .claim("preferred_username", "test.user")
                .claim("realm_access", Map.of("roles", roles));

        extraClaims.forEach(builder::claim);

        var authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();

        return new JwtAuthenticationToken(builder.build(), authorities, "test.user");
    }

    @Test
    @DisplayName("a patient can read their own record")
    void patientCanReadOwnRecord() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of("patientId", 1L));

        assertThat(guard.canRead(1L, auth)).isTrue();
    }

    @Test
    @DisplayName("a patient cannot read another patient's record")
    void patientCannotReadAnotherRecord() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of("patientId", 1L));

        assertThat(guard.canRead(2L, auth)).isFalse();
    }

    @Test
    @DisplayName("the patientId claim is accepted as a string as well as a number")
    void patientIdClaimMayBeAString() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of("patientId", "7"));

        assertThat(guard.canRead(7L, auth)).isTrue();
        assertThat(guard.canRead(8L, auth)).isFalse();
    }

    @Test
    @DisplayName("a patient with no patientId claim is denied")
    void patientWithoutClaimIsDenied() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of());

        assertThat(guard.canRead(1L, auth)).isFalse();
    }

    @Test
    @DisplayName("a malformed patientId claim is denied rather than throwing")
    void malformedClaimIsDenied() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of("patientId", "not-a-number"));

        assertThat(guard.canRead(1L, auth)).isFalse();
    }

    @Test
    @DisplayName("staff roles can read any record")
    void staffCanReadAnyRecord() {
        for (String role : List.of("ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE")) {
            Authentication auth = tokenWith(List.of(role), Map.of());

            assertThat(guard.canRead(999L, auth))
                    .as("role %s should read any patient", role)
                    .isTrue();
        }
    }

    @Test
    @DisplayName("only staff may list every patient")
    void onlyStaffMayListEveryone() {
        Authentication patient = tokenWith(List.of("PATIENT"), Map.of("patientId", 1L));
        Authentication doctor = tokenWith(List.of("DOCTOR"), Map.of());

        assertThat(guard.canReadAll(patient)).isFalse();
        assertThat(guard.canReadAll(doctor)).isTrue();
    }

    @Test
    @DisplayName("a role unrelated to patient care is denied")
    void unrelatedRoleIsDenied() {
        Authentication billing = tokenWith(List.of("BILLING"), Map.of());

        assertThat(guard.canRead(1L, billing)).isFalse();
        assertThat(guard.canReadAll(billing)).isFalse();
    }

    @Test
    @DisplayName("an unauthenticated caller is denied")
    void unauthenticatedIsDenied() {
        assertThat(guard.canRead(1L, null)).isFalse();
        assertThat(guard.canReadAll(null)).isFalse();
    }

    @Test
    @DisplayName("a null patient id is denied")
    void nullPatientIdIsDenied() {
        Authentication auth = tokenWith(List.of("PATIENT"), Map.of("patientId", 1L));

        assertThat(guard.canRead(null, auth)).isFalse();
    }

    @Test
    @DisplayName("a non-JWT authentication carries no patientId and is denied")
    void nonJwtAuthenticationIsDenied() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "someone", "password", List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));

        assertThat(guard.canRead(1L, auth)).isFalse();
    }
}
