/**
 * Modal.jsx — a dialog.
 *
 * Focus is moved into the panel when it opens, held there while it is open, and
 * returned to whatever opened it on close. That is not decoration: without it a
 * keyboard user tabs straight out of an open dialog into the page behind, which
 * they cannot see and cannot act on.
 */
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  labelledBy = 'modal-title',
}) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  /**
   * Callers pass `onClose` as an inline arrow, so it is a new function on every
   * render of the page behind the dialog. Depending on it directly tore the
   * effect down and set it up again on each of those renders, and each teardown
   * ran the focus-restore — so by the time the dialog actually closed, focus had
   * already been handed back and then lost, and it ended up on the document
   * body. Holding it in a ref keeps the effect keyed on `isOpen` alone, which is
   * the only thing that should open or close anything.
   */
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const trapFocus = useCallback((event) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
      (node) => node.offsetParent !== null
    )
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    restoreRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // The first field, not the close button: a dialog that opens ready to be
    // typed into saves a keystroke every single time it is used.
    const timer = window.setTimeout(() => {
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      const target =
        Array.from(nodes ?? []).find((node) => !node.hasAttribute('data-dialog-close')) ??
        nodes?.[0]
      target?.focus()
    }, 20)

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
      else trapFocus(event)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreRef.current?.focus?.()
    }
  }, [isOpen, trapFocus])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ground/80"
        onClick={onClose}
        aria-hidden="true"
      />


      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        className={`panel relative max-h-[92dvh] w-full animate-rise-in overflow-y-auto
                    shadow-overlay ${SIZES[size] || SIZES.md}`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <h2 id={labelledBy} className="text-base font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p className="mt-1 max-w-[54ch] text-meta text-ink-3">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              data-dialog-close
              className="btn-icon -mr-1 flex-shrink-0"
              aria-label="Close"
            >
              <X size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
