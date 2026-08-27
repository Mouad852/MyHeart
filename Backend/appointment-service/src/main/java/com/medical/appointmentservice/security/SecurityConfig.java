package com.medical.appointmentservice.security;

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
 * Resource-server security for appointment-service.
 *
 * Reads are open to any authenticated caller here, because the interesting rule
 * is not "may you call this" but "which rows may you see". That narrowing
 * happens in the controller using {@link CallerIdentity}: staff see everything,
 * a patient sees only their own appointments.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info")
                        .permitAll()
                        .requestMatchers(HttpMethod.OPTIONS).permitAll()
                        // Booking and rescheduling stay with front-desk staff.
                        // A patient may ask for a slot on the collection
                        // endpoint only. The controller replaces the patientId
                        // with their own and records the appointment as
                        // REQUESTED, so asking is not the same as booking.
                        .requestMatchers(HttpMethod.POST, "/appointments")
                        .hasAnyRole("ADMIN", "RECEPTIONIST", "PATIENT")
                        .requestMatchers(HttpMethod.POST, "/appointments/**")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.PATCH, "/appointments/**")
                        .hasAnyRole("ADMIN", "RECEPTIONIST", "DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/appointments/**")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .requestMatchers(HttpMethod.DELETE, "/appointments/**")
                        .hasAnyRole("ADMIN", "RECEPTIONIST")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakRoleConverter())))
                .build();
    }

    /**
     * Who counts as staff for appointment data.
     *
     * Everyone who works in the clinic, because a receptionist books, a nurse
     * prepares, a billing clerk reconciles against the day, and all of them
     * legitimately see who is coming in. LAB_TECHNICIAN is deliberately absent:
     * they process samples and have no business in the diary, and the gateway
     * refuses them here in any case.
     */
    @Bean
    public CallerIdentity callerIdentity() {
        return new CallerIdentity(List.of(
                "ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_RECEPTIONIST",
                "ROLE_NURSE", "ROLE_BILLING"));
    }
}
