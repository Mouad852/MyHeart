package com.medical.doctorservice.repository;

import com.medical.doctorservice.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
