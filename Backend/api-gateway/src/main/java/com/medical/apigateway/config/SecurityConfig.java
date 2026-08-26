package com.medical.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(ex -> ex

                        // CORS preflight carries no credentials and must never be blocked.
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()

                        // Public endpoints
                        .pathMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()

                        // Patients
                        // PATIENT is allowed through here on purpose. The gateway
                        // cannot tell whose record is being requested, so
                        // patient-service makes the ownership decision and returns
                        // 403 when a patient asks for a record that is not theirs.
                        .pathMatchers(HttpMethod.GET, "/patients/**")
                        .hasAnyRole("DOCTOR", "NURSE", "ADMIN", "RECEPTIONIST", "PATIENT")
                        .pathMatchers(HttpMethod.POST, "/patients/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/patients/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/patients/**").hasRole("ADMIN")
                        // Any other method on a patient record.
                        .pathMatchers("/patients/**").hasAnyRole("ADMIN", "RECEPTIONIST")

                        // Doctors
                        .pathMatchers(HttpMethod.GET, "/doctors/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/doctors/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/doctors/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/doctors/**").hasRole("ADMIN")
                        // Any other method on the medical register.
                        .pathMatchers("/doctors/**").hasRole("ADMIN")

                        // Appointments
                        // PATIENT is allowed through; appointment-service narrows
                        // the result to appointments that belong to them.
                        .pathMatchers(HttpMethod.GET, "/appointments/**")
                        .hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT")
                        // A patient may ask for a slot on the one collection
                        // endpoint. appointment-service replaces the patientId
                        // with their own and records it as REQUESTED, so a
                        // request still has to be agreed by the desk.
                        .pathMatchers(HttpMethod.POST, "/appointments")
                        .hasAnyRole("RECEPTIONIST", "ADMIN", "PATIENT")
                        .pathMatchers(HttpMethod.POST, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        // The lifecycle transitions are PATCH, which matched
                        // none of the rules above and fell through to "any
                        // authenticated user". appointment-service refused
                        // them on its own, which is the only reason that was
                        // not exploitable.
                        .pathMatchers("/appointments/**")
                        .hasAnyRole("RECEPTIONIST", "ADMIN", "DOCTOR")

                        // Billing
                        .pathMatchers(HttpMethod.GET, "/billing/**").hasAnyRole("BILLING", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/billing/**").hasAnyRole("BILLING", "ADMIN")
                        .pathMatchers("/billing/pay/**").hasAnyRole("BILLING", "ADMIN", "RECEPTIONIST")
                        // void, cancel and refund are PUT and matched nothing,
                        // so a patient token could refund an invoice it was
                        // not even allowed to read.
                        .pathMatchers("/billing/**").hasAnyRole("BILLING", "ADMIN")

                        // Prescriptions
                        // PATIENT is allowed through; prescription-service
                        // checks ownership against the token and refuses any
                        // prescription that is not the caller's own.
                        .pathMatchers(HttpMethod.GET, "/prescriptions/**")
                        .hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT")
                        .pathMatchers(HttpMethod.POST, "/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")
                        .pathMatchers("/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")

                        // Labs
                        // PATIENT is allowed through; lab-service checks
                        // ownership against the token.
                        .pathMatchers(HttpMethod.GET, "/labs/**")
                        .hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT", "LAB_TECHNICIAN")
                        .pathMatchers(HttpMethod.POST, "/labs/results/*/file")
                        .hasAnyRole("DOCTOR", "ADMIN", "LAB_TECHNICIAN")
                        .pathMatchers(HttpMethod.POST, "/labs/**").hasAnyRole("DOCTOR", "ADMIN")
                        .pathMatchers("/labs/**").hasAnyRole("DOCTOR", "ADMIN")

                        .anyExchange().authenticated())
                // Without this converter Keycloak's realm_access.roles claim is
                // never translated into ROLE_* authorities, and every hasRole
                // rule above would reject otherwise valid tokens.
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakJwtAuthenticationConverter())))
                .build();
    }
}