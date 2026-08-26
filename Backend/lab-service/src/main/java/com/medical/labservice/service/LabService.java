package com.medical.labservice.service;

import com.medical.labservice.dto.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface LabService {

    LabRequestDTO createLabRequest(CreateLabRequestDTO request);

    LabResultDTO submitLabResult(CreateLabResultDTO resultDTO);

    List<LabRequestDTO> getRequestsByPatient(Long patientId);

    LabRequestDTO getRequestById(Long id);

    List<LabRequestDTO> getAllRequests();

    List<LabResultDTO> getResultsByRequest(Long labRequestId);

    /** Attach a report to a result, replacing any file already on it. */
    LabResultDTO attachFile(Long resultId, MultipartFile file);

    /** The stored report for a result, ready to be written to a response. */
    LabAttachment getAttachment(Long resultId);

    /** The patient a result belongs to, for judging who may read it. */
    Long ownerPatientId(Long resultId);
}
