package com.medical.patientservice.service;

import com.medical.patientservice.dto.PageResponse;
import com.medical.patientservice.dto.PatientDTO;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

/**
 * Patient service interface defining the business operations.
 * Using an interface allows easy mocking in tests and
 * makes swapping implementations straightforward.
 */
public interface PatientService {

    PatientDTO.Response createPatient(PatientDTO.Request request);

    /**
     * A page of patients, optionally narrowed by a search term.
     *
     * @param term free text matched against name, email and phone; may be null
     */
    PageResponse<PatientDTO.Response> getPatients(String term, Pageable pageable);

    /** Several patients by id, for callers enriching a list in one request. */
    List<PatientDTO.Response> getPatientsByIds(Collection<Long> ids);

    PatientDTO.Response getPatientById(Long id);

    PatientDTO.Response updatePatient(Long id, PatientDTO.Request request);

    void deletePatient(Long id);
}
