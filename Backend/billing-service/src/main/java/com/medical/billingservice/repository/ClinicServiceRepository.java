package com.medical.billingservice.repository;

import com.medical.billingservice.entity.ClinicService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicServiceRepository extends JpaRepository<ClinicService, Long> {

    Optional<ClinicService> findByCode(String code);

    /** Retired services stay in the table for the invoices that reference them. */
    List<ClinicService> findByActiveTrueOrderByNameAsc();
}
