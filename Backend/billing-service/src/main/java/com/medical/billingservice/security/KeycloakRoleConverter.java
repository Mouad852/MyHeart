package com.medical.billingservice.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.Map;

/**
 * Maps Keycloak's realm_access.roles claim onto ROLE_* authorities.
 *
 * The gateway performs the same translation for coarse routing rules. This copy
 * exists because the service must be able to defend itself: anything on the
 * Docker network can call it directly, bypassing the gateway entirely.
 *
 * TODO: move to a shared common-lib module once more services adopt it, rather
 * than copying this class six times.
 */
public class KeycloakRoleConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String ROLES_CLAIM = "roles";
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String USERNAME_CLAIM = "preferred_username";

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        return new JwtAuthenticationToken(jwt, extractAuthorities(jwt), principalName(jwt));
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim(REALM_ACCESS_CLAIM);
        if (realmAccess == null) {
            return Collections.emptyList();
        }
        if (!(realmAccess.get(ROLES_CLAIM) instanceof Collection<?> roles)) {
            return Collections.emptyList();
        }
        return roles.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(ROLE_PREFIX + role))
                .distinct()
                .collect(Collectors.toUnmodifiableList());
    }

    private String principalName(Jwt jwt) {
        String username = jwt.getClaimAsString(USERNAME_CLAIM);
        return (username != null && !username.isBlank())
                ? username
                : jwt.getClaimAsString(JwtClaimNames.SUB);
    }
}
