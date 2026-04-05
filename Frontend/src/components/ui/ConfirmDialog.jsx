/**
 * ConfirmDialog.jsx — Reusable confirmation dialog for destructive actions.
 */
import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 pb-2">
        {/* Warning icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle size={26} className="text-red-400" />
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 flex-1 px-5 py-2.5 rounded-xl
                       bg-red-500 hover:bg-red-400 active:bg-red-600
                       text-white font-semibold text-sm transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
