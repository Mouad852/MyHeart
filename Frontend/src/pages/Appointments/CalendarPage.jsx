/**
 * CalendarPage.jsx — the clinic day, drawn to scale, on its own page.
 *
 * The diary at /appointments answers "what is next". This answers "where is the
 * gap", and the two are different questions: a list has no idea how long
 * anything takes, so five appointments look identical whether they fill the
 * morning or sit an hour apart.
 *
 * It used to share the diary's page as a 23rem column, which meant the view
 * whose entire job is showing empty space was the one squeezed for space. On
 * its own page the whole clinic fits across the measure, a column per doctor,
 * with no horizontal scroll and no overlap arithmetic.
 *
 * The title carries the state of the day in a sentence, the same way the
 * Overview and Today do, because a heading that reads "Calendar" every morning
 * is a heading nobody reads twice.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import { addDays, format, isSameDay, isToday, isValid, parseISO, startOfDay } from 'date-fns'
import PageHeader from '../../components/ui/Page'
import { Panel } from '../../components/ui/Panel'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { SkeletonRows } from '../../components/ui/LoadingSpinner'
import { useAppointments } from '../../hooks/useAppointments'
import { useDoctorOptions } from '../../hooks/useDoctors'
import DayColumns from './DayColumns'

const when = (value) => {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

/** Statuses that still hold a slot, and so still count as booked. */
const HOLDS_A_SLOT = ['REQUESTED', 'CONFIRMED']

export default function CalendarPage() {
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch } = useAppointments()
  const { data: doctors = [] } = useDoctorOptions()

  const appointments = useMemo(() => {
    const all = Array.isArray(data) ? data : (data?.content ?? [])
    return all.filter((row) => {
      const date = when(row.appointmentDate)
      return date && isSameDay(date, day)
    })
  }, [data, day])

  /* One sentence about the day, in place of a greeting. Which doctors are on,
     how much is booked, and whether anything is still waiting on the desk. */
  const lede = useMemo(() => {
    if (isLoading) return 'Loading the day.'
    // Counts every appointment drawn, not only the ones still holding a slot.
    // A sentence saying nine while fifteen blocks are on screen is a sentence
    // arguing with the thing it is describing.
    const drawn = appointments.length
    const holding = appointments.filter((a) => HOLDS_A_SLOT.includes(a.status)).length
    const requested = appointments.filter((a) => a.status === 'REQUESTED').length
    const working = new Set(appointments.map((a) => a.doctorId)).size

    if (drawn === 0) {
      return isToday(day)
        ? 'Nothing is booked today.'
        : `Nothing is booked on ${format(day, 'EEEE d MMMM')}.`
    }

    const parts = [
      `${drawn} appointment${drawn === 1 ? '' : 's'} across ${working} doctor${working === 1 ? '' : 's'}.`,
    ]
    if (requested > 0) {
      parts.push(`${requested} still waiting on the desk.`)
    } else if (holding < drawn) {
      parts.push(`${drawn - holding} already closed.`)
    }
    return parts.join(' ')
  }, [appointments, day, isLoading])

  return (
    <>
      <PageHeader
        eyebrow={`Calendar · ${format(day, 'EEEE d MMMM yyyy')}`}
        title={lede}
        lede
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-icon"
                aria-label="Previous day"
                onClick={() => setDay((d) => addDays(d, -1))}
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </button>
              <p className="min-w-[10rem] px-1 text-center text-sm font-medium text-ink">
                {isToday(day) ? 'Today' : format(day, 'EEE d MMM')}
              </p>
              <button
                type="button"
                className="btn-icon"
                aria-label="Next day"
                onClick={() => setDay((d) => addDays(d, 1))}
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {!isToday(day) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDay(startOfDay(new Date()))}
              >
                Back to today
              </button>
            )}

            <Link to="/appointments" className="btn btn-secondary btn-sm">
              <List size={14} strokeWidth={2} aria-hidden="true" />
              The list
            </Link>
          </div>
        }
      />

      {isError && (
        <ErrorBanner
          className="mb-6"
          title="The calendar could not be loaded"
          message={error?.message}
          onRetry={refetch}
        />
      )}

      <Panel>
        <div className="px-4 pb-5 pt-4 sm:px-5">
          {isLoading ? (
            <SkeletonRows rows={8} />
          ) : (
            <DayColumns
              day={day}
              appointments={appointments}
              doctors={doctors}
              onSelect={() => {
                // The actions live on the list, so opening a block goes there
                // rather than putting a second set of controls on this screen.
                // Through the router, not the browser: a full page load here
                // would throw away every cached query to move one screen.
                navigate('/appointments')
              }}
            />
          )}
        </div>
      </Panel>

      <p className="note mt-4">
        Booked slots are drawn at their real length, so the empty space is
        bookable time. Every doctor has a column whether or not they are booked.
      </p>
    </>
  )
}
