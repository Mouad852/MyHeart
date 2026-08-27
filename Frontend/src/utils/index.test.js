/**
 * index.test.js — the formatting helpers.
 *
 * These decide how money, references and phone numbers read on screen. They
 * are pure functions with no excuse for being wrong, and the money one in
 * particular has a property worth pinning down: a sum a person reconciles
 * against a bank statement is never abbreviated and never loses a decimal.
 */
import { describe, expect, it } from 'vitest'

import {
  formatPhone,
  getInitials,
  isValidEmail,
  isValidPhone,
  money,
  reference,
  truncate,
} from './index'

const NBSP = ' '

describe('money', () => {
  it('groups thousands with a non-breaking space and puts the currency after', () => {
    expect(money(6090, 'MAD')).toBe(`6${NBSP}090.00${NBSP}MAD`)
    expect(money(42180.5, 'MAD')).toBe(`42${NBSP}180.50${NBSP}MAD`)
  })

  it('always shows two decimals, so a column of amounts lines up', () => {
    expect(money(0, 'MAD')).toBe(`0.00${NBSP}MAD`)
    expect(money(7, 'MAD')).toBe(`7.00${NBSP}MAD`)
    expect(money(7.1, 'MAD')).toBe(`7.10${NBSP}MAD`)
  })

  it('never abbreviates a large amount', () => {
    const out = money(1250000, 'MAD')
    expect(out).toBe(`1${NBSP}250${NBSP}000.00${NBSP}MAD`)
    expect(out).not.toMatch(/\d\s*[kKmM]\b/)
  })

  it('omits the currency when none is given', () => {
    expect(money(1500)).toBe(`1${NBSP}500.00`)
  })

  it('reads a missing amount as zero rather than NaN', () => {
    expect(money(null, 'MAD')).toBe(`0.00${NBSP}MAD`)
    expect(money(undefined, 'MAD')).toBe(`0.00${NBSP}MAD`)
  })

  it('accepts the string a JSON payload actually carries', () => {
    expect(money('340.00', 'MAD')).toBe(`340.00${NBSP}MAD`)
  })

  it('keeps the sign on a refund', () => {
    expect(money(-340, 'MAD')).toBe(`-340.00${NBSP}MAD`)
  })

  it('uses no comma, which would read as a decimal point to half the world', () => {
    expect(money(9999.99, 'MAD')).not.toMatch(/,/)
  })
})

describe('reference', () => {
  it('scopes a record that belongs to a year', () => {
    expect(reference('INV', 387, '2026-08-27')).toBe('INV-2026-0387')
    expect(reference('LAB', 3, '2026-01-04T09:15:00')).toBe('LAB-2026-0003')
  })

  it('leaves a patient number unscoped, because they are not filed by year', () => {
    expect(reference('P', 1042)).toBe('P-1042')
    expect(reference('P', 1)).toBe('P-0001')
  })

  it('pads to four digits so references sort and scan as a column', () => {
    expect(reference('INV', 7, '2026-08-27')).toBe('INV-2026-0007')
  })

  it('does not truncate a number that has outgrown the padding', () => {
    expect(reference('INV', 123456, '2026-08-27')).toBe('INV-2026-123456')
  })

  it('drops the year rather than printing nonsense when the date is unusable', () => {
    expect(reference('INV', 387, 'not-a-date')).toBe('INV-0387')
    expect(reference('INV', 387, '')).toBe('INV-0387')
  })

  it('shows a dash rather than a broken reference when there is no id', () => {
    expect(reference('INV', null, '2026-08-27')).toBe('—')
    expect(reference('INV', undefined)).toBe('—')
  })

  it('treats zero as an id, not as absent', () => {
    expect(reference('P', 0)).toBe('P-0000')
  })
})

describe('formatPhone', () => {
  it('groups a Moroccan number the way it is written on a card', () => {
    expect(formatPhone('+212691253981')).toBe('+212 691 25 39 81')
    expect(formatPhone('+212661204108')).toBe('+212 661 20 41 08')
  })

  it('ignores the spacing it was given and imposes its own', () => {
    expect(formatPhone('+212 691253981')).toBe('+212 691 25 39 81')
    expect(formatPhone('+212-691-253-981')).toBe('+212 691 25 39 81')
  })

  it('keeps every digit of a number written in the local form', () => {
    // This grouped only the last eight digits, which displayed 0691253981 as
    // "91 25 39 81" — two digits short, on the register, the patient record,
    // the doctors page and the portal.
    expect(formatPhone('0691253981')).toBe('06 91 25 39 81')
    expect(formatPhone('0522431290')).toBe('05 22 43 12 90')
  })

  it('never loses a digit, whatever form it is given', () => {
    for (const input of ['+212691253981', '0691253981', '+33612345678', '212691253981']) {
      const digitsIn = input.replace(/\D/g, '')
      const digitsOut = formatPhone(input).replace(/\D/g, '')
      expect(digitsOut, input + ' lost digits').toBe(digitsIn)
    }
  })

  it('keeps the plus on a number from another country', () => {
    // Only the Moroccan grouping is claimed. Everything else is read in pairs,
    // which is wrong for nobody and unreadable for no one.
    expect(formatPhone('+33612345678')).toMatch(/^\+33/)
  })

  it('returns something short unchanged rather than mangling it', () => {
    expect(formatPhone('12345')).toBe('12345')
  })

  it('is empty for an empty value, not the string "undefined"', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone(null)).toBe('')
    expect(formatPhone(undefined)).toBe('')
  })
})

describe('getInitials', () => {
  it('takes the first letter of the first and last words', () => {
    expect(getInitials('Chaouni Mouad')).toBe('CM')
  })

  it('copes with one name, extra spaces and nothing at all', () => {
    expect(getInitials('Nadia')).toBe('N')
    expect(getInitials('  Nadia   Bensalem  ')).toBe('NB')
    expect(getInitials('')).toBe('')
    expect(getInitials()).toBe('')
  })
})

describe('truncate', () => {
  it('leaves anything that fits alone', () => {
    expect(truncate('Blood count', 40)).toBe('Blood count')
  })

  it('cuts with an ellipsis rather than mid-word silence', () => {
    const out = truncate('a'.repeat(60), 10)
    expect(out.length).toBeLessThanOrEqual(11)
    expect(out.endsWith('…') || out.endsWith('...')).toBe(true)
  })
})

describe('the validators', () => {
  it('accepts an ordinary address and rejects the usual mistakes', () => {
    expect(isValidEmail('nadia@clinic.ma')).toBe(true)
    expect(isValidEmail('nadia@clinic')).toBe(false)
    expect(isValidEmail('nadia at clinic.ma')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('accepts a Moroccan number in the forms people actually type', () => {
    expect(isValidPhone('+212691253981')).toBe(true)
    expect(isValidPhone('0691253981')).toBe(true)
    expect(isValidPhone('abc')).toBe(false)
  })
})
