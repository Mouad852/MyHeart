package com.medical.doctorservice.service;

import com.medical.doctorservice.dto.DoctorDTO;
import com.medical.doctorservice.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Collection;

import java.util.List;

/**
 * Doctor service interface.
 */
public interface DoctorService {

    DoctorDTO.Response createDoctor(DoctorDTO.Request request);

    /**
     * A page of doctors, optionally narrowed by a search term.
     *
     * @param term free text matched against name, specialty and email
     */
    PageResponse<DoctorDTO.Response> getDoctors(String term, Pageable pageable);

    /** Several doctors by id, for callers enriching a list in one request. */
    List<DoctorDTO.Response> getDoctorsByIds(Collection<Long> ids);

    DoctorDTO.Response getDoctorById(Long id);

    DoctorDTO.Response updateDoctor(Long id, DoctorDTO.Request request);

    void deleteDoctor(Long id);
}
