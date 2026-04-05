/**
 * billingApi.js
 * ─────────────────────────────────────────────────────────────────
 * All HTTP calls related to the billing-service.
 * Exposed via the API Gateway at /billing/...
 * ─────────────────────────────────────────────────────────────────
 */
import axiosInstance from './axiosInstance'

const BASE = '/billing'

const billingApi = {
  /**
   * POST /billing/create
   * Create a new invoice.
   * @param {{ patientId: number, appointmentId?: number, amount: number, description?: string }} data
   */
  createInvoice: (data) =>
    axiosInstance.post(`${BASE}/create`, data).then((r) => r.data),

  /**
   * GET /billing/{id}
   * Fetch a single invoice by its ID.
   */
  getInvoiceById: (id) =>
    axiosInstance.get(`${BASE}/${id}`).then((r) => r.data),

  /**
   * GET /billing/patient/{patientId}
   * Fetch all invoices for a specific patient.
   */
  getInvoicesByPatient: (patientId) =>
    axiosInstance.get(`${BASE}/patient/${patientId}`).then((r) => r.data),

  /**
   * GET /billing
   * Fetch all invoices (used by the dashboard for total count).
   */
  getAllInvoices: () =>
    axiosInstance.get(BASE).then((r) => r.data),

  /**
   * PUT /billing/pay/{id}
   * Mark an invoice as PAID.
   */
  payInvoice: (id) =>
    axiosInstance.put(`${BASE}/pay/${id}`).then((r) => r.data),
}

export default billingApi
