/**
 * useClinicOverview.js
 *
 * Everything the operations overview needs, and nothing it does not.
 *
 * Two rules shape this hook:
 *
 * 1. Nothing is counted in the browser that the database can count. The
 *    previous dashboard downloaded every appointment, invoice, prescription
 *    and lab request in order to call .length on them. Here the wide numbers
 *    come from page envelopes and the billing summary, so the payload does not
 *    grow with the clinic.
 *
 * 2. A query is only enabled for roles the gateway will actually allow. A nurse
 *    has no route to /billing, so asking for it would produce a guaranteed 403
 *    and a red banner about a permission the nurse was never meant to have.
 */
import { useQueries } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { ROLES } from '../auth/roles'
import appointmentApi from '../services/appointmentApi'
import billingApi from '../services/billingApi'
import patientApi from '../services/patientApi'
import doctorApi from '../services/doctorApi'

/** Midnight local time, as the ISO datetime the backend filter expects. */
function midnight(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00`
}

/** Statuses that still hold a slot in the day. */
const ACTIVE = ['REQUESTED', 'CONFIRMED']

export function useClinicOverview() {
  const { hasAnyRole } = useAuth()

  // Mirrors the gateway's SecurityConfig. Kept as three flags rather than one
  // "isAdmin" so a receptionist and a billing clerk each see exactly the part
  // of the screen they are allowed to load.
  const canReadAppointments = hasAnyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST])
  const canReadBilling = hasAnyRole([ROLES.ADMIN, ROLES.BILLING, ROLES.RECEPTIONIST])
  const canReadPatients = hasAnyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE])
  const canReadDoctors = hasAnyRole([ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST])

  const now = new Date()
  const dayStart = midnight(now)
  const dayEnd = midnight(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))

  const [today, awaiting, billing, patients, doctors] = useQueries({
    queries: [
      {
        // One bounded call for the whole day. A clinic day is tens of rows, so
        // fetching it once and grouping here costs less than four count
        // queries and gives the "next patient" line for free.
        queryKey: ['overview', 'today', dayStart],
        queryFn: () => appointmentApi.search({ from: dayStart, to: dayEnd, size: 200 }),
        enabled: canReadAppointments,
        staleTime: 30 * 1000,
      },
      {
        // Requests span every date, so this one is a real count query. Five
        // rows come back with it because the point of the number is to act on
        // it, and a number alone cannot be acted on.
        queryKey: ['overview', 'awaiting'],
        queryFn: () =>
          appointmentApi.search({ status: 'REQUESTED', size: 5, sort: 'appointmentDate,asc' }),
        enabled: canReadAppointments,
        staleTime: 30 * 1000,
      },
      {
        queryKey: ['invoices', 'summary'],
        queryFn: billingApi.getSummary,
        enabled: canReadBilling,
        staleTime: 30 * 1000,
      },
      {
        queryKey: ['overview', 'patient-count'],
        queryFn: () => patientApi.getPage({ size: 1 }),
        enabled: canReadPatients,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['overview', 'doctor-count'],
        queryFn: () => doctorApi.getPage({ size: 1 }),
        enabled: canReadDoctors,
        staleTime: 5 * 60 * 1000,
      },
    ],
  })

  const dayRows = today.data?.content ?? []
  const byStatus = (status) => dayRows.filter((row) => row.status === status).length

  // The next patient through the door: earliest slot still active and still
  // ahead of the clock.
  const upcoming = dayRows
    .filter((row) => ACTIVE.includes(row.status) && new Date(row.appointmentDate) >= now)
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))

  return {
    permissions: { canReadAppointments, canReadBilling, canReadPatients, canReadDoctors },

    day: {
      isLoading: today.isLoading,
      isError: today.isError,
      booked: dayRows.length,
      seen: byStatus('COMPLETED'),
      remaining: dayRows.filter((row) => ACTIVE.includes(row.status)).length,
      noShow: byStatus('NO_SHOW'),
      cancelled: byStatus('CANCELLED'),
      next: upcoming[0] ?? null,
      rows: dayRows,
    },

    awaiting: {
      isLoading: awaiting.isLoading,
      isError: awaiting.isError,
      count: awaiting.data?.totalElements ?? 0,
      rows: awaiting.data?.content ?? [],
    },

    billing: {
      isLoading: billing.isLoading,
      isError: billing.isError,
      data: billing.data ?? null,
    },

    register: {
      isLoading: patients.isLoading || doctors.isLoading,
      patients: patients.data?.totalElements ?? null,
      doctors: doctors.data?.totalElements ?? null,
    },
  }
}
