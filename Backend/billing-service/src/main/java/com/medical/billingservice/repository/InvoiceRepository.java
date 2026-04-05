package com.medical.billingservice.repository;

import com.medical.billingservice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByPatientId(Long patientId);

    List<Invoice> findByAppointmentId(Long appointmentId);
}
