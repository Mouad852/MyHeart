package com.medical.labservice.service;

import com.medical.labservice.dto.*;

import java.util.List;

public interface LabService {

    LabRequestDTO createLabRequest(CreateLabRequestDTO request);

    LabResultDTO submitLabResult(CreateLabResultDTO resultDTO);

    List<LabRequestDTO> getRequestsByPatient(Long patientId);

    LabRequestDTO getRequestById(Long id);

    List<LabResultDTO> getResultsByRequest(Long labRequestId);
}
