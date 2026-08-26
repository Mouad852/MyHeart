/**
 * doctorApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to Doctor management.
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/doctors'

const doctorApi = {
  /** GET /doctors */
  getPage: ({ page = 0, size = 20, q = '' } = {}) =>
    axiosInstance
      .get(BASE, { params: { page, size, ...(q ? { q } : {}) } })
      .then((r) => r.data),

  /** Every doctor, for dropdowns that need the whole list. */
  getOptions: () =>
    axiosInstance
      .get(BASE, { params: { page: 0, size: 200, sort: 'name' } })
      .then((r) => r.data.content),

  /** GET /doctors/batch?ids=1,2,3 — several doctors in one call */
  getByIds: (ids) =>
    axiosInstance
      .get(`${BASE}/batch`, { params: { ids: ids.join(',') } })
      .then((r) => r.data),

  /** GET /doctors/:id */
  getById: (id) => axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * POST /doctors
   * @param {{ name: string, specialty: string, email: string }} data
   */
  create: (data) => axiosInstance.post(BASE, data).then((r) => r.data),

  /**
   * PUT /doctors/:id
   * @param {number} id
   * @param {{ name: string, specialty: string, email: string }} data
   */
  update: (id, data) => axiosInstance.put(`${BASE}/${id}`, data).then((r) => r.data),

  /** DELETE /doctors/:id */
  delete: (id) => axiosInstance.delete(`${BASE}/${id}`),
}

export default doctorApi
