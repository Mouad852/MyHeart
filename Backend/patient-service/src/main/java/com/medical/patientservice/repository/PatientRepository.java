package com.medical.patientservice.repository;

import com.medical.patientservice.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
