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
  getAll: () => axiosInstance.get(BASE).then((r) => r.data),

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
