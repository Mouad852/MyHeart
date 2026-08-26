/**
 * PatientSearch.jsx — find a patient from anywhere.
 *
 * This replaces a button in the header labelled "Search" whose tooltip read
 * "Search is not available yet". A control that cannot do the thing it is
 * named after is worse than an empty space: it costs the reader a click to
 * learn that the product lies to them.
 *
 * It searches the register the receptionist already searches on the Patients
 * page, through the same endpoint, and opens the record. Press `/` anywhere to
 * reach it — the one shortcut worth having in a product where nearly every task
 * starts by finding a person.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import patientApi from '../../services/patientApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Spinner } from '../ui/LoadingSpinner'
import Avatar from '../ui/Avatar'

const MAX_RESULTS = 6

export default function PatientSearch() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)

  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const query = useDebouncedValue(term.trim(), 250)
  const enabled = open && query.length >= 2

  const { data, isFetching } = useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: () => patientApi.getPage({ q: query, size: MAX_RESULTS }),
    enabled,
    staleTime: 30_000,
  })

  const results = enabled ? (data?.content ?? []) : []
  const total = data?.totalElements ?? 0

  // The highlight resets whenever the result set changes, so Enter never opens
  // a record the reader is no longer looking at.
  useEffect(() => setCursor(0), [query])

  // `/` focuses the field, unless the reader is already typing somewhere.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const openPatient = (patient) => {
    setOpen(false)
    setTerm('')
    inputRef.current?.blur()
    navigate(`/patients/${patient.id}`)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => (c + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => (c - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      openPatient(results[cursor])
    }
  }

  const showPanel = open && query.length >= 2

  return (
    <div ref={wrapRef} className="relative w-full max-w-sm">
      <Search
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
      />

      <input
        ref={inputRef}
        type="search"
        value={term}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="patient-search-results"
        aria-label="Find a patient"
        placeholder="Find a patient"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setTerm(event.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        className="input h-9 bg-raised py-0 pl-9 pr-10 text-sm
 [&::-webkit-search-cancel-button]:hidden"
      />

      {/* The hint gets out of the way the moment there is something to clear. */}
      {term ? (
        <button
          type="button"
          onClick={() => {
            setTerm('')
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center
 justify-center rounded text-ink-3 hover:text-ink"
        >
          <X size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2
 rounded-sm border border-rule px-1.5 py-0.5 font-mono text-[10px]
                     leading-none text-ink-3"
        >
          /
        </kbd>
      )}

      {showPanel && (
        <div
          id="patient-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 animate-fade-in
 overflow-hidden rounded border border-rule bg-raised shadow-overlay"
        >
          {isFetching && results.length === 0 && (
            <p className="flex items-center gap-2.5 px-4 py-3.5 text-meta text-ink-3">
              <Spinner size={12} />
              Searching the register
            </p>
          )}

          {!isFetching && results.length === 0 && (
            <p className="px-4 py-3.5 text-meta text-ink-3">
              No patient matches “{query}”.
            </p>
          )}

          {results.map((patient, index) => (
            <button
              key={patient.id}
              type="button"
              role="option"
              aria-selected={index === cursor}
              onMouseEnter={() => setCursor(index)}
              onClick={() => openPatient(patient)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left
                          transition-colors duration-fast
                          ${index === cursor ? 'bg-raised' : ''}`}
            >
              <Avatar name={patient.name} size="xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{patient.name}</span>
                <span className="block truncate text-meta text-ink-3">
                  {patient.email || patient.phone || `Patient ${patient.id}`}
                </span>
              </span>
              <span className="ident flex-shrink-0 text-meta text-ink-3">
                #{patient.id}
              </span>
            </button>
          ))}

          {total > results.length && (
            <p className="border-t border-rule px-4 py-2.5 text-meta text-ink-3">
              {total - results.length} more match. Refine the search, or open the
              register.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
