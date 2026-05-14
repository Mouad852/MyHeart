/**
 * appointmentApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to Appointment management.
 * The appointment-service response includes enriched patient/doctor info.
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/appointments'

const appointmentApi = {
  /** GET /appointments — returns appointments with embedded patient + doctor */
  getAll: () => axiosInstance.get(BASE).then((r) => r.data),

  /** GET /appointments/:id */
  getById: (id) => axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * POST /appointments
   * @param {{ patientId: number, doctorId: number, appointmentDate: string, notes?: string }} data
   */
  create: (data) => axiosInstance.post(BASE, data).then((r) => r.data),

  /** PATCH /appointments/:id/cancel — cancel an appointment */
  cancel: (id) => axiosInstance.patch(`${BASE}/${id}/cancel`).then((r) => r.data),

  /** PATCH /appointments/:id - Update an appointment */
  update: (id, data) => axiosInstance.patch(`${BASE}/${id}`, data).then((r) => r.data),
}

export default appointmentApi
