package com.medical.billingservice.controller;

import com.medical.billingservice.dto.BillingSummaryDTO;
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

    /**
     * GET /billing/summary
     * Counts and totals for the overview screen. Declared before /{id} so the
     * literal path wins, and cheap enough to poll: the work happens in three
     * aggregate queries, not by loading invoices.
     */
    @GetMapping("/summary")
    public ResponseEntity<BillingSummaryDTO.Response> getSummary() {
        return ResponseEntity.ok(billingService.getSummary());
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

    /**
     * PUT /billing/void/{id}
     * Cancel an unpaid invoice, recording why.
     */
    @PutMapping("/void/{id}")
    public ResponseEntity<InvoiceDTO> voidInvoice(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(billingService.voidInvoice(id, reason));
    }

    /**
     * PUT /billing/refund/{id}
     * Return money on a paid invoice, recording why.
     */
    @PutMapping("/refund/{id}")
    public ResponseEntity<InvoiceDTO> refundInvoice(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(billingService.refundInvoice(id, reason));
    }

    @GetMapping
    public ResponseEntity<List<InvoiceDTO>> getAllInvoices() {
        return ResponseEntity.ok(billingService.getAllInvoices());
    }
}
