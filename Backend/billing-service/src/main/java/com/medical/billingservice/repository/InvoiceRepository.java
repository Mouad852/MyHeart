package com.medical.billingservice.repository;

import com.medical.billingservice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByPatientId(Long patientId);

    /**
     * The invoice raised for an appointment, if there is one.
     *
     * Optional rather than List because appointment_id is unique: invoice
     * creation is idempotent, so a retried billing call finds the existing
     * invoice instead of charging the patient twice.
     */
    Optional<Invoice> findByAppointmentId(Long appointmentId);
}
