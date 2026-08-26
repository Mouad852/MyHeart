package com.medical.apigateway.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Translates a Keycloak access token into a Spring Security authentication.
 *
 * Keycloak publishes realm roles in a nested "realm_access.roles" claim.
 * Spring Security knows nothing about that structure and expects authorities
 * named "ROLE_*", so without this converter every hasRole(...) rule in
 * {@link SecurityConfig} rejects otherwise valid tokens.
 *
 * Deliberately NOT a @Bean: a Converter published as a bean is picked up by the
 * WebFlux ConversionService, which then fails to determine the source and target
 * types. SecurityConfig instantiates this class directly instead.
 */
public class KeycloakJwtAuthenticationConverter
        implements Converter<Jwt, Mono<AbstractAuthenticationToken>> {

    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String ROLES_CLAIM = "roles";
    private static final String ROLE_PREFIX = "ROLE_";
    private static final String USERNAME_CLAIM = "preferred_username";

    @Override
    public Mono<AbstractAuthenticationToken> convert(Jwt jwt) {
        return Mono.just(new JwtAuthenticationToken(jwt, extractAuthorities(jwt), principalName(jwt)));
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
                // Keycloak also ships internal roles such as offline_access and
                // default-roles-myheart. Mapping them is harmless and keeps the
                // authority list faithful to the token when debugging.
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(ROLE_PREFIX + role))
                .distinct()
                .collect(Collectors.toUnmodifiableList());
    }

    private String principalName(Jwt jwt) {
        String preferredUsername = jwt.getClaimAsString(USERNAME_CLAIM);
        if (preferredUsername != null && !preferredUsername.isBlank()) {
            return preferredUsername;
        }
        return jwt.getClaimAsString(JwtClaimNames.SUB);
    }
}
