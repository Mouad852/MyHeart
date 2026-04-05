/**
 * Layout.jsx — Root layout: Sidebar + Header + main content area.
 * All pages are rendered inside <Outlet />.
 */
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
