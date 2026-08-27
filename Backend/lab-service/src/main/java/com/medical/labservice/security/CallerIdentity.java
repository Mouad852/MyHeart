package com.medical.labservice.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Answers "who is asking, and whose laboratory results may they see".
 *
 * A patient may read their own results and nobody else's. The check is
 * made against the patientId claim in the token rather than a path variable, so
 * changing the number in the URL changes nothing.
 *
 * TODO: this is the fourth copy of this class. It belongs in the common-lib
 * module queued for milestone 3, alongside KeycloakRoleConverter.
 */
@Component("labAccess")
@Slf4j
public class CallerIdentity {

    private static final String PATIENT_ID_CLAIM = "patientId";

    /**
     * Who counts as staff *for laboratory work*.
     *
     * LAB_TECHNICIAN belongs here and belongs here only. A technician processes
     * samples for the whole clinic, so they must be able to read any request and
     * any result in order to file a report against it — the gateway already
     * confines them to /labs and to attaching files, and nothing else.
     *
     * It was missing, which meant `canRead` treated the one role whose entire
     * job is filing reports as a member of the public, looked for a patientId
     * claim it does not carry, and refused. The role had no account until now,
     * so nothing had ever exercised the path.
     *
     * The same array appears in appointment-service and prescription-service
     * with a deliberately different membership: a laboratory technician has no
     * business reading appointments or prescriptions, and the gateway refuses
     * them there. This is exactly the drift that having three copies invites,
     * and the reason common-lib is queued.
     */
    private static final String[] STAFF_ROLES = {
            "ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_RECEPTIONIST", "ROLE_NURSE",
            "ROLE_BILLING", "ROLE_LAB_TECHNICIAN"
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

    /** Whether the caller may read a laboratory result belonging to this patient. */
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
            log.warn("Caller '{}' (patientId={}) attempted to read a laboratory result of patient {}; denied",
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
