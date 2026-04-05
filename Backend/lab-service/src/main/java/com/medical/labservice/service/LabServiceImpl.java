package com.medical.labservice.service;

import com.medical.labservice.dto.*;
import com.medical.labservice.entity.LabRequest;
import com.medical.labservice.entity.LabResult;
import com.medical.labservice.entity.RequestStatus;
import com.medical.labservice.exception.ResourceNotFoundException;
import com.medical.labservice.repository.LabRequestRepository;
import com.medical.labservice.repository.LabResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LabServiceImpl implements LabService {

    private final LabRequestRepository labRequestRepository;
    private final LabResultRepository labResultRepository;

    @Override
    public LabRequestDTO createLabRequest(CreateLabRequestDTO request) {
        log.info("Creating lab request for patientId={}, test={}", request.getPatientId(), request.getTestName());
        LabRequest labRequest = LabRequest.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .testName(request.getTestName())
                .testDescription(request.getTestDescription())
                .status(RequestStatus.PENDING)
                .build();
        LabRequest saved = labRequestRepository.save(labRequest);
        return toRequestDTO(saved);
    }

    @Override
    public LabResultDTO submitLabResult(CreateLabResultDTO resultDTO) {
        log.info("Submitting lab result for requestId={}", resultDTO.getLabRequestId());
        LabRequest labRequest = labRequestRepository.findById(resultDTO.getLabRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + resultDTO.getLabRequestId()));

        LabResult result = LabResult.builder()
                .labRequestId(labRequest.getId())
                .resultText(resultDTO.getResultText())
                .filePath(resultDTO.getFilePath())
                .observations(resultDTO.getObservations())
                .build();

        labRequest.setStatus(RequestStatus.COMPLETED);
        labRequestRepository.save(labRequest);

        return toResultDTO(labResultRepository.save(result));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabRequestDTO> getRequestsByPatient(Long patientId) {
        return labRequestRepository.findByPatientId(patientId)
                .stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LabRequestDTO getRequestById(Long id) {
        LabRequest req = labRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab request not found with id: " + id));
        return toRequestDTO(req);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabResultDTO> getResultsByRequest(Long labRequestId) {
        return labResultRepository.findByLabRequestId(labRequestId)
                .stream().map(this::toResultDTO).collect(Collectors.toList());
    }

    private LabRequestDTO toRequestDTO(LabRequest r) {
        return LabRequestDTO.builder()
                .id(r.getId())
                .patientId(r.getPatientId())
                .doctorId(r.getDoctorId())
                .testName(r.getTestName())
                .testDescription(r.getTestDescription())
                .status(r.getStatus())
                .requestedAt(r.getRequestedAt())
                .build();
    }

    private LabResultDTO toResultDTO(LabResult r) {
        return LabResultDTO.builder()
                .id(r.getId())
                .labRequestId(r.getLabRequestId())
                .resultText(r.getResultText())
                .filePath(r.getFilePath())
                .observations(r.getObservations())
                .resultedAt(r.getResultedAt())
                .build();
    }
}
