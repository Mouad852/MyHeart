package com.medical.labservice.security;

import com.medical.common.security.CallerIdentity;
import com.medical.common.security.KeycloakRoleConverter;

import org.springframework.context.annotation.Bean;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Resource-server security for lab-service.
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
                        // PATIENT is allowed through here on purpose. The rule
                        // cannot tell whose result is being asked for, so the
                        // controller checks ownership against the token and
                        // refuses anything that is not the caller's own.
                        .requestMatchers(HttpMethod.GET, "/labs/**")
                        .hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT", "LAB_TECHNICIAN")
                        // Uploading a report is laboratory work.
                        .requestMatchers(HttpMethod.POST, "/labs/results/*/file")
                        .hasAnyRole("DOCTOR", "ADMIN", "LAB_TECHNICIAN")
                        // Every write, whatever the verb.
                        .requestMatchers("/labs/**").hasAnyRole("DOCTOR", "ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakRoleConverter())))
                .build();
    }

    /**
     * Who counts as staff for laboratory work.
     *
     * This is the one set that includes LAB_TECHNICIAN, and it is the whole
     * reason the shared class takes the roles as an argument rather than
     * hard-coding them. A technician processes samples for the clinic, so they
     * must be able to read any request and any result in order to file a report
     * against it; the gateway already confines them to /labs and to attaching
     * files, and nothing else.
     *
     * When this was a private array in a copied class it omitted the role, and
     * the omission refused every result to the one person whose job is filing
     * them.
     */
    @Bean
    public CallerIdentity callerIdentity() {
        return new CallerIdentity(List.of(
                "ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_RECEPTIONIST", "ROLE_NURSE",
                "ROLE_BILLING", "ROLE_LAB_TECHNICIAN"));
    }
}
