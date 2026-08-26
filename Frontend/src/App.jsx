/**
 * App.jsx — Root component.
 *
 * Route structure:
 *   /login             → Login (public)
 *   /                  → Dashboard          ┐
 *   /patients          → PatientsPage       │
 *   /doctors           → DoctorsPage        │ all behind ProtectedRoute,
 *   /appointments      → AppointmentsPage   │ each gated by the roles declared
 *   /billing           → BillingPage        │ in auth/roles.js
 *   /prescriptions     → PrescriptionsPage  │
 *   /labs              → LabsPage           │
 *   /my-health         → MyHealth (patient) ┘
 *   *                  → NotFoundPage
 *
 * Authenticated pages render inside <Layout>, which provides the Sidebar,
 * Header and main content area.
 */
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute, { RequireRole } from './auth/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientsPage from './pages/Patients/PatientsPage'
import DoctorsPage from './pages/Doctors/DoctorsPage'
import AppointmentsPage from './pages/Appointments/AppointmentsPage'
import BillingPage from './pages/Billing/BillingPage'
import PrescriptionsPage from './pages/Prescriptions/PrescriptionsPage'
import LabsPage from './pages/Labs/LabsPage'
import MyHealth from './pages/Portal/MyHealth'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* ── Public ───────────────────────────────── */}
      <Route path="/login" element={<Login />} />

      {/* ── Authenticated ────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          {/* RequireRole sits inside Layout so a denial keeps the sidebar,
              the header and a way to sign out. */}
          <Route element={<RequireRole />}>
            {/* ── Core routes ──────────────────────── */}
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />

            {/* ── Extended service routes ──────────── */}
            <Route path="billing" element={<BillingPage />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="labs" element={<LabsPage />} />

            {/* ── Patient portal ────────────────────── */}
            <Route path="my-health" element={<MyHealth />} />
          </Route>

          {/* ── Fallback ─────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
