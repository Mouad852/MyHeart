package com.medical.appointmentservice.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Answers "who is asking, and what may they see" for appointment data.
 *
 * A patient may only ever see appointments that are theirs. Rather than
 * filtering in the browser, which anyone can bypass, the query itself is
 * narrowed to the patientId carried in the caller's token.
 */
@Component("appointmentAccess")
@Slf4j
public class CallerIdentity {

    private static final String PATIENT_ID_CLAIM = "patientId";
    private static final String DOCTOR_ID_CLAIM = "doctorId";

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

    public boolean isStaff(Authentication authentication) {
        return authentication != null && hasAnyStaffRole(authentication);
    }

    /**
     * The patientId claim, or null when the token carries none. A patient token
     * without this claim can see nothing, which is the safe default.
     */
    public Long patientId(Authentication authentication) {
        return longClaim(authentication, PATIENT_ID_CLAIM);
    }

    private Long longClaim(Authentication authentication, String claimName) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return null;
        }
        Jwt jwt = jwtAuth.getToken();
        Object claim = jwt.getClaim(claimName);
        if (claim == null) {
            return null;
        }
        if (claim instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(claim.toString().trim());
        } catch (NumberFormatException e) {
            log.warn("{} claim '{}' is not a number", claimName, claim);
            return null;
        }
    }

    /**
     * The doctorId claim, so a doctor's own views can be scoped to their own
     * calendar without trusting a query parameter.
     */
    public Long doctorId(Authentication authentication) {
        return longClaim(authentication, DOCTOR_ID_CLAIM);
    }

    /** Whether the caller may read an appointment belonging to this patient. */
    public boolean canReadAppointmentOf(Long ownerPatientId, Authentication authentication) {
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
            log.warn("Caller '{}' (patientId={}) attempted to read an appointment of patient {}; denied",
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
