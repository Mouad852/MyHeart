/**
 * DayGrid.jsx — one day, drawn to scale.
 *
 * The list beside this answers "what is next". It cannot answer "where is the
 * gap", because a list has no idea how long anything takes: five appointments
 * stacked as five rows look identical whether they fill the morning or overlap
 * each other. Good schedulers ship both views for exactly this reason, and the
 * research is blunt about it — an agenda is convenient for reviewing, and
 * useless for placing.
 *
 * So this is a single column of clinic hours with the booked slots drawn at
 * their real height and offset. What a receptionist reads off it in one glance
 * is the thing the list cannot show: the empty space.
 *
 * Deliberately not a week grid. MedCore books one clinic's appointments and the
 * question is nearly always about today or tomorrow; seven narrow columns would
 * cost the legibility of each one to answer a question nobody asked.
 */
import { format, isToday, isValid, parseISO } from 'date-fns'

/** Clinic hours. Anything booked outside them still draws, clamped. */
const START_HOUR = 8
const END_HOUR = 19
const MINUTES = (END_HOUR - START_HOUR) * 60
/** Pixels per minute — 1.1 puts a 30-minute slot at a readable 33px. */
const SCALE = 1.1

/** Where the block sits and how tall it is, in pixels from the top of the grid. */
function place(date, durationMinutes) {
  const minutesIn = (date.getHours() - START_HOUR) * 60 + date.getMinutes()
  const top = Math.max(0, minutesIn) * SCALE
  const height = Math.max(18, (durationMinutes || 30) * SCALE)
  return { top, height }
}

/** Blocks that overlap share the width rather than hiding each other. */
function lanes(rows) {
  const placed = []
  for (const row of rows) {
    const lane = placed.filter(
      (other) => row.top < other.top + other.height && other.top < row.top + row.height
    ).length
    placed.push({ ...row, lane })
  }
  const widest = Math.max(1, ...placed.map((row) => row.lane + 1))
  return { placed, widest }
}

/** Colour follows the same four meanings the rest of the product uses. */
const BLOCK = {
  REQUESTED: 'border-attention/50 bg-attention-soft text-attention',
  CONFIRMED: 'border-settled/45 bg-settled-soft text-settled',
  COMPLETED: 'border-rule-strong bg-raised text-ink-2',
  NO_SHOW: 'border-attention/50 bg-attention-soft text-attention',
  CANCELLED: 'border-rule bg-raised text-ink-3 line-through',
}

/**
 * @param {{
 *   day: Date,
 *   appointments: Array<object>,
 *   onSelect?: (appointment: object) => void
 * }} props
 */
export default function DayGrid({ day, appointments, onSelect }) {
  const hours = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) hours.push(hour)

  const rows = appointments
    .map((appointment) => {
      const date = appointment.appointmentDate
        ? parseISO(appointment.appointmentDate)
        : null
      if (!date || !isValid(date)) return null
      return { appointment, date, ...place(date, appointment.durationMinutes) }
    })
    .filter(Boolean)

  const { placed, widest } = lanes(rows)

  // Where the clock has reached, drawn across the column. Only meaningful on
  // the day it is actually today.
  const now = new Date()
  const showNow = isToday(day)
  const nowTop = showNow
    ? ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) * SCALE
    : -1
  const nowVisible = nowTop >= 0 && nowTop <= MINUTES * SCALE

  return (
    /*
      Two frames rather than one padded box. The gutter holds the hour labels
      and the frame to its right holds the rules and the blocks, so a block's
      percentage width resolves against the space it can actually occupy —
      with a single padded container those percentages resolve against the
      padding box and every block creeps into the labels.
    */
    <div className="relative select-none" style={{ height: MINUTES * SCALE + 12 }}>
      <div className="absolute inset-y-0 left-0 w-11" aria-hidden="true">
        {hours.map((hour) => (
          <span
            key={hour}
            className="ident absolute right-2 w-full text-right text-micro text-ink-3"
            style={{ top: (hour - START_HOUR) * 60 * SCALE - 6 }}
          >
            {String(hour).padStart(2, '0')}:00
          </span>
        ))}
        {nowVisible && (
          <span
            className="absolute right-2 w-full text-right text-micro font-semibold text-primary"
            style={{ top: nowTop - 6 }}
          >
            now
          </span>
        )}
      </div>

      <div className="absolute inset-y-0 left-11 right-0">
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-rule"
            style={{ top: (hour - START_HOUR) * 60 * SCALE }}
            aria-hidden="true"
          />
        ))}

        {nowVisible && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 border-t border-primary"
            style={{ top: nowTop }}
            aria-hidden="true"
          >
            <span className="absolute -top-[3px] left-0 h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        )}

        {placed.map(({ appointment, date, top, height, lane }) => {
          const width = `calc(${100 / widest}% - 3px)`
          const left = `calc(${(lane * 100) / widest}% + ${lane * 3}px)`
          const tight = height < 34
          return (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelect?.(appointment)}
              title={`${format(date, 'HH:mm')} · ${appointment.patient?.name ?? 'Patient'}`}
              className={`absolute z-10 overflow-hidden rounded-sm border px-2 text-left
                          transition-shadow duration-fast hover:shadow-overlay
                          ${tight ? 'py-0' : 'py-1'}
                          ${BLOCK[appointment.status] ?? BLOCK.COMPLETED}`}
              style={{ top, height, left, width }}
            >
              <span className="flex items-baseline gap-1.5 leading-tight">
                <span className="ident text-micro font-medium">{format(date, 'HH:mm')}</span>
                <span className="truncate text-micro font-medium">
                  {appointment.patient?.name ?? `Patient ${appointment.patientId}`}
                </span>
              </span>
              {!tight && appointment.doctor?.name && (
                <span className="mt-0.5 block truncate text-micro opacity-80">
                  {appointment.doctor.name}
                </span>
              )}
            </button>
          )
        })}

        {placed.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-meta text-ink-3">
            Nothing booked on this day.
          </p>
        )}
      </div>
    </div>
  )
}
