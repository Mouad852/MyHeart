package com.medical.billingservice.service;

import com.medical.billingservice.dto.CreateInvoiceRequest;
import com.medical.billingservice.dto.InvoiceDTO;

import java.util.List;

public interface BillingService {

    InvoiceDTO createInvoice(CreateInvoiceRequest request);

    InvoiceDTO getInvoiceById(Long id);

    List<InvoiceDTO> getInvoicesByPatient(Long patientId);

    InvoiceDTO markAsPaid(Long id);

    InvoiceDTO cancelInvoice(Long id);

    /** Cancel an unpaid invoice, recording why. */
    InvoiceDTO voidInvoice(Long id, String reason);

    /** Return money on a paid invoice, recording why. */
    InvoiceDTO refundInvoice(Long id, String reason);

    List<InvoiceDTO> getAllInvoices();
}
