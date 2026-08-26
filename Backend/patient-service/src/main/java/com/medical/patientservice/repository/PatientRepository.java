package com.medical.patientservice.repository;

import com.medical.patientservice.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Patient entity.
 * JpaRepository provides all basic CRUD operations out of the box.
 */
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    /**
     * Find a patient by their email address.
     * Used to check for duplicate emails before creating a new patient.
     */
    Optional<Patient> findByEmail(String email);

    /**
     * Check if a patient exists by email.
     */
    boolean existsByEmail(String email);

    /**
     * Free-text search across the fields a receptionist would actually type:
     * name, email or phone. Matching is case-insensitive and partial.
     */
    @Query("""
            SELECT p FROM Patient p
            WHERE LOWER(p.name)  LIKE LOWER(CONCAT('%', :term, '%'))
               OR LOWER(p.email) LIKE LOWER(CONCAT('%', :term, '%'))
               OR p.phone        LIKE CONCAT('%', :term, '%')
            """)
    Page<Patient> search(@Param("term") String term, Pageable pageable);

    /**
     * Fetch many patients in one call.
     *
     * Exists so that appointment-service can enrich a page of appointments
     * with a single request instead of one per row.
     */
    List<Patient> findByIdIn(Collection<Long> ids);
}
