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
   * GET /billing/summary
   * Counts and totals, aggregated by the database. Cheap enough for the
   * overview screen to poll, unlike fetching every invoice to count it.
   */
  getSummary: () =>
    axiosInstance.get(`${BASE}/summary`).then((r) => r.data),

  /**
   * PUT /billing/pay/{id}
   * Mark an invoice as PAID.
   */
  payInvoice: (id) =>
    axiosInstance.put(`${BASE}/pay/${id}`).then((r) => r.data),

  /**
   * PUT /billing/void/{id}
   * Cancel an unpaid invoice, recording why. The reason is stored on the
   * invoice, so it is worth insisting the caller supplies one.
   */
  voidInvoice: (id, reason) =>
    axiosInstance
      .put(`${BASE}/void/${id}`, null, { params: reason ? { reason } : {} })
      .then((r) => r.data),

  /**
   * PUT /billing/refund/{id}
   * Return money on an invoice that has been paid.
   */
  refundInvoice: (id, reason) =>
    axiosInstance
      .put(`${BASE}/refund/${id}`, null, { params: reason ? { reason } : {} })
      .then((r) => r.data),
}

export default billingApi
