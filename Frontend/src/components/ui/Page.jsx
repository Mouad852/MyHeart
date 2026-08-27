/**
 * Page.jsx — the title zone every screen opens with.
 *
 * One shape, used everywhere, so that moving between screens does not feel like
 * moving between websites: an eyebrow naming where you are, the title, a line
 * saying what the screen is for, and the screen's single primary action on the
 * right.
 *
 * The title lives here and nowhere else. The application header used to carry a
 * copy of it, so "Patients" appeared twice, twenty pixels apart, in two
 * different sizes — the clearest sign in the old interface that the shell and
 * the pages had been designed separately.
 */

/**
 * @param {{
 *   eyebrow?: React.ReactNode,
 *   title: React.ReactNode,
 *   description?: React.ReactNode,
 *   lede?: boolean,
 *   actions?: React.ReactNode,
 *   meta?: React.ReactNode,
 *   className?: string
 * }} props
 *
 *   `lede` promotes the title to a full sentence about the state of the clinic
 *   rather than the name of the screen. The Overview uses it: "Overview" is
 *   the same word every morning, and the sentence beside it — who is next,
 *   how many are still to be seen — is the only line on the page that changes
 *   hourly. Naming the screen is then the eyebrow's job, which is what an
 *   eyebrow is for.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  lede = false,
  actions,
  meta,
  className = '',
}) {
  return (
    <header className={`mb-7 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {eyebrow && <p className="section-label mb-2">{eyebrow}</p>}

          <h1
            className={
              lede
                ? 'max-w-[34ch] text-title font-semibold leading-snug text-ink'
                : 'text-title font-semibold text-ink'
            }
          >
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-[62ch] text-sm text-ink-2">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {/* A line of live figures under the title, on the same rule as the
          content below it. Kept out of the flex row above so it wraps to the
          full width on a phone instead of squeezing next to the action. */}
      {meta && <div className="mt-5">{meta}</div>}
    </header>
  )
}
