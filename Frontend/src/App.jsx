/**
 * App.jsx — Root component.
 * Defines the application routing tree using React Router v6.
 *
 * Route structure:
 *   /                  → Dashboard
 *   /patients          → PatientsPage
 *   /doctors           → DoctorsPage
 *   /appointments      → AppointmentsPage
 *   /billing           → BillingPage        ← NEW
 *   /prescriptions     → PrescriptionsPage  ← NEW
 *   /labs              → LabsPage           ← NEW
 *   *                  → NotFoundPage
 *
 * All routes render inside the shared <Layout> component,
 * which provides the Sidebar + Header + main content area.
 */
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import PatientsPage from './pages/Patients/PatientsPage'
import DoctorsPage from './pages/Doctors/DoctorsPage'
import AppointmentsPage from './pages/Appointments/AppointmentsPage'
import BillingPage from './pages/Billing/BillingPage'
import PrescriptionsPage from './pages/Prescriptions/PrescriptionsPage'
import LabsPage from './pages/Labs/LabsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* All authenticated pages share the Layout wrapper */}
      <Route path="/" element={<Layout />}>
        {/* ── Core routes ──────────────────────────── */}
        <Route index             element={<Dashboard />} />
        <Route path="patients"     element={<PatientsPage />} />
        <Route path="doctors"      element={<DoctorsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />

        {/* ── Extended service routes ──────────────── */}
        <Route path="billing"       element={<BillingPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="labs"          element={<LabsPage />} />

        {/* ── Fallback ─────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
