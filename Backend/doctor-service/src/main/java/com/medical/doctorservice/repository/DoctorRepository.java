package com.medical.doctorservice.repository;

import com.medical.doctorservice.entity.Doctor;
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
 * Spring Data JPA Repository for Doctor entity.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Doctor> findBySpecialty(String specialty);

    /**
     * Free-text search across name, specialty and email, case-insensitive and
     * partial, matching how someone actually looks a doctor up.
     */
    @Query("""
            SELECT d FROM Doctor d
            WHERE LOWER(d.name)      LIKE LOWER(CONCAT('%', :term, '%'))
               OR LOWER(d.specialty) LIKE LOWER(CONCAT('%', :term, '%'))
               OR LOWER(d.email)     LIKE LOWER(CONCAT('%', :term, '%'))
            """)
    Page<Doctor> search(@Param("term") String term, Pageable pageable);

    /** Several doctors in one call, so a list can be enriched without an N+1. */
    List<Doctor> findByIdIn(Collection<Long> ids);
}
