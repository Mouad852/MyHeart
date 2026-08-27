/**
 * LabsPage.test.jsx — what each role is offered on the laboratory screen.
 *
 * This page has already shipped three faults that no amount of reading caught,
 * and all three are pinned here:
 *
 *   1. It crashed to a blank page for a laboratory technician, because a hook
 *      call was placed above the flag it depended on. Lint passed. The
 *      production build passed. Only signing in as the real account found it.
 *   2. It offered a technician "Record the result", which the gateway serves
 *      to DOCTOR and ADMIN alone — a button that could only ever return 403.
 *   3. It asked for the patient register on their behalf, which is also a 403,
 *      and produced a red banner about a permission they were never meant to
 *      have.
 *
 * The rule this file enforces: the screen never offers a control the gateway
 * would refuse, and never asks for data the caller may not read.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROLES } from '../../auth/roles'

// ── the world outside this page ──────────────────────────────────────────

let currentRoles = []

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    roles: currentRoles,
    hasRole: (role) => currentRoles.includes(role),
    hasAnyRole: (roles) => roles.some((role) => currentRoles.includes(role)),
  }),
}))

const REQUESTS = [
  {
    id: 1,
    patientId: 1,
    testName: 'Full blood count',
    status: 'PENDING',
    requestedAt: '2026-08-20T09:00:00',
  },
  {
    id: 2,
    patientId: 4,
    testName: 'Fasting glucose',
    status: 'COMPLETED',
    requestedAt: '2026-08-18T11:30:00',
  },
]

const idle = { data: undefined, isPending: false, isLoading: false, isError: false, mutate: vi.fn() }
const query = (data) => ({ data, isLoading: false, isPending: false, isError: false, error: null })

/** Records whether the page asked for the patient register at all. */
const patientOptionsSpy = vi.fn()

vi.mock('../../hooks/useLabs', () => ({
  useAllLabRequests: () => query(REQUESTS),
  useLabResults: () => query([]),
  useCreateLabRequest: () => idle,
  useCreateLabResult: () => idle,
  useUploadLabResultFile: () => idle,
  useDownloadLabResultFile: () => idle,
}))

vi.mock('../../hooks/usePatients', () => ({
  // A disabled query returns no data, exactly as the real one does. Handing
  // the page a register it never asked for would test nothing.
  usePatientOptions: (options = {}) => {
    patientOptionsSpy(options)
    return options.enabled === false
      ? query(undefined)
      : query([{ id: 1, name: 'Chaouni Mouad' }, { id: 4, name: 'Nadia Bensalem' }])
  },
}))

const { default: LabsPage } = await import('./LabsPage')

function renderAs(...roles) {
  currentRoles = roles
  return render(
    <MemoryRouter>
      <LabsPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  patientOptionsSpy.mockClear()
})

describe('a laboratory technician', () => {
  it('renders at all', () => {
    // The whole of fault 1. A page that throws during render leaves nothing
    // to make any other assertion about.
    expect(() => renderAs(ROLES.LAB_TECHNICIAN)).not.toThrow()
    expect(screen.getByText('Full blood count')).toBeInTheDocument()
  })

  it('is not offered a control the gateway would refuse', () => {
    renderAs(ROLES.LAB_TECHNICIAN)
    expect(screen.queryByRole('button', { name: /order a test/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /record the result/i })).not.toBeInTheDocument()
  })

  it('does not ask for the patient register on their behalf', () => {
    renderAs(ROLES.LAB_TECHNICIAN)
    expect(patientOptionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
  })

  it('shows the patient number instead of a name it may not read', () => {
    renderAs(ROLES.LAB_TECHNICIAN)
    expect(screen.getByText(/Patient 1/)).toBeInTheDocument()
    expect(screen.queryByText(/Chaouni Mouad/)).not.toBeInTheDocument()
  })

  it('is given no link into the patient record', () => {
    renderAs(ROLES.LAB_TECHNICIAN)
    expect(screen.queryByRole('link', { name: /open patient/i })).not.toBeInTheDocument()
  })
})

describe('a doctor', () => {
  it('may order a test and record a finding', () => {
    renderAs(ROLES.DOCTOR)
    expect(screen.getByRole('button', { name: /order a test/i })).toBeInTheDocument()
  })

  it('asks for the patient register and shows names', () => {
    renderAs(ROLES.DOCTOR)
    expect(patientOptionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    )
    expect(screen.getAllByText(/Chaouni Mouad/).length).toBeGreaterThan(0)
  })

  it('can open the patient record', () => {
    renderAs(ROLES.DOCTOR)
    expect(screen.getAllByRole('link', { name: /open patient/i }).length).toBeGreaterThan(0)
  })
})

describe('an administrator', () => {
  it('is offered everything a doctor is', () => {
    renderAs(ROLES.ADMIN)
    expect(screen.getByRole('button', { name: /order a test/i })).toBeInTheDocument()
    expect(patientOptionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    )
  })
})

describe('a receptionist', () => {
  it('reads the queue and the names but orders nothing', () => {
    renderAs(ROLES.RECEPTIONIST)
    expect(screen.getByText('Full blood count')).toBeInTheDocument()
    expect(screen.getAllByText(/Chaouni Mouad/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /order a test/i })).not.toBeInTheDocument()
  })
})

describe('inside an expanded request', () => {
  /** Open the first request, which is where the per-result controls live. */
  async function expandFirstRequest() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /full blood count/i }))
    return user
  }

  it('offers a doctor the finding itself', async () => {
    renderAs(ROLES.DOCTOR)
    await expandFirstRequest()
    expect(
      await screen.findByRole('button', { name: /record the result/i })
    ).toBeInTheDocument()
  })

  it('refuses a technician the finding, one level down as well', async () => {
    // The gateway serves POST /labs/results/*/file to DOCTOR, ADMIN and
    // LAB_TECHNICIAN, but every other POST under /labs to DOCTOR and ADMIN
    // alone. Collapsing those into one flag is what produced fault 2, and the
    // control it produced was inside a collapsed row where nobody looked.
    renderAs(ROLES.LAB_TECHNICIAN)
    await expandFirstRequest()
    expect(screen.queryByRole('button', { name: /record the result/i })).not.toBeInTheDocument()
  })
})
