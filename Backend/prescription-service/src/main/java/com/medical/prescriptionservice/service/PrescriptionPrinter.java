package com.medical.prescriptionservice.service;

import com.medical.prescriptionservice.client.DoctorClient;
import com.medical.prescriptionservice.client.PatientClient;
import com.medical.prescriptionservice.dto.PartyInfo;
import com.medical.prescriptionservice.dto.PrescriptionDTO;
import com.medical.prescriptionservice.exception.ExternalServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Gathers what a printed prescription needs and hands it to the renderer.
 *
 * The two lookups are treated differently on purpose.
 *
 * The patient is required. A prescription that does not name the person it is
 * for is not a degraded document, it is a dangerous one, so a failure to resolve
 * the patient fails the whole request rather than printing a blank.
 *
 * The prescriber is not. If doctor-service is unreachable the document still
 * prints, showing the practitioner by the number that appears in the clinic's
 * own records. The pharmacist can still read what to dispense and to whom.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionPrinter {

    private final PrescriptionService prescriptionService;
    private final PrescriptionDocument document;
    private final PatientClient patientClient;
    private final DoctorClient doctorClient;

    public byte[] print(Long prescriptionId) {
        PrescriptionDTO prescription = prescriptionService.getPrescriptionById(prescriptionId);

        PartyInfo.Patient patient;
        try {
            patient = patientClient.getPatientById(prescription.getPatientId());
        } catch (Exception e) {
            log.warn("Could not resolve patient {} for prescription {}: {}",
                    prescription.getPatientId(), prescriptionId, e.getMessage());
            throw new ExternalServiceException(
                    "The patient record could not be reached, so this prescription "
                            + "cannot be printed. Please try again shortly.");
        }

        PartyInfo.Doctor doctor = null;
        try {
            doctor = doctorClient.getDoctorById(prescription.getDoctorId());
        } catch (Exception e) {
            log.warn("Could not resolve doctor {} for prescription {}, printing without a name: {}",
                    prescription.getDoctorId(), prescriptionId, e.getMessage());
        }

        return document.render(prescription, patient, doctor);
    }

    /** The filename a browser will save the download under. */
    public String filenameFor(Long prescriptionId) {
        return String.format("prescription-%05d.pdf", prescriptionId);
    }
}
