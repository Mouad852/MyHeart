package com.medical.patientservice.service;

import com.medical.patientservice.dto.PatientDTO;
import java.util.List;

/**
 * Patient service interface defining the business operations.
 * Using an interface allows easy mocking in tests and
 * makes swapping implementations straightforward.
 */
public interface PatientService {

    PatientDTO.Response createPatient(PatientDTO.Request request);

    List<PatientDTO.Response> getAllPatients();

    PatientDTO.Response getPatientById(Long id);

    PatientDTO.Response updatePatient(Long id, PatientDTO.Request request);

    void deletePatient(Long id);
}
