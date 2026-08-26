/**
 * ConfirmDialog.jsx — asking before something cannot be undone.
 *
 * No large warning glyph. What makes somebody stop and read is a sentence
 * naming the actual record and the actual consequence — "Yasmine Belkacem's
 * appointment on Thursday 27 August at 09:00 will be cancelled" — not a
 * triangle above the words "Are you sure?". The icon was doing the reassuring;
 * the sentence does the work.
 *
 * The safe choice is on the left and holds focus when the dialog opens, so
 * Escape, Enter and a stray click all resolve to the harmless outcome.
 */
import Modal from './Modal'
import { Spinner } from './LoadingSpinner'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Keep it',
  isLoading = false,
  busyLabel = 'Working…',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm leading-relaxed text-ink-2">{message}</p>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading && <Spinner size={12} />}
          {isLoading ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
