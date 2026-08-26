package com.medical.labservice.service;

import com.medical.labservice.dto.*;
import com.medical.labservice.entity.LabRequest;
import com.medical.labservice.entity.LabResult;
import com.medical.labservice.entity.RequestStatus;
import com.medical.labservice.exception.ResourceNotFoundException;
import com.medical.labservice.repository.LabRequestRepository;
import com.medical.labservice.repository.LabResultRepository;
import com.medical.labservice.storage.LabFileStore;
import com.medical.labservice.storage.UploadedFileGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LabServiceImpl implements LabService {

    private final LabRequestRepository labRequestRepository;
    private final LabResultRepository labResultRepository;
    private final LabFileStore fileStore;
    private final UploadedFileGuard fileGuard;

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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lab request not found with id: " + resultDTO.getLabRequestId()));

        LabResult result = LabResult.builder()
                .labRequestId(labRequest.getId())
                .resultText(resultDTO.getResultText())
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
                .observations(r.getObservations())
                .resultedAt(r.getResultedAt())
                .hasFile(r.hasFile())
                .fileName(r.getFileName())
                .fileContentType(r.getFileContentType())
                .fileSize(r.getFileSize())
                .fileUploadedAt(r.getFileUploadedAt())
                .build();
    }

    // ---- attachments -------------------------------------------------------

    @Override
    public LabResultDTO attachFile(Long resultId, MultipartFile file) {
        LabResult result = requireResult(resultId);

        // The type is decided by reading the bytes, never by believing the
        // upload's Content-Type or its extension.
        UploadedFileGuard.AllowedType type = fileGuard.inspect(file);
        LabFileStore.StoredFile stored = fileStore.store(resultId, file, type);

        // Replacing a report leaves the old bytes on disk otherwise. Deleted
        // after the new file is safely written, so a failed upload cannot
        // destroy the report that was already there.
        String previous = result.getFilePath();

        result.setFilePath(stored.getKey());
        result.setFileName(stored.getOriginalFilename());
        result.setFileContentType(stored.getContentType());
        result.setFileSize(stored.getSize());
        result.setFileChecksum(stored.getChecksum());
        result.setFileUploadedAt(LocalDateTime.now());

        LabResult saved = labResultRepository.save(result);

        if (previous != null && !previous.equals(stored.getKey())) {
            fileStore.delete(previous);
        }

        log.info("Attached {} to lab result {}", stored.getOriginalFilename(), resultId);
        return toResultDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LabAttachment getAttachment(Long resultId) {
        LabResult result = requireResult(resultId);
        if (!result.hasFile()) {
            throw new ResourceNotFoundException(
                    "Lab result " + resultId + " has no report attached");
        }
        byte[] content = fileStore.read(result.getFilePath());
        return LabAttachment.builder()
                .content(content)
                .filename(result.getFileName())
                .contentType(result.getFileContentType())
                .size(content.length)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Long ownerPatientId(Long resultId) {
        LabResult result = requireResult(resultId);
        return labRequestRepository.findById(result.getLabRequestId())
                .map(LabRequest::getPatientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lab request not found with id: " + result.getLabRequestId()));
    }

    private LabResult requireResult(Long resultId) {
        return labResultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lab result not found with id: " + resultId));
    }

    @Override
    public List<LabRequestDTO> getAllRequests() {
        return labRequestRepository.findAll()
                .stream()
                .map(this::toRequestDTO)
                .collect(Collectors.toList());
    }
}
