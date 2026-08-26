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

  /**
   * GET /appointments/search — a filtered page.
   * @param {{doctorId?: number, patientId?: number, status?: string,
   *          from?: string, to?: string, page?: number, size?: number}} params
   */
  search: (params = {}) =>
    axiosInstance.get(`${BASE}/search`, { params }).then((r) => r.data),

  /**
   * GET /appointments/my-day — the signed-in doctor's own calendar.
   * The doctor comes from the token, not from a parameter.
   * @param {string} [day] ISO date, defaulting to today on the server
   */
  myDay: (day) =>
    axiosInstance
      .get(`${BASE}/my-day`, { params: day ? { day } : {} })
      .then((r) => r.data),

  /** GET /appointments/:id */
  getById: (id) => axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * POST /appointments
   * @param {{ patientId: number, doctorId: number, appointmentDate: string, notes?: string }} data
   */
  create: (data) => axiosInstance.post(BASE, data).then((r) => r.data),

  /** PATCH /appointments/:id/cancel — cancel an appointment */
  cancel: (id, reason) =>
    axiosInstance
      .patch(`${BASE}/${id}/cancel`, null, { params: reason ? { reason } : {} })
      .then((r) => r.data),

  /** PATCH /appointments/:id/confirm — the desk agrees a requested slot */
  confirm: (id) => axiosInstance.patch(`${BASE}/${id}/confirm`).then((r) => r.data),

  /** PATCH /appointments/:id/complete — the consultation happened */
  complete: (id) => axiosInstance.patch(`${BASE}/${id}/complete`).then((r) => r.data),

  /** PATCH /appointments/:id/no-show — the patient did not attend */
  markNoShow: (id, reason) =>
    axiosInstance
      .patch(`${BASE}/${id}/no-show`, null, { params: reason ? { reason } : {} })
      .then((r) => r.data),

  /** PATCH /appointments/:id - Update an appointment */
  update: (id, data) => axiosInstance.patch(`${BASE}/${id}`, data).then((r) => r.data),
}

export default appointmentApi
