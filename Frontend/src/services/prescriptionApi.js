/**
 * prescriptionApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to the prescription-service.
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/prescriptions'

const prescriptionApi = {
  /**
   * POST /prescriptions
   * Create a new prescription with one or more medicine entries.
   * @param {{
   *   patientId: number,
   *   doctorId: number,
   *   diagnosis: string,
   *   notes?: string,
   *   medicines: Array<{ name: string, dosage: string, frequency: string, duration: string, instructions?: string }>
   * }} data
   */
  createPrescription: (data) =>
    axiosInstance.post(BASE, {
      patientId: data.patientId,
      doctorId: data.doctorId,
      diagnosis: data.diagnosis,
      notes: data.notes,
      items: data.medicines.map(m => ({
        medicineName: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions
      })),
    }).then(r => r.data),

  /**
   * GET /prescriptions/{id}
   */
  getPrescriptionById: (id) =>
    axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * GET /prescriptions/patient/{patientId}
   */
  getByPatient: (patientId) =>
    axiosInstance.get(`${BASE}/patient/${patientId}`).then((r) => r.data),

  /**
   * GET /prescriptions/doctor/{doctorId}
   */
  getByDoctor: (doctorId) =>
    axiosInstance.get(`${BASE}/doctor/${doctorId}`).then((r) => r.data),

  /**
   * GET /prescriptions/{id}/document
   * The printable prescription, as a PDF blob.
   *
   * The endpoint needs the bearer token, so this cannot be a plain link: the
   * browser would follow it without an Authorization header and be refused.
   * It is fetched here and handed to the page as a blob instead.
   */
  getDocument: (id) =>
    axiosInstance
      .get(`${BASE}/${id}/document`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      })
      .then((r) => r.data),

  /**
   * GET /prescriptions
   * Fetch all prescriptions (used by dashboard for total count).
   */
  getAll: () =>
    axiosInstance.get(BASE).then((r) => r.data),
}

export default prescriptionApi
