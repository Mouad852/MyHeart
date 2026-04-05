/**
 * labApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to the lab-service.
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/labs'

const labApi = {
  /**
   * POST /labs/requests
   * Create a new lab test request.
   * @param {{ patientId: number, doctorId: number, testName: string, notes?: string }} data
   */
  createLabRequest: (data) =>
    axiosInstance.post(`${BASE}/requests`, data).then((r) => r.data),

  /**
   * GET /labs/requests/patient/{patientId}
   * Fetch all lab requests for a patient.
   */
  getByPatient: (patientId) =>
    axiosInstance.get(`${BASE}/requests/patient/${patientId}`).then((r) => r.data),

  /**
   * POST /labs/results
   * Submit a result for a lab request.
   * @param {{ requestId: number, result: string, notes?: string }} data
   */
  createLabResult: (data) =>
    axiosInstance.post(`${BASE}/results`, data).then((r) => r.data),

  /**
   * GET /labs/results/request/{requestId}
   * Fetch all results for a given lab request.
   */
  getResultsByRequest: (requestId) =>
    axiosInstance.get(`${BASE}/results/request/${requestId}`).then((r) => r.data),

  /**
   * GET /labs/requests
   * Fetch all lab requests (used by dashboard for total count).
   */
  getAllRequests: () =>
    axiosInstance.get(`${BASE}/requests`).then((r) => r.data),
}

export default labApi
