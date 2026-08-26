package com.medical.billingservice.repository;

import com.medical.billingservice.entity.Invoice;
import com.medical.billingservice.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    /** How many invoices sit in each status, and what they are worth. */
    interface StatusAggregate {
        PaymentStatus getStatus();
        long getCount();
        BigDecimal getAmount();
    }

    /** A single count-and-sum pair, for queries that return one row. */
    interface Aggregate {
        long getCount();
        BigDecimal getAmount();
    }

    /**
     * Counted and summed in the database rather than in the caller. A status
     * with no invoices simply has no row here; the service fills the gap so the
     * response shape does not change with the data.
     */
    @Query("""
            SELECT i.status AS status, COUNT(i) AS count, SUM(i.amount) AS amount
            FROM Invoice i
            GROUP BY i.status
            """)
    List<StatusAggregate> totalsByStatus();

    /**
     * Invoices still owed whose due date has passed.
     *
     * The date is a parameter rather than CURRENT_DATE so the boundary is
     * decided once, by the caller, and can be tested.
     */
    @Query("""
            SELECT COUNT(i) AS count, SUM(i.amount) AS amount
            FROM Invoice i
            WHERE i.status = com.medical.billingservice.entity.PaymentStatus.ISSUED
              AND i.dueDate < :today
            """)
    Aggregate overdueTotals(@Param("today") LocalDate today);

    /**
     * Every currency the clinic currently holds invoices in. Normally one; the
     * summary refuses to add up totals when it is more than one.
     */
    @Query("SELECT DISTINCT i.currency FROM Invoice i")
    List<String> distinctCurrencies();
}
