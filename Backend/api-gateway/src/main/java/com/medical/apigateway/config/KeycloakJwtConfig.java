package com.medical.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

/**
 * Keycloak JWT wiring for the gateway.
 *
 * The browser reaches Keycloak on the published host port (localhost:8480), so
 * that URL is stamped into the "iss" claim of every token. The gateway runs
 * inside the Docker network and can only reach Keycloak at keycloak:8080.
 *
 * Configuring issuer-uri alone would make Spring fetch metadata from the
 * internal URL and then reject every token, because the issuer would not match.
 * So signing keys are fetched from the internal URL while the issuer claim is
 * validated against the external one.
 *
 * Role mapping lives in {@link KeycloakJwtAuthenticationConverter}, which is
 * intentionally not a bean.
 */
@Configuration
public class KeycloakJwtConfig {

    private final String jwkSetUri;
    private final String issuerUri;

    public KeycloakJwtConfig(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
            @Value("${keycloak.issuer-uri}") String issuerUri) {
        this.jwkSetUri = jwkSetUri;
        this.issuerUri = issuerUri;
    }

    /**
     * Fetches signing keys over the Docker network, but validates that the
     * "iss" claim matches the externally reachable issuer.
     */
    @Bean
    public ReactiveJwtDecoder reactiveJwtDecoder() {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder
                .withJwkSetUri(jwkSetUri)
                .build();

        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer));
        return decoder;
    }

}
