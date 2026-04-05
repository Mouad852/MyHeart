package com.medical.billingservice.service;

import com.medical.billingservice.dto.CreateInvoiceRequest;
import com.medical.billingservice.dto.InvoiceDTO;
import com.medical.billingservice.entity.Invoice;
import com.medical.billingservice.entity.PaymentStatus;
import com.medical.billingservice.exception.ResourceNotFoundException;
import com.medical.billingservice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BillingServiceImpl implements BillingService {

    private final InvoiceRepository invoiceRepository;

    @Override
    public InvoiceDTO createInvoice(CreateInvoiceRequest request) {
        log.info("Creating invoice for appointmentId={}, patientId={}", request.getAppointmentId(), request.getPatientId());
        Invoice invoice = Invoice.builder()
                .appointmentId(request.getAppointmentId())
                .patientId(request.getPatientId())
                .amount(request.getAmount())
                .description(request.getDescription())
                .status(PaymentStatus.PENDING)
                .build();
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice created with id={}", saved.getId());
        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return toDTO(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoicesByPatient(Long patientId) {
        return invoiceRepository.findByPatientId(patientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceDTO markAsPaid(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        if (invoice.getStatus() == PaymentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot pay a cancelled invoice");
        }
        invoice.setStatus(PaymentStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        return toDTO(invoiceRepository.save(invoice));
    }

    @Override
    public InvoiceDTO cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        if (invoice.getStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Cannot cancel a paid invoice");
        }
        invoice.setStatus(PaymentStatus.CANCELLED);
        return toDTO(invoiceRepository.save(invoice));
    }

    private InvoiceDTO toDTO(Invoice invoice) {
        return InvoiceDTO.builder()
                .id(invoice.getId())
                .appointmentId(invoice.getAppointmentId())
                .patientId(invoice.getPatientId())
                .amount(invoice.getAmount())
                .status(invoice.getStatus())
                .description(invoice.getDescription())
                .createdAt(invoice.getCreatedAt())
                .paidAt(invoice.getPaidAt())
                .build();
    }
}
