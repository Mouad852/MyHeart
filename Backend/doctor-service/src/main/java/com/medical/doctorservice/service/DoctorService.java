package com.medical.doctorservice.service;

import com.medical.doctorservice.dto.DoctorDTO;

import java.util.List;

/**
 * Doctor service interface.
 */
public interface DoctorService {

    DoctorDTO.Response createDoctor(DoctorDTO.Request request);

    List<DoctorDTO.Response> getAllDoctors();

    DoctorDTO.Response getDoctorById(Long id);

    DoctorDTO.Response updateDoctor(Long id, DoctorDTO.Request request);

    void deleteDoctor(Long id);
}
