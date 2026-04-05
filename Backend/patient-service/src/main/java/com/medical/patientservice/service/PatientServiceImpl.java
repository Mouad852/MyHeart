package com.medical.patientservice.service;

import com.medical.patientservice.dto.PatientDTO;
import com.medical.patientservice.entity.Patient;
import com.medical.patientservice.exception.DuplicateResourceException;
import com.medical.patientservice.exception.ResourceNotFoundException;
import com.medical.patientservice.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of PatientService.
 * Contains all business logic for patient management.
 *
 * @Transactional ensures DB operations are wrapped in transactions.
 * @Slf4j provides a logger via Lombok.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    public PatientDTO.Response createPatient(PatientDTO.Request request) {
        log.info("Creating new patient with email: {}", request.getEmail());

        // Check for duplicate email
        if (patientRepository.existsByEmail(request.getEmail())) {
            log.error("Patient with email {} already exists", request.getEmail());
            throw new DuplicateResourceException(
                "Patient with email " + request.getEmail() + " already exists"
            );
        }

        Patient patient = Patient.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        Patient saved = patientRepository.save(patient);
        log.info("Patient created successfully with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDTO.Response> getAllPatients() {
        log.info("Fetching all patients");
        return patientRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDTO.Response getPatientById(Long id) {
        log.info("Fetching patient with ID: {}", id);
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Patient not found with ID: {}", id);
                    return new ResourceNotFoundException("Patient not found with ID: " + id);
                });
        return mapToResponse(patient);
    }

    @Override
    public PatientDTO.Response updatePatient(Long id, PatientDTO.Request request) {
        log.info("Updating patient with ID: {}", id);

        Patient existing = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        // If email is being changed, check for duplicates
        if (!existing.getEmail().equals(request.getEmail())
                && patientRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                "Patient with email " + request.getEmail() + " already exists"
            );
        }

        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        existing.setPhone(request.getPhone());

        Patient updated = patientRepository.save(existing);
        log.info("Patient updated successfully with ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    public void deletePatient(Long id) {
        log.info("Deleting patient with ID: {}", id);

        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + id);
        }

        patientRepository.deleteById(id);
        log.info("Patient deleted successfully with ID: {}", id);
    }

    /**
     * Maps a Patient entity to a PatientDTO.Response.
     * This keeps entity internals away from the API layer.
     */
    private PatientDTO.Response mapToResponse(Patient patient) {
        return PatientDTO.Response.builder()
                .id(patient.getId())
                .name(patient.getName())
                .email(patient.getEmail())
                .phone(patient.getPhone())
                .createdAt(patient.getCreatedAt() != null ? patient.getCreatedAt().toString() : null)
                .updatedAt(patient.getUpdatedAt() != null ? patient.getUpdatedAt().toString() : null)
                .build();
    }
}
