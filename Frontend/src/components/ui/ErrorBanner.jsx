/**
 * ErrorBanner.jsx — Displayed when an API query fails.
 */
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl
                    bg-red-500/10 border border-red-500/20 animate-fade-in">
      <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-300 mb-0.5">Something went wrong</p>
        <p className="text-xs text-red-400/80 break-words">
          {message || 'Failed to load data. Check your connection and try again.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-red-500/15 hover:bg-red-500/25 border border-red-500/25
                     text-red-400 text-xs font-medium transition-all duration-150 flex-shrink-0"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}
