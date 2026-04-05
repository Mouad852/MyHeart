/**
 * patientApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to Patient management.
 * Mirrors the patient-service REST API exposed via the API Gateway.
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/patients'

const patientApi = {
  /** GET /patients — fetch all patients */
  getAll: () => axiosInstance.get(BASE).then((r) => r.data),

  /** GET /patients/:id — fetch a single patient by ID */
  getById: (id) => axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * POST /patients — create a new patient
   * @param {{ name: string, email: string, phone: string }} data
   */
  create: (data) => axiosInstance.post(BASE, data).then((r) => r.data),

  /**
   * PUT /patients/:id — update an existing patient
   * @param {number} id
   * @param {{ name: string, email: string, phone: string }} data
   */
  update: (id, data) => axiosInstance.put(`${BASE}/${id}`, data).then((r) => r.data),

  /** DELETE /patients/:id — remove a patient */
  delete: (id) => axiosInstance.delete(`${BASE}/${id}`),
}

export default patientApi
