package com.medical.billingservice.service;

import com.medical.billingservice.dto.CreateInvoiceRequest;
import com.medical.billingservice.dto.InvoiceDTO;
import com.medical.billingservice.entity.Invoice;
import com.medical.billingservice.entity.ClinicService;
import com.medical.billingservice.entity.PaymentStatus;
import com.medical.billingservice.exception.ResourceNotFoundException;
import com.medical.billingservice.exception.InvalidInvoiceStateException;
import com.medical.billingservice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.function.Consumer;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BillingServiceImpl implements BillingService {

    private final InvoiceRepository invoiceRepository;
    private final ClinicServiceCatalogue catalogue;

    @Override
    public InvoiceDTO createInvoice(CreateInvoiceRequest request) {
        // Idempotent by appointment. Billing is called from appointment-service
        // and that call can be retried, so raising a second invoice for the same
        // appointment would charge the patient twice. The database enforces this
        // too, with a unique constraint on appointment_id.
        Optional<Invoice> existing = invoiceRepository.findByAppointmentId(request.getAppointmentId());
        if (existing.isPresent()) {
            log.info("Invoice already exists for appointmentId={}, returning invoice id={}",
                    request.getAppointmentId(), existing.get().getId());
            return toDTO(existing.get());
        }

        ClinicService service = catalogue.requireByCode(request.getServiceCode());

        // An explicit amount wins, for an agreed discount or a charge with no
        // matching service. Otherwise the catalogue decides the price.
        BigDecimal amount = request.getAmount() != null ? request.getAmount() : service.getPrice();

        log.info("Creating invoice for appointmentId={} patientId={} service={} amount={} {}",
                request.getAppointmentId(), request.getPatientId(),
                service.getCode(), amount, service.getCurrency());

        Invoice invoice = Invoice.builder()
                .appointmentId(request.getAppointmentId())
                .patientId(request.getPatientId())
                .amount(amount)
                .currency(service.getCurrency())
                .serviceCode(service.getCode())
                .description(request.getDescription() != null
                        ? request.getDescription()
                        : service.getName())
                .status(PaymentStatus.ISSUED)
                .build();

        try {
            Invoice saved = invoiceRepository.save(invoice);
            log.info("Invoice created with id={}", saved.getId());
            return toDTO(saved);
        } catch (DataIntegrityViolationException e) {
            // Two concurrent calls for the same appointment: the loser reads the
            // invoice the winner wrote rather than failing the caller.
            log.warn("Concurrent invoice creation for appointmentId={}, reusing the existing one",
                    request.getAppointmentId());
            return invoiceRepository.findByAppointmentId(request.getAppointmentId())
                    .map(this::toDTO)
                    .orElseThrow(() -> e);
        }
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
        return transition(id, PaymentStatus.PAID, invoice -> {
            invoice.setPaidAt(LocalDateTime.now());
        });
    }

    @Override
    public InvoiceDTO cancelInvoice(Long id) {
        return transition(id, PaymentStatus.VOID, invoice -> { });
    }

    @Override
    public InvoiceDTO voidInvoice(Long id, String reason) {
        return transition(id, PaymentStatus.VOID, invoice -> invoice.setVoidReason(reason));
    }

    @Override
    public InvoiceDTO refundInvoice(Long id, String reason) {
        return transition(id, PaymentStatus.REFUNDED, invoice -> invoice.setVoidReason(reason));
    }

    /**
     * Move an invoice to another state, refusing anything the lifecycle does
     * not allow. Every status change goes through here so the rules cannot be
     * bypassed by a new endpoint forgetting to check.
     */
    private InvoiceDTO transition(Long id, PaymentStatus target, Consumer<Invoice> extra) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        PaymentStatus current = invoice.getStatus();
        if (!current.canTransitionTo(target)) {
            log.warn("Rejected invoice {} transition {} to {}", id, current, target);
            throw new InvalidInvoiceStateException(current, target);
        }

        invoice.setStatus(target);
        extra.accept(invoice);
        log.info("Invoice {} moved from {} to {}", id, current, target);
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
                .serviceCode(invoice.getServiceCode())
                .currency(invoice.getCurrency())
                .dueDate(invoice.getDueDate())
                .overdue(invoice.isOverdue())
                .voidReason(invoice.getVoidReason())
                .allowedTransitions(invoice.getStatus().allowedTransitions())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getAllInvoices() {
        return invoiceRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
