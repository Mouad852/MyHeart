/**
 * ErrorBanner.jsx — something did not load.
 *
 * The distinction that matters here is between *this screen is broken* and
 * *one service behind this screen is unavailable*. MedCore's patient record
 * merges five independent services, any one of which can be down while the
 * rest are fine. Rendering the same alarming red block in both cases teaches a
 * clinician to distrust a record that is, in fact, almost entirely correct.
 *
 *   `error`    the request failed and the reader has lost something. Rose.
 *   `degraded` one source is missing and the rest of the screen is sound.
 *              Stated plainly, in neutral, inline, and small.
 */
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Spinner } from './LoadingSpinner'

export default function ErrorBanner({
  message,
  title,
  onRetry,
  isRetrying = false,
  variant = 'error',
  className = '',
}) {
  const degraded = variant === 'degraded'

  const skin = degraded
    ? 'border-rule bg-raised text-ink-2'
    : 'border-critical/40 bg-critical-soft text-critical'

  return (
    <div
      role={degraded ? 'status' : 'alert'}
      className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded border px-4 py-3 ${skin} ${className}`}
    >
      <TriangleAlert
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className={`mt-0.5 flex-shrink-0 ${degraded ? 'text-ink-3' : 'text-critical'}`}
      />

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${degraded ? 'text-ink-2' : 'font-medium text-critical'}`}>
          {title || (degraded ? 'Temporarily unavailable' : 'That did not load')}
        </p>
        {message && (
          <p
            className={`mt-0.5 break-words text-meta ${
              degraded ? 'text-ink-3' : 'text-critical'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className={`btn btn-sm flex-shrink-0 ${
            degraded
              ? 'border-rule text-ink-2 hover:border-rule-strong hover:text-ink'
              : 'border-critical/40 text-critical hover:border-critical hover:bg-critical-soft'
          }`}
        >
          {isRetrying ? (
            <Spinner size={12} />
          ) : (
            <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
          )}
          Try again
        </button>
      )}
    </div>
  )
}
