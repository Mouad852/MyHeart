package com.medical.patientservice.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Decides whether the caller may read a specific patient record.
 *
 * Staff roles may read any patient. A patient may read exactly one record:
 * their own, identified by the "patientId" claim that Keycloak adds through a
 * protocol mapper.
 *
 * Without this check, a signed-in patient could read every record in the clinic
 * simply by changing the id in the URL, which is the single most common
 * authorization bug in systems of this shape.
 */
@Component("patientAccess")
@Slf4j
public class PatientAccessGuard {

    private static final String PATIENT_ID_CLAIM = "patientId";

    /** Roles permitted to read any patient record. */
    private static final String[] STAFF_ROLES = {
            "ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_RECEPTIONIST", "ROLE_NURSE"
    };

    public boolean canRead(Long requestedPatientId, Authentication authentication) {
        if (authentication == null || requestedPatientId == null) {
            return false;
        }

        if (hasAnyStaffRole(authentication)) {
            return true;
        }

        Long ownPatientId = patientIdClaim(authentication);
        if (ownPatientId == null) {
            log.warn("Caller '{}' has no patientId claim and no staff role; denying access to patient {}",
                    authentication.getName(), requestedPatientId);
            return false;
        }

        boolean permitted = ownPatientId.equals(requestedPatientId);
        if (!permitted) {
            log.warn("Caller '{}' (patientId={}) attempted to read patient {}; denied",
                    authentication.getName(), ownPatientId, requestedPatientId);
        }
        return permitted;
    }

    /** Only staff may list every patient; a patient has no business doing so. */
    public boolean canReadAll(Authentication authentication) {
        return authentication != null && hasAnyStaffRole(authentication);
    }

    private boolean hasAnyStaffRole(Authentication authentication) {
        for (String role : STAFF_ROLES) {
            for (var authority : authentication.getAuthorities()) {
                if (role.equals(authority.getAuthority())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Reads the patientId claim. Keycloak may serialise it as a number or a
     * string depending on the mapper's declared type, so both are accepted.
     */
    private Long patientIdClaim(Authentication authentication) {
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
}
