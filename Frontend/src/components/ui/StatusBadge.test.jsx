/**
 * StatusBadge.test.jsx
 *
 * Every state in the product is written down here, so this is where the
 * four-colour rule either holds or quietly stops holding. The tests check the
 * two things a reader depends on: that the wording is English rather than the
 * server's enum, and that the colour is never the only thing carrying the
 * meaning.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import StatusBadge, { statusLabel, statusTone } from './StatusBadge'

/** The badge element itself, whatever it is wrapped in. */
function badge(text) {
  return screen.getByText(text).closest('span')
}

describe('the wording', () => {
  it.each([
    ['REQUESTED', 'Requested'],
    ['CONFIRMED', 'Confirmed'],
    ['COMPLETED', 'Completed'],
    ['CANCELLED', 'Cancelled'],
    ['NO_SHOW', 'Did not attend'],
    ['ISSUED', 'Outstanding'],
    ['PAID', 'Paid'],
    ['OVERDUE', 'Overdue'],
    ['VOID', 'Void'],
    ['REFUNDED', 'Refunded'],
    ['PENDING', 'Awaiting sample'],
    ['IN_PROGRESS', 'In the lab'],
  ])('writes %s as "%s"', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('never shows a raw enum for a state it knows', () => {
    render(<StatusBadge status="NO_SHOW" />)
    expect(screen.queryByText('NO_SHOW')).not.toBeInTheDocument()
  })

  it('reads as English for a value it has never seen', () => {
    // A new state added to the backend must not render as AWAITING_REVIEW.
    render(<StatusBadge status="AWAITING_REVIEW" />)
    expect(screen.getByText('Awaiting review')).toBeInTheDocument()
  })

  it('says Unknown rather than nothing when the status is missing', () => {
    render(<StatusBadge status={undefined} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('lets the portal reword a state without changing its meaning', () => {
    render(<StatusBadge status="REQUESTED" label="Awaiting confirmation" />)
    expect(screen.getByText('Awaiting confirmation')).toBeInTheDocument()
    // Still amber: the patient is owed an answer either way.
    expect(badge('Awaiting confirmation')).toHaveClass('text-attention')
  })
})

describe('the colours', () => {
  it('spends amber only where somebody owes a decision or money', () => {
    for (const status of ['REQUESTED', 'NO_SHOW', 'ISSUED']) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(badge(statusLabel(status))).toHaveClass('text-attention')
      unmount()
    }
  })

  it('spends red only on overdue', () => {
    render(<StatusBadge status="OVERDUE" />)
    expect(badge('Overdue')).toHaveClass('text-critical')
  })

  it('does not colour a correctly finished state', () => {
    // Cancelled and void are closed, not wrong. Red on them spends the
    // reader's attention on the one row that needs none.
    for (const status of ['CANCELLED', 'VOID', 'REFUNDED']) {
      const { unmount } = render(<StatusBadge status={status} />)
      const el = badge(statusLabel(status))
      expect(el).not.toHaveClass('text-critical')
      expect(el).not.toHaveClass('text-attention')
      expect(el).toHaveClass('text-ink-3')
      unmount()
    }
  })

  it('draws an in-flight laboratory state in plain ink with a hollow dot', () => {
    // The fifth state is deliberately not a fifth colour.
    render(<StatusBadge status="PENDING" />)
    const el = badge('Awaiting sample')
    expect(el).toHaveClass('text-ink-2')
    const dot = el.querySelector('[aria-hidden="true"]')
    expect(dot).toHaveClass('bg-transparent')
  })

  it('falls back to the uncoloured tone for an unknown state', () => {
    render(<StatusBadge status="SOMETHING_NEW" />)
    expect(badge('Something new')).toHaveClass('text-ink-3')
  })

  it('uses no more than four colours across every state it knows', () => {
    // The clinical guidance caps interface colour coding at four with fixed
    // meanings. This is that cap, enforced.
    const states = [
      'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
      'ISSUED', 'PAID', 'OVERDUE', 'VOID', 'REFUNDED',
      'PENDING', 'IN_PROGRESS', 'ACTIVE', 'INACTIVE',
    ]
    const coloured = new Set(
      states
        .map((s) => statusTone(s).text)
        .filter((t) => t !== 'text-ink-2' && t !== 'text-ink-3')
    )
    expect(coloured.size).toBeLessThanOrEqual(4)
  })
})

describe('the dot is a second channel, not the message', () => {
  it('always pairs the colour with a word', () => {
    render(<StatusBadge status="OVERDUE" />)
    // A hue on its own is nothing to a colour-blind reader.
    expect(badge('Overdue')).toHaveTextContent('Overdue')
  })

  it('hides the dot from assistive technology', () => {
    render(<StatusBadge status="PAID" />)
    const dot = badge('Paid').querySelector('span')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('statusLabel and statusTone', () => {
  it('agree with what the badge renders', () => {
    render(<StatusBadge status="ISSUED" />)
    expect(screen.getByText(statusLabel('ISSUED'))).toBeInTheDocument()
    expect(badge('Outstanding')).toHaveClass(statusTone('ISSUED').text)
  })

  it('answer for an unknown state rather than throwing', () => {
    expect(statusLabel('WHAT_IS_THIS')).toBe('What is this')
    expect(statusTone('WHAT_IS_THIS').text).toBe('text-ink-3')
  })
})
