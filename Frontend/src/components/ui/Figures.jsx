/**
 * Figures.jsx — a line of counts.
 *
 * Deliberately not four cards in a row. The figures sit on one rule, separated
 * by vertical hairlines, so the eye reads them as one sentence about the day
 * rather than as four competing objects. There is no icon beside any of them:
 * a calendar glyph next to the word "Booked" tells a receptionist nothing she
 * did not get from the word.
 *
 * A figure only takes colour when its value is a problem. "Did not attend: 0"
 * is good news and is written in the same grey as everything else; it turns
 * orange the moment it is not zero. A figure that is always coloured has
 * stopped being a signal.
 */
import { Skeleton } from './LoadingSpinner'

/**
 * A figure only takes colour when its value is a problem. "Did not attend: 0"
 * is good news and is written in plain ink; it turns amber the moment it is not
 * zero. A figure that is always coloured has stopped being a signal.
 *
 * The tones are the same four the rest of the product uses, so a number and a
 * badge that mean the same thing look like they do.
 */
const TONES = {
  neutral: 'text-ink',
  attention: 'text-attention',
  critical: 'text-critical',
  settled: 'text-settled',
}

/**
 * @param {{
 *   figures: Array<{ label: string, value: any, tone?: keyof TONES, hint?: string }>,
 *   isLoading?: boolean,
 *   size?: 'md' | 'lg'
 * }} props
 */
export default function Figures({ figures, isLoading = false, size = 'md', className = '' }) {
  const valueClass = size === 'lg' ? 'text-figure' : 'text-2xl'

  return (
    <dl
      className={`grid grid-cols-2 border-y border-rule sm:grid-cols-4 ${className}`}
    >
      {figures.map((figure, index) => {
        // Grey unless the number is actually asking for something.
        const active = figure.tone && Number(figure.value) > 0

        // Two columns on a phone, four from `sm`. The rule between cells is
        // drawn by the cell on its right, and the cell that starts a row does
        // not draw one — which is a different cell at each breakpoint.
        const rules = [
          index % 2 !== 0 ? 'border-l border-rule' : '',
          index !== 0 ? 'sm:border-l sm:border-rule' : '',
          index < 2 ? 'border-b border-rule sm:border-b-0' : '',
        ].join(' ')

        return (
          <div
            key={figure.label}
            className={`px-4 py-3.5 first:pl-0 sm:px-5 sm:first:pl-0 ${rules}`}
          >
            <dt className="text-meta text-ink-3">{figure.label}</dt>
            <dd
              className={`mt-1.5 font-bold tabular-nums ${valueClass}
                          ${active ? TONES[figure.tone] : TONES.neutral}`}
            >
              {isLoading ? (
                <Skeleton className="h-6 w-9" />
              ) : (
                (figure.value ?? '—')
              )}
            </dd>
            {figure.hint && (
              <p className="mt-1 text-meta text-ink-3">{figure.hint}</p>
            )}
          </div>
        )
      })}
    </dl>
  )
}
