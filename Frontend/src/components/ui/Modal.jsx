/**
 * Modal.jsx — Reusable overlay modal with focus trap + ESC to close.
 */
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size] || 'max-w-lg'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/80 modal-backdrop animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${sizeClass} card border-white/10 animate-slide-up`}
        style={{ animationDuration: '0.25s' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
