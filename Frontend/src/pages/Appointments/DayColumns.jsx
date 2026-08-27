/**
 * DayColumns.jsx — one clinic day, a column per doctor.
 *
 * This replaces a single merged column that lived in a 23rem sidebar beside the
 * list. That column had two problems and only one of them was width.
 *
 * The width was real: at 23rem it carried a `min-w-[26rem]` and scrolled
 * sideways, so the one view whose entire job is showing where the gaps are was
 * the one view you could not see all of.
 *
 * The other problem survives any amount of width. Merged into one column, two
 * doctors booked at 14:00 are an overlap, and an overlap has to be resolved by
 * splitting the width in half and hoping the names still fit. But they are not
 * an overlap. They are two people working at the same time, which is what a
 * clinic looks like on a normal Tuesday. Giving each doctor a column makes the
 * collision disappear structurally rather than by lane arithmetic, and answers
 * the question a receptionist actually holds — *who is free at 14:00* — by
 * looking down a column instead of reading names out of stacked slivers.
 *
 * Every doctor gets a column whether or not they are booked. An empty column is
 * not wasted space on this screen; it is the answer.
 *
 * The vertical range is computed from the day rather than fixed at 08:00-19:00.
 * A clinic that finishes at four should not spend a fifth of the screen drawing
 * an empty evening, and the whole day fitting on one screen is the point of
 * having drawn it to scale.
 */
import { format, isToday, isValid, parseISO } from 'date-fns'

/** The outer bounds. Anything booked outside them draws clamped to the edge. */
const EARLIEST = 7
const LATEST = 20

/** Pixels per minute. 1.0 puts a 30-minute slot at 30px, which holds one line. */
const SCALE = 1.0

/** Row height of the sticky doctor header. */
const HEAD = 40

/**
 * The hours actually worth drawing: the hour the first appointment starts in to
 * the hour the last one ends in, widened to at least 08:00-17:00 so a quiet day
 * still reads as a working day, and clamped to the clinic's outer bounds.
 *
 * No padding band. An hour of empty grid above the first appointment is an hour
 * of screen spent saying nothing, and this view exists to fit the day on one
 * screen.
 */
function bounds(rows) {
  if (rows.length === 0) return { start: 8, end: 17 }
  const starts = rows.map((r) => r.date.getHours() + r.date.getMinutes() / 60)
  const ends = rows.map(
    (r) =>
      r.date.getHours() +
      (r.date.getMinutes() + (r.appointment.durationMinutes || 30)) / 60
  )
  const start = Math.max(EARLIEST, Math.min(8, Math.floor(Math.min(...starts))))
  const end = Math.min(LATEST, Math.max(17, Math.ceil(Math.max(...ends))))
  return { start, end }
}

/** Colour follows the same four meanings as the rest of the product, and every
 *  one of them carries the status as a word inside the block as well. */
const BLOCK = {
  REQUESTED: 'border-attention/50 bg-attention-soft text-attention',
  CONFIRMED: 'border-settled/45 bg-settled-soft text-settled',
  COMPLETED: 'border-rule-strong bg-raised text-ink-2',
  NO_SHOW: 'border-attention/50 bg-attention-soft text-attention',
  CANCELLED: 'border-rule bg-raised text-ink-3',
}

const WORD = {
  REQUESTED: 'Requested',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Seen',
  NO_SHOW: 'Did not attend',
  CANCELLED: 'Cancelled',
}

function Block({ appointment, date, start, onSelect, showDoctor }) {
  const minutes = appointment.durationMinutes || 30
  const top = Math.max(0, (date.getHours() - start) * 60 + date.getMinutes()) * SCALE
  const height = Math.max(22, minutes * SCALE)
  const short = height < 42

  return (
    <button
      type="button"
      onClick={() => onSelect?.(appointment)}
      title={[
        format(date, 'HH:mm'),
        appointment.patient?.name ?? `Patient ${appointment.patientId}`,
        WORD[appointment.status] ?? appointment.status,
        appointment.doctor?.name,
        appointment.notes,
      ]
        .filter(Boolean)
        .join(' · ')}
      className={`absolute inset-x-1 z-10 overflow-hidden rounded-sm border px-2 py-1
                  text-left transition-shadow duration-fast hover:shadow-overlay
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${BLOCK[appointment.status] ?? BLOCK.COMPLETED}`}
      style={{ top, height }}
    >
      <span className="flex items-baseline gap-1.5 leading-tight">
        <span className="ident flex-shrink-0 text-micro font-medium">
          {format(date, 'HH:mm')}
        </span>
        <span className="truncate text-micro font-semibold">
          {appointment.patient?.name ?? `Patient ${appointment.patientId}`}
        </span>
      </span>

      {!short && (
        <span className="mt-0.5 block truncate text-micro opacity-90">
          {WORD[appointment.status] ?? appointment.status}
          {appointment.notes ? ` · ${appointment.notes}` : ''}
        </span>
      )}

      {/* On the narrow single-column fallback the doctor is not implied by the
          column it sits in, so the block has to say it. */}
      {showDoctor && !short && appointment.doctor?.name && (
        <span className="mt-0.5 block truncate text-micro opacity-75">
          {appointment.doctor.name}
        </span>
      )}
    </button>
  )
}

/**
 * @param {{
 *   day: Date,
 *   appointments: Array<object>,
 *   doctors: Array<{id: number, name: string, specialty?: string}>,
 *   onSelect?: (appointment: object) => void,
 * }} props
 */
export default function DayColumns({ day, appointments, doctors, onSelect }) {
  const rows = appointments
    .map((appointment) => {
      const date = appointment.appointmentDate
        ? parseISO(appointment.appointmentDate)
        : null
      return date && isValid(date) ? { appointment, date } : null
    })
    .filter(Boolean)

  const { start, end } = bounds(rows)
  const hours = []
  for (let hour = start; hour <= end; hour += 1) hours.push(hour)
  const bodyHeight = (end - start) * 60 * SCALE

  const now = new Date()
  const nowTop = ((now.getHours() - start) * 60 + now.getMinutes()) * SCALE
  const nowVisible = isToday(day) && nowTop >= 0 && nowTop <= bodyHeight

  const columns = doctors.length > 0 ? doctors : [{ id: null, name: 'Clinic' }]

  /* The hour rules are drawn once behind every column rather than per column,
     so they line up across the whole grid — a rule that stops and restarts at
     each column edge reads as a table, and a day is not a table. */
  const Rules = () => (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-rule"
          style={{ top: (hour - start) * 60 * SCALE }}
        />
      ))}
      {nowVisible && (
        <div
          className="absolute inset-x-0 z-20 border-t border-primary"
          style={{ top: nowTop }}
        >
          <span className="absolute -left-px -top-[3px] h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )

  const Gutter = () => (
    <div className="relative w-12 flex-shrink-0" style={{ height: bodyHeight }} aria-hidden="true">
      {hours.map((hour) => (
        <span
          key={hour}
          className="ident absolute right-2 text-micro text-ink-3"
          style={{ top: (hour - start) * 60 * SCALE - 6 }}
        >
          {String(hour).padStart(2, '0')}:00
        </span>
      ))}
      {nowVisible && (
        <span
          className="absolute right-2 text-micro font-semibold text-primary"
          style={{ top: nowTop - 6 }}
        >
          {format(now, 'HH:mm')}
        </span>
      )}
    </div>
  )

  return (
    <div className="select-none">
      {/* ── A column per doctor, from lg up ─────────────────────── */}
      <div className="hidden lg:block">
        <div className="flex">
          <div className="w-12 flex-shrink-0" style={{ height: HEAD }} />
          {columns.map((doctor) => (
            <div
              key={doctor.id ?? 'clinic'}
              className="min-w-0 flex-1 border-l border-rule px-2 pb-2"
              style={{ height: HEAD }}
            >
              <p className="truncate text-sm font-semibold text-ink">{doctor.name}</p>
              {doctor.specialty && (
                <p className="truncate text-micro text-ink-3">{doctor.specialty}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex border-t border-rule-strong">
          <Gutter />
          <div className="relative flex min-w-0 flex-1" style={{ height: bodyHeight }}>
            <Rules />
            {columns.map((doctor) => {
              const mine = rows.filter(
                (r) => doctor.id === null || r.appointment.doctorId === doctor.id
              )
              return (
                <div
                  key={doctor.id ?? 'clinic'}
                  className="relative min-w-0 flex-1 border-l border-rule"
                >
                  {mine.map(({ appointment, date }) => (
                    <Block
                      key={appointment.id}
                      appointment={appointment}
                      date={date}
                      start={start}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── One column below lg ─────────────────────────────────── */}
      {/* Six columns on a phone would be six columns of nothing legible, so
          the day merges and each block names its own doctor instead. */}
      <div className="lg:hidden">
        <div className="flex border-t border-rule-strong">
          <Gutter />
          <div className="relative min-w-0 flex-1" style={{ height: bodyHeight }}>
            <Rules />
            {rows.map(({ appointment, date }) => (
              <Block
                key={appointment.id}
                appointment={appointment}
                date={date}
                start={start}
                onSelect={onSelect}
                showDoctor
              />
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="border-t border-rule py-6 text-center text-meta text-ink-3">
          Nothing is booked on this day. Every column is free.
        </p>
      )}

      {/*
        A legend, which the rest of the product does not need and this screen
        does.

        The rule everywhere else is that colour never travels alone: every
        coloured state carries its word, because a hue on its own is nothing to
        a colour-blind reader. A half-hour block is thirty pixels tall and holds
        one line, and that line is already spent on the time and the patient,
        who are the subject. Something has to give, and it is not going to be
        the patient's name.

        So the word moves off the block and onto the screen. The pairing is
        stated once here, and each block repeats it in its title for anyone
        hovering or reading with assistive technology.
      */}
      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-3">
        {Object.entries(WORD).map(([status, word]) => (
          <li key={status} className="flex items-center gap-1.5 text-micro text-ink-2">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm border ${BLOCK[status]}`}
            />
            {word}
          </li>
        ))}
      </ul>
    </div>
  )
}
