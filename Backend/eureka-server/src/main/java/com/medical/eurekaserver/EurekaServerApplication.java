package com.medical.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka Server - Service Discovery Registry.
 *
 * All microservices register themselves here on startup.
 * When one service needs to call another (e.g., appointment-service
 * calling patient-service), it asks Eureka for the current address
 * instead of using a hardcoded URL.
 *
 * Dashboard available at: http://localhost:8761
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
