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
    axiosInstance.post(`${BASE}/requests`, {
      patientId: data.patientId,
      doctorId: data.doctorId,
      testName: data.testName,
      testDescription: data.notes
    }).then((r) => r.data),

  /**
   * GET /labs/requests/patient/{patientId}
   * Fetch all lab requests for a patient.
   */
  getByPatient: (patientId) =>
    axiosInstance.get(`${BASE}/patient/${patientId}`).then((r) => r.data),

  /**
   * POST /labs/results
   * Submit a result for a lab request.
   * @param {{ requestId: number, result: string, notes?: string }} data
   */
  createLabResult: (data) =>
    axiosInstance.post(`${BASE}/result`, {
      labRequestId: data.requestId,
      resultText: data.result,
      observations: data.notes
    }).then((r) => r.data),

  /**
   * GET /labs/{requestId}/results
   * Every result filed against one request.
   */
  getResultsByRequest: (requestId) =>
    axiosInstance.get(`${BASE}/${requestId}/results`).then((r) => r.data),

  /**
   * POST /labs/results/{resultId}/file
   * Attach the scanned or exported report to a result.
   *
   * The Content-Type header is left unset on purpose: the browser has to write
   * it itself so it can append the multipart boundary. Setting it here would
   * produce a header with no boundary and a body the server cannot parse.
   */
  uploadResultFile: (resultId, file) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance
      .post(`${BASE}/results/${resultId}/file`, form, {
        headers: { 'Content-Type': undefined },
        // A scan over a slow connection needs longer than the default.
        timeout: 60_000,
      })
      .then((r) => r.data)
  },

  /**
   * GET /labs/results/{resultId}/file
   * The attached report, as a blob. Needs the bearer token, so it cannot be a
   * plain link.
   */
  downloadResultFile: (resultId) =>
    axiosInstance
      .get(`${BASE}/results/${resultId}/file`, {
        responseType: 'blob',
        headers: { Accept: '*/*' },
        timeout: 60_000,
      })
      .then((r) => r.data),

  /**
   * GET /labs/requests
   * Fetch all lab requests (used by dashboard for total count).
   */
  getAllRequests: () =>
    axiosInstance.get(`${BASE}/requests`).then((r) => r.data),
}

export default labApi
