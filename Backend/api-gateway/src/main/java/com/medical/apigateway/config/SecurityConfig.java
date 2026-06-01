package com.medical.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
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

                        // Public endpoints
                        .pathMatchers("/actuator/health").permitAll()

                        // Patients
                        .pathMatchers(HttpMethod.GET, "/patients/**")
                        .hasAnyRole("DOCTOR", "NURSE", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/patients/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/patients/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/patients/**").hasRole("ADMIN")

                        // Doctors
                        .pathMatchers(HttpMethod.GET, "/doctors/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/doctors/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/doctors/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/doctors/**").hasRole("ADMIN")

                        // Appointments
                        .pathMatchers(HttpMethod.GET, "/appointments/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/appointments/**").hasAnyRole("RECEPTIONIST", "ADMIN")

                        // Billing
                        .pathMatchers(HttpMethod.GET, "/billing/**").hasAnyRole("BILLING", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/billing/**").hasAnyRole("BILLING", "ADMIN")
                        .pathMatchers("/billing/pay/**").hasAnyRole("BILLING", "ADMIN", "RECEPTIONIST")

                        // Prescriptions
                        .pathMatchers(HttpMethod.GET, "/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/prescriptions/**").hasAnyRole("DOCTOR", "ADMIN")

                        // Labs
                        .pathMatchers(HttpMethod.GET, "/labs/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")
                        .pathMatchers(HttpMethod.POST, "/labs/**").hasAnyRole("DOCTOR", "ADMIN")

                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                .build();
    }
}