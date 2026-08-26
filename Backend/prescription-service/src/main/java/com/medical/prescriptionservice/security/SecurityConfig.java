package com.medical.prescriptionservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Resource-server security for prescription-service.
 *
 * Until this existed the service validated nothing. Its port is published to
 * the host, so anyone who could reach it could read and write clinical and
 * financial records with no credentials at all. The gateway authorises
 * requests, but it is not the only way in.
 *
 * The rules below mirror the gateway's, with one deliberate difference: each
 * path prefix ends in a rule that matches every remaining method rather than an
 * enumeration of verbs. An allow-list of GET and POST leaves PATCH and PUT to
 * fall through to "any authenticated user", which is how a patient token was
 * able to refund an invoice.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // Stateless JWT authentication; no session, no CSRF token to forge.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Docker and Eureka need health checks without a token.
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info")
                        .permitAll()
                        .requestMatchers(HttpMethod.OPTIONS).permitAll()
                        .requestMatchers(HttpMethod.GET, "/prescriptions/**")
                        .hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        // Only a doctor prescribes. Every write, whatever the verb.
                        .requestMatchers("/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakRoleConverter())))
                .build();
    }
}
