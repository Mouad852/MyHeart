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
  /**
   * GET /patients — one page of patients.
   * @param {{ page?: number, size?: number, q?: string }} params
   * @returns {Promise<{content: Array, page: number, size: number,
   *   totalElements: number, totalPages: number, first: boolean, last: boolean}>}
   */
  getPage: ({ page = 0, size = 20, q = '' } = {}) =>
    axiosInstance
      .get(BASE, { params: { page, size, ...(q ? { q } : {}) } })
      .then((r) => r.data),

  /**
   * Every patient, for dropdowns that need the whole list.
   * Capped rather than unbounded: a select box with thousands of options is
   * the wrong control, and that is a search field's job instead.
   */
  getOptions: () =>
    axiosInstance
      .get(BASE, { params: { page: 0, size: 200, sort: 'name' } })
      .then((r) => r.data.content),

  /** GET /patients/batch?ids=1,2,3 — several patients in one call */
  getByIds: (ids) =>
    axiosInstance
      .get(`${BASE}/batch`, { params: { ids: ids.join(',') } })
      .then((r) => r.data),

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
