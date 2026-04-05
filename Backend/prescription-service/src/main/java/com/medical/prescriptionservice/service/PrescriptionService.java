package com.medical.prescriptionservice.service;

import com.medical.prescriptionservice.dto.CreatePrescriptionRequest;
import com.medical.prescriptionservice.dto.PrescriptionDTO;

import java.util.List;

public interface PrescriptionService {

    PrescriptionDTO createPrescription(CreatePrescriptionRequest request);

    PrescriptionDTO getPrescriptionById(Long id);

    List<PrescriptionDTO> getPrescriptionsByPatient(Long patientId);

    List<PrescriptionDTO> getPrescriptionsByDoctor(Long doctorId);
}
