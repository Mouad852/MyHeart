package com.medical.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Answers "who is asking, and whose records may they see".
 *
 * A patient may read their own records and nobody else's. Every check here is
 * made against a claim in the caller's token rather than against a path
 * variable or a query parameter, so changing the number in a URL changes
 * nothing at all.
 *
 * <h2>Why the staff roles are a constructor argument</h2>
 *
 * This class was copied into three services, and each copy carried its own
 * private {@code STAFF_ROLES} array. They drifted. lab-service's omitted
 * {@code ROLE_LAB_TECHNICIAN}, which meant the one role whose entire job is
 * filing laboratory reports was treated as a member of the public and refused
 * every result — a bug that survived because the role had no account to
 * exercise it, and because nothing about three separate arrays invites you to
 * compare them.
 *
 * The membership genuinely differs between services and should: a laboratory
 * technician has business reading laboratory work and none reading appointments
 * or prescriptions. So the set is not hard-coded here and defaulted; it is
 * required, and every service states its own in its security configuration
 * where a reader will see it. The difference is now a declaration rather than
 * an accident.
 */
@Slf4j
public class CallerIdentity {

    private static final String PATIENT_ID_CLAIM = "patientId";
    private static final String DOCTOR_ID_CLAIM = "doctorId";
    private static final String PATIENT_ROLE = "ROLE_PATIENT";

    private final Set<String> staffRoles;

    /**
     * @param staffRoles the authorities this service treats as staff, each
     *                   including the {@code ROLE_} prefix. Never empty: a
     *                   service with no staff roles would refuse everybody, and
     *                   that is far more likely to be a mistake than an
     *                   intention.
     */
    public CallerIdentity(Collection<String> staffRoles) {
        if (staffRoles == null || staffRoles.isEmpty()) {
            throw new IllegalArgumentException(
                    "A service must declare which roles it treats as staff; an empty set "
                            + "refuses every caller.");
        }
        for (String role : staffRoles) {
            if (role == null || !role.startsWith("ROLE_")) {
                throw new IllegalArgumentException(
                        "Staff roles must carry the ROLE_ prefix that the converter adds; got: "
                                + role);
            }
        }
        this.staffRoles = Set.copyOf(new LinkedHashSet<>(staffRoles));
    }

    /** True when the caller is a patient carrying no staff role of any kind. */
    public boolean isPatientOnly(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        return hasRole(authentication, PATIENT_ROLE) && !isStaff(authentication);
    }

    /** True when the caller holds any of the roles this service treats as staff. */
    public boolean isStaff(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        for (String role : staffRoles) {
            if (hasRole(authentication, role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * The patientId claim, or null when the token carries none. A patient token
     * without this claim can see nothing, which is the safe default.
     */
    public Long patientId(Authentication authentication) {
        return longClaim(authentication, PATIENT_ID_CLAIM);
    }

    /**
     * The doctorId claim, so a doctor's own views can be scoped to their own
     * calendar without trusting a query parameter.
     */
    public Long doctorId(Authentication authentication) {
        return longClaim(authentication, DOCTOR_ID_CLAIM);
    }

    /**
     * Whether the caller may read a record belonging to this patient.
     *
     * Staff may read any; a patient may read only their own. A refusal is logged
     * with both identities, because an attempt to read somebody else's record is
     * worth being able to find later.
     */
    public boolean canRead(Long ownerPatientId, Authentication authentication) {
        if (authentication == null || ownerPatientId == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long own = patientId(authentication);
        if (own == null) {
            return false;
        }
        boolean permitted = own.equals(ownerPatientId);
        if (!permitted) {
            log.warn("Caller '{}' (patientId={}) attempted to read a record of patient {}; denied",
                    authentication.getName(), own, ownerPatientId);
        }
        return permitted;
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

    private boolean hasRole(Authentication authentication, String role) {
        for (var authority : authentication.getAuthorities()) {
            if (role.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
