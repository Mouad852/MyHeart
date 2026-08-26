/**
 * Layout.jsx — the shell.
 *
 * The sidebar is fixed from 1024px up and an off-canvas drawer below it. The
 * previous version had no responsive treatment at all: a 240px panel held its
 * width at every viewport, so on a phone it took two thirds of the screen and
 * left the actual work squeezed into a hundred pixels, clipped on both sides.
 * A clinic tool that is unusable on the device somebody is holding while
 * standing next to a patient is not finished.
 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()

  // Choosing a destination closes the drawer; so does Escape. Both matter,
  // because the drawer covers the content it navigated to.
  useEffect(() => setNavOpen(false), [pathname])

  useEffect(() => {
    if (!navOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [navOpen])

  return (
    <div className="flex min-h-[100dvh] bg-ground">
      {/* Desktop: a column of its own, sticky so the navigation stays put
          while a long register scrolls past it. */}
      <div className="sticky top-0 hidden h-[100dvh] flex-shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Mobile: the same panel, over the content. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 animate-fade-in bg-ground/75 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 animate-drawer-in shadow-overlay">
            <Sidebar isDrawer onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenNav={() => setNavOpen(true)} />

        {/* The measure is capped. Left to fill a 27-inch display, a table of
            patients stretches its columns so far apart that reading across one
            row becomes a deliberate act. */}
        {/*
          `relative overflow-x-clip` keeps the page from scrolling sideways.

          Wide content — the invoice ledger on a phone is the real case — lives
          in its own `overflow-x-auto` container and scrolls there. What still
          escaped was a visually-hidden `sr-only` column heading: it is
          absolutely positioned, nothing between it and the document was
          positioned, so its containing block was the viewport and it sat at
          x=643 outside every scroller on the way up. That dragged the whole
          interface, header included, 269px left on a 375px screen.

          `relative` makes this the containing block, so such elements resolve
          here and are clipped here. `clip` rather than `hidden` so this does
          not become a scroll container and break the sticky header above it.
        */}
        <main className="relative flex-1 overflow-x-clip px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-[76rem]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
