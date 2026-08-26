/**
 * Segmented.jsx — filter by state.
 *
 * A row of low-contrast labels on one rule, with the selected one carrying a
 * teal underline. Not pill-shaped chips: a lifecycle filter is a set of tabs
 * over the same list, and tabs are how people already read that.
 *
 * The counts matter more than they look. "Requested 3" tells a receptionist
 * where the work is before she has clicked anything, which is the whole reason
 * the control is at the top of the page.
 */

/**
 * @param {{
 *   options: Array<{ value: string, label: string, count?: number }>,
 *   value: string,
 *   onChange: (value: string) => void,
 *   label: string
 * }} props
 */
export default function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`-mb-px flex flex-wrap items-center gap-x-1 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`relative -mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm
                        transition-colors duration-fast
                        ${
                          selected
                            ? 'border-primary font-medium text-ink'
                            : 'border-transparent text-ink-2 hover:border-rule-strong hover:text-ink'
                        }`}
          >
            {option.label}
            {option.count != null && (
              <span
                className={`ml-2 text-meta tabular-nums ${
                  selected ? 'text-primary' : 'text-ink-3'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
