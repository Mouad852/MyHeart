package com.medical.appointmentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Appointment Service - Entry point.
 *
 * Key annotations:
 *  - @EnableFeignClients: Scans for @FeignClient interfaces and creates
 *    HTTP proxies for them. This is what enables calling Patient and Doctor services.
 *  - @EnableDiscoveryClient: Registers this service with Eureka so other
 *    services can discover it by name instead of a hard-coded URL.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class AppointmentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppointmentServiceApplication.class, args);
    }
}
