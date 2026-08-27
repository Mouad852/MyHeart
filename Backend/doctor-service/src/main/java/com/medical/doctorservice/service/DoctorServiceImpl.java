package com.medical.doctorservice.service;

import com.medical.doctorservice.dto.DoctorDTO;
import com.medical.doctorservice.dto.PageResponse;
import com.medical.doctorservice.entity.Doctor;
import com.medical.doctorservice.exception.DuplicateResourceException;
import com.medical.doctorservice.exception.ResourceNotFoundException;
import com.medical.doctorservice.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of DoctorService with full CRUD logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    @Override
    public DoctorDTO.Response createDoctor(DoctorDTO.Request request) {
        log.info("Creating doctor with email: {}", request.getEmail());

        if (doctorRepository.existsByEmail(request.getEmail())) {
            log.error("Doctor with email {} already exists", request.getEmail());
            throw new DuplicateResourceException(
                "Doctor with email " + request.getEmail() + " already exists"
            );
        }

        Doctor doctor = Doctor.builder()
                .name(request.getName())
                .specialty(request.getSpecialty())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        Doctor saved = doctorRepository.save(doctor);
        log.info("Doctor created with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DoctorDTO.Response> getDoctors(String term, Pageable pageable) {
        boolean searching = term != null && !term.isBlank();
        log.info("Fetching doctors page {} size {}{}",
                pageable.getPageNumber(), pageable.getPageSize(),
                searching ? " matching '" + term + "'" : "");

        Page<Doctor> page = searching
                ? doctorRepository.search(term.trim(), pageable)
                : doctorRepository.findAll(pageable);

        return PageResponse.from(page, this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDTO.Response> getDoctorsByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        log.info("Batch fetching {} doctors", ids.size());
        return doctorRepository.findByIdIn(ids).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorDTO.Response getDoctorById(Long id) {
        log.info("Fetching doctor with ID: {}", id);
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Doctor not found with ID: {}", id);
                    return new ResourceNotFoundException("Doctor not found with ID: " + id);
                });
        return mapToResponse(doctor);
    }

    @Override
    public DoctorDTO.Response updateDoctor(Long id, DoctorDTO.Request request) {
        log.info("Updating doctor with ID: {}", id);

        Doctor existing = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + id));

        if (!existing.getEmail().equals(request.getEmail())
                && doctorRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                "Doctor with email " + request.getEmail() + " already exists"
            );
        }

        existing.setName(request.getName());
        existing.setSpecialty(request.getSpecialty());
        existing.setEmail(request.getEmail());
        existing.setPhone(request.getPhone());

        Doctor updated = doctorRepository.save(existing);
        log.info("Doctor updated with ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    public void deleteDoctor(Long id) {
        log.info("Deleting doctor with ID: {}", id);

        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor not found with ID: " + id);
        }

        doctorRepository.deleteById(id);
        log.info("Doctor deleted with ID: {}", id);
    }

    private DoctorDTO.Response mapToResponse(Doctor doctor) {
        return DoctorDTO.Response.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .specialty(doctor.getSpecialty())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .createdAt(doctor.getCreatedAt() != null ? doctor.getCreatedAt().toString() : null)
                .updatedAt(doctor.getUpdatedAt() != null ? doctor.getUpdatedAt().toString() : null)
                .build();
    }
}
