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
   *   diagnosis?: string,
   *   medicines: Array<{ name: string, dosage: string, frequency: string, duration: string }>
   * }} data
   */
  createPrescription: (data) =>
    axiosInstance.post(BASE, data).then((r) => r.data),

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
   * GET /prescriptions
   * Fetch all prescriptions (used by dashboard for total count).
   */
  getAll: () =>
    axiosInstance.get(BASE).then((r) => r.data),
}

export default prescriptionApi
