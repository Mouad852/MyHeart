/**
 * MedCore design tokens — direction "Ledger".
 *
 * Every colour here resolves to a CSS custom property rather than a hex value,
 * so one set of utility classes serves both themes and neither is a second
 * design. The properties themselves live in src/index.css.
 *
 * The two decisions the rest of the system rests on:
 *
 *   Light is the default, dark is a real option. The positive-polarity
 *   advantage — text read faster and with more errors caught on a light ground
 *   — grows as type gets smaller, and this is a product made of 14px names,
 *   doses, dates and amounts. The counter-argument is genuine: clinicians spend
 *   tens of thousands of hours in front of this, and less display light means
 *   less scatter for anyone with early lens clouding. That argues for offering
 *   dark, not for defaulting to it.
 *
 *   Four colours, four meanings. The peer-reviewed guidance on clinical
 *   interfaces caps colour coding at four and requires colour to be paired with
 *   a word or a symbol, because a hue on its own is nothing to a colour-blind
 *   reader. Attention, critical, settled, closed. Laboratory does not get a
 *   colour: it is a kind of record, not a state, and the glyph and the word
 *   already say so.
 */

/** `rgb(var(--x) / <alpha-value>)` keeps Tailwind's opacity modifiers working. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Everything that is read.
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Everything that is identified.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // Kept pointing at the text face so any stray `font-display` in an
        // unconverted corner renders in the system rather than in a fallback.
        display: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      colors: {
        // ── Surfaces ────────────────────────────────────────────────
        ground: token('ground'), // the page
        surface: token('surface'), // panels, rows, inputs
        raised: token('raised'), // a hovered row, a header strip, a menu

        // ── Text ────────────────────────────────────────────────────
        ink: token('ink'), // the subject of a row
        'ink-2': token('ink-2'), // supporting detail
        'ink-3': token('ink-3'), // metadata, timestamps

        // ── Interaction ─────────────────────────────────────────────
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'), // tinted ground for a selected row
          ink: token('primary-ink'), // text sitting on a solid primary
        },

        // ── The four meanings ───────────────────────────────────────
        attention: {
          DEFAULT: token('attention'), // needs a decision, money owed
          soft: token('attention-soft'),
        },
        critical: {
          DEFAULT: token('critical'), // overdue, failed, destructive
          soft: token('critical-soft'),
        },
        settled: {
          DEFAULT: token('settled'), // paid, confirmed, complete
          soft: token('settled-soft'),
        },
        closed: {
          DEFAULT: token('closed'), // cancelled, void, no longer expected
          soft: token('closed-soft'),
        },

        // Also in `colors` so a rule can be drawn as a background — the spine,
        // a 1px divider inside a grid — and used as a ring.
        rule: token('rule'),
        'rule-strong': token('rule-strong'),
      },

      borderColor: {
        DEFAULT: token('rule'),
        rule: token('rule'), // hairlines, gridlines, panel edges
        strong: token('rule-strong'), // a border that has to be seen
      },

      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '3px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '6px',
        full: '9999px', // status dots and avatars only
      },

      /**
       * Staff screens sit at 14px, the size the clinical guidance names as
       * optimal. The patient portal steps to 16 through `text-portal`: the same
       * system, read by somebody who is not paid to be fluent in it.
       */
      fontSize: {
        micro: ['11px', { lineHeight: '1.4' }],
        meta: ['12.5px', { lineHeight: '1.45' }],
        xs: ['12.5px', { lineHeight: '1.45' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.5' }],
        portal: ['16px', { lineHeight: '1.55' }],
        lg: ['15px', { lineHeight: '1.45' }],
        subject: ['17px', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        xl: ['19px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '2xl': ['22px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        title: ['26px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '3xl': ['26px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        figure: ['28px', { lineHeight: '1.05', letterSpacing: '-0.022em' }],
        '4xl': ['34px', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'figure-lg': ['34px', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },

      boxShadow: {
        // One shadow, and only for things that genuinely float above the page.
        overlay: 'var(--shadow-overlay)',
      },

      transitionDuration: {
        fast: '120ms',
        DEFAULT: '160ms',
      },

      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drawer-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        sweep: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 140ms ease-out both',
        'rise-in': 'rise-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'drawer-in': 'drawer-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        sweep: 'sweep 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
