package com.medical.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * API Gateway - Single entry point for all client requests.
 *
 * The gateway:
 *  - Routes requests to the correct microservice based on the URL path
 *  - Discovers service locations via Eureka (no hardcoded URLs)
 *  - Can apply cross-cutting concerns: auth, rate limiting, logging, CORS
 *
 * All routing rules are defined in application.properties using
 * Spring Cloud Gateway's route configuration.
 *
 * Routing examples:
 *  http://localhost:8080/patients/**   → patient-service
 *  http://localhost:8080/doctors/**    → doctor-service
 *  http://localhost:8080/appointments/** → appointment-service
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
