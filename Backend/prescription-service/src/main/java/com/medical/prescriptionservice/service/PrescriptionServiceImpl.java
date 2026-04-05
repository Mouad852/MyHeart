package com.medical.prescriptionservice.service;

import com.medical.prescriptionservice.dto.CreatePrescriptionRequest;
import com.medical.prescriptionservice.dto.PrescriptionDTO;
import com.medical.prescriptionservice.dto.PrescriptionItemDTO;
import com.medical.prescriptionservice.entity.Prescription;
import com.medical.prescriptionservice.entity.PrescriptionItem;
import com.medical.prescriptionservice.exception.ResourceNotFoundException;
import com.medical.prescriptionservice.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    @Override
    public PrescriptionDTO createPrescription(CreatePrescriptionRequest request) {
        log.info("Creating prescription for patientId={}, doctorId={}", request.getPatientId(), request.getDoctorId());

        Prescription prescription = Prescription.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .diagnosis(request.getDiagnosis())
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        if (request.getItems() != null) {
            for (PrescriptionItemDTO itemDTO : request.getItems()) {
                PrescriptionItem item = PrescriptionItem.builder()
                        .prescription(prescription)
                        .medicineName(itemDTO.getMedicineName())
                        .dosage(itemDTO.getDosage())
                        .frequency(itemDTO.getFrequency())
                        .duration(itemDTO.getDuration())
                        .instructions(itemDTO.getInstructions())
                        .build();
                prescription.getItems().add(item);
            }
        }

        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Prescription created with id={}", saved.getId());
        return toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        return toDTO(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsByPatient(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsByDoctor(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private PrescriptionDTO toDTO(Prescription p) {
        List<PrescriptionItemDTO> itemDTOs = p.getItems().stream().map(item -> {
            PrescriptionItemDTO dto = new PrescriptionItemDTO();
            dto.setId(item.getId());
            dto.setMedicineName(item.getMedicineName());
            dto.setDosage(item.getDosage());
            dto.setFrequency(item.getFrequency());
            dto.setDuration(item.getDuration());
            dto.setInstructions(item.getInstructions());
            return dto;
        }).collect(Collectors.toList());

        return PrescriptionDTO.builder()
                .id(p.getId())
                .patientId(p.getPatientId())
                .doctorId(p.getDoctorId())
                .diagnosis(p.getDiagnosis())
                .notes(p.getNotes())
                .items(itemDTOs)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
