package com.medical.billingservice.controller;

import com.medical.billingservice.dto.CreateInvoiceRequest;
import com.medical.billingservice.dto.InvoiceDTO;
import com.medical.billingservice.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/create")
    public ResponseEntity<InvoiceDTO> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return new ResponseEntity<>(billingService.createInvoice(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDTO> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getInvoiceById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getInvoicesByPatient(patientId));
    }

    @PutMapping("/pay/{id}")
    public ResponseEntity<InvoiceDTO> payInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.markAsPaid(id));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<InvoiceDTO> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.cancelInvoice(id));
    }
}
