package com.medical.billingservice.controller;

import com.medical.billingservice.dto.ClinicServiceDTO;
import com.medical.billingservice.service.ClinicServiceCatalogue;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The clinic's priced service catalogue.
 *
 * Exposed under /billing so it travels with the rest of the money-related
 * routes and needs no new gateway rule.
 */
@RestController
@RequestMapping("/billing/services")
@RequiredArgsConstructor
@Slf4j
public class ClinicServiceController {

    private final ClinicServiceCatalogue catalogue;

    /**
     * GET /billing/services
     * Everything the clinic currently offers, with prices.
     */
    @GetMapping
    public ResponseEntity<List<ClinicServiceDTO.Response>> listServices() {
        log.info("REST GET /billing/services");
        return ResponseEntity.ok(catalogue.listActive());
    }

    /**
     * PATCH /billing/services/{code}
     * Change a price, a name or whether a service is still offered.
     */
    @PatchMapping("/{code}")
    public ResponseEntity<ClinicServiceDTO.Response> updateService(
            @PathVariable String code,
            @Valid @RequestBody ClinicServiceDTO.Request request) {
        log.info("REST PATCH /billing/services/{}", code);
        return ResponseEntity.ok(catalogue.updatePrice(code, request));
    }
}
