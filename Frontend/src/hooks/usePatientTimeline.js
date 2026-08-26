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

  /**
   * Each source reported separately.
   *
   * The four services fail independently, and the screen is built to survive
   * that: a patient's appointments are still worth reading when billing is
   * down. Reporting per source is what lets the page say *which* part is
   * missing instead of showing one alarming banner over a record that is
   * otherwise complete — and it is why a failed source's count shows as
   * unknown rather than as zero, which would be a lie about the patient.
   */
  const sources = [
    {
      key: EVENT_KIND.APPOINTMENT,
      label: 'Appointments',
      noun: 'appointments',
      isError: appointments.isError,
      isLoading: appointments.isLoading,
      refetch: appointments.refetch,
      count: appointments.isError ? null : (appointments.data?.totalElements ?? 0),
    },
    {
      key: EVENT_KIND.PRESCRIPTION,
      label: 'Prescriptions',
      noun: 'prescriptions',
      isError: prescriptions.isError,
      isLoading: prescriptions.isLoading,
      refetch: prescriptions.refetch,
      count: prescriptions.isError ? null : (prescriptions.data ?? []).length,
    },
    {
      key: EVENT_KIND.LAB,
      label: 'Laboratory',
      noun: 'laboratory work',
      isError: labs.isError,
      isLoading: labs.isLoading,
      refetch: labs.refetch,
      count: labs.isError ? null : (labs.data ?? []).length,
    },
    {
      key: EVENT_KIND.INVOICE,
      label: 'Billing',
      noun: 'invoices',
      isError: invoices.isError,
      isLoading: invoices.isLoading,
      refetch: invoices.refetch,
      count: invoices.isError ? null : (invoices.data ?? []).length,
    },
  ]

  return {
    events,
    sources,
    isLoading: results.some((r) => r.isLoading),
    failedSources: sources.filter((source) => source.isError),
    counts: {
      appointments: appointments.data?.totalElements ?? 0,
      invoices: (invoices.data ?? []).length,
      prescriptions: (prescriptions.data ?? []).length,
      labs: (labs.data ?? []).length,
    },
  }
}
