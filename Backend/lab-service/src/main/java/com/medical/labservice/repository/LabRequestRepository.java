package com.medical.labservice.repository;

import com.medical.labservice.entity.LabRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabRequestRepository extends JpaRepository<LabRequest, Long> {

    List<LabRequest> findByPatientId(Long patientId);

    List<LabRequest> findByDoctorId(Long doctorId);
}
