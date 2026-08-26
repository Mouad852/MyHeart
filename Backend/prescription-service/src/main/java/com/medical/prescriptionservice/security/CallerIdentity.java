package com.medical.prescriptionservice.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Answers "who is asking, and whose prescriptions may they see".
 *
 * A patient may read their own prescriptions and nobody else's. The check is
 * made against the patientId claim in the token rather than a path variable, so
 * changing the number in the URL changes nothing.
 *
 * TODO: this is the third copy of this class. It belongs in the common-lib
 * module queued for milestone 3, alongside KeycloakRoleConverter.
 */
@Component("prescriptionAccess")
@Slf4j
public class CallerIdentity {

    private static final String PATIENT_ID_CLAIM = "patientId";

    private static final String[] STAFF_ROLES = {
            "ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_RECEPTIONIST", "ROLE_NURSE", "ROLE_BILLING"
    };

    /** True when the caller is a patient with no staff role of any kind. */
    public boolean isPatientOnly(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return hasRole(authentication, "ROLE_PATIENT") && !hasAnyStaffRole(authentication);
    }

    /**
     * The patientId claim, or null when the token carries none. A patient token
     * without this claim can see nothing, which is the safe default.
     */
    public Long patientId(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return null;
        }
        Jwt jwt = jwtAuth.getToken();
        Object claim = jwt.getClaim(PATIENT_ID_CLAIM);
        if (claim == null) {
            return null;
        }
        if (claim instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(claim.toString().trim());
        } catch (NumberFormatException e) {
            log.warn("patientId claim '{}' is not a number", claim);
            return null;
        }
    }

    /** Whether the caller may read a prescription written for this patient. */
    public boolean canRead(Long ownerPatientId, Authentication authentication) {
        if (authentication == null || ownerPatientId == null) {
            return false;
        }
        if (hasAnyStaffRole(authentication)) {
            return true;
        }
        Long own = patientId(authentication);
        if (own == null) {
            return false;
        }
        boolean permitted = own.equals(ownerPatientId);
        if (!permitted) {
            log.warn("Caller '{}' (patientId={}) attempted to read a prescription of patient {}; denied",
                    authentication.getName(), own, ownerPatientId);
        }
        return permitted;
    }

    private boolean hasAnyStaffRole(Authentication authentication) {
        for (String role : STAFF_ROLES) {
            if (hasRole(authentication, role)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasRole(Authentication authentication, String role) {
        for (var authority : authentication.getAuthorities()) {
            if (role.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
