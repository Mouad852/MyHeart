/**
 * usePatientTimeline.js
 *
 * One patient's history, assembled from the four services that each own a part
 * of it: appointments, invoices, prescriptions and laboratory work.
 *
 * The merge happens in the browser on purpose. A timeline endpoint would have
 * to call all four services anyway, and putting that in one of them would make
 * it depend on the other three for a screen only the frontend uses.
 */
import { useQueries } from '@tanstack/react-query'
import appointmentApi from '../services/appointmentApi'
import billingApi from '../services/billingApi'
import prescriptionApi from '../services/prescriptionApi'
import labApi from '../services/labApi'

/** Every kind of thing that can appear on the timeline. */
export const EVENT_KIND = {
  APPOINTMENT: 'appointment',
  INVOICE: 'invoice',
  PRESCRIPTION: 'prescription',
  LAB: 'lab',
}

function toTime(value) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function usePatientTimeline(patientId) {
  const results = useQueries({
    queries: [
      {
        queryKey: ['timeline', patientId, 'appointments'],
        queryFn: () => appointmentApi.search({ patientId, size: 100 }),
        enabled: Boolean(patientId),
      },
      {
        queryKey: ['timeline', patientId, 'invoices'],
        queryFn: () => billingApi.getInvoicesByPatient(patientId),
        enabled: Boolean(patientId),
      },
      {
        queryKey: ['timeline', patientId, 'prescriptions'],
        queryFn: () => prescriptionApi.getByPatient(patientId),
        enabled: Boolean(patientId),
      },
      {
        queryKey: ['timeline', patientId, 'labs'],
        queryFn: () => labApi.getByPatient(patientId),
        enabled: Boolean(patientId),
      },
    ],
  })

  const [appointments, invoices, prescriptions, labs] = results

  const events = []

  for (const appointment of appointments.data?.content ?? []) {
    events.push({
      id: `appointment-${appointment.id}`,
      kind: EVENT_KIND.APPOINTMENT,
      at: appointment.appointmentDate,
      status: appointment.status,
      title: appointment.doctor?.name
        ? `Appointment with ${appointment.doctor.name}`
        : 'Appointment',
      detail: appointment.notes,
      meta: appointment.doctor?.specialty,
      raw: appointment,
    })
  }

  for (const invoice of invoices.data ?? []) {
    events.push({
      id: `invoice-${invoice.id}`,
      kind: EVENT_KIND.INVOICE,
      at: invoice.createdAt,
      status: invoice.status,
      title: invoice.description || 'Invoice',
      // Overdue is worth saying out loud; the badge alone is easy to miss.
      detail: invoice.overdue ? `Payment overdue since ${invoice.dueDate}` : null,
      amount: invoice.amount,
      currency: invoice.currency,
      raw: invoice,
    })
  }

  for (const prescription of prescriptions.data ?? []) {
    const itemCount = prescription.items?.length ?? 0
    events.push({
      id: `prescription-${prescription.id}`,
      kind: EVENT_KIND.PRESCRIPTION,
      at: prescription.createdAt,
      title: prescription.diagnosis
        ? `Prescription for ${prescription.diagnosis}`
        : 'Prescription issued',
      detail: prescription.notes,
      meta: itemCount ? `${itemCount} medication${itemCount === 1 ? '' : 's'}` : null,
      raw: prescription,
    })
  }

  for (const lab of labs.data ?? []) {
    events.push({
      id: `lab-${lab.id}`,
      kind: EVENT_KIND.LAB,
      at: lab.requestedAt,
      status: lab.status,
      title: lab.testName || 'Laboratory test',
      detail: lab.testDescription,
      raw: lab,
    })
  }

  events.sort((a, b) => toTime(b.at) - toTime(a.at))

  return {
    events,
    isLoading: results.some((r) => r.isLoading),
    // A timeline is still worth showing when one service is down, so a partial
    // failure is reported rather than allowed to blank the whole screen.
    failedSources: [
      appointments.isError && 'appointments',
      invoices.isError && 'invoices',
      prescriptions.isError && 'prescriptions',
      labs.isError && 'laboratory results',
    ].filter(Boolean),
    counts: {
      appointments: appointments.data?.totalElements ?? 0,
      invoices: (invoices.data ?? []).length,
      prescriptions: (prescriptions.data ?? []).length,
      labs: (labs.data ?? []).length,
    },
  }
}
