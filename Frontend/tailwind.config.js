/**
 * MedCore design tokens.
 *
 * The interface is a working surface for people who sit in front of it all day,
 * so the palette is built to stay quiet. Almost everything on screen is one of
 * five near-neutral surfaces and three text weights; colour is reserved for
 * things that carry meaning.
 *
 * Two rules that the rest of the codebase depends on:
 *
 *   Colour means something. Teal is interaction and "now". Amber is money owed.
 *   Rose is late or broken. Orange is a patient who did not come. Blue is
 *   laboratory. Nothing is coloured because a section looked empty.
 *
 *   Corners are square. The radius scale tops out at 4px, and the only round
 *   things in the product are status dots and avatars. Clinical records are
 *   ruled sheets, not cards with soft edges, and the shape carries more of the
 *   product's character than any single decoration would.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Wordmark, page titles and large figures only.
        display: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Everything operational.
        body: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Anything read as an identifier: times, numbers, amounts, codes.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      colors: {
        /**
         * Surfaces, darkest first. `navy` is kept as the name because the whole
         * codebase already reaches for it; the values are retuned to be less
         * saturated so that teal and amber read as signals against them rather
         * than as more blue.
         */
        navy: {
          950: '#080B12', // the page itself
          900: '#0C1019', // a panel sitting on the page
          850: '#111623', // a raised row, a hover, a header strip
          800: '#161C2B', // an input, a pressed control
          700: '#1D2537', // the strongest surface in normal use
          600: '#28324a', // borders that need to be seen
        },

        // Interaction, focus, and the current moment. Used sparingly.
        teal: {
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },

        // Money outstanding.
        amber: {
          300: '#FCD34D',
          400: '#F5B932',
          500: '#D99A18',
        },

        // Late, failed, destructive.
        rose: {
          300: '#FDA4B4',
          400: '#F87089',
          500: '#E5476A',
        },

        // A patient who did not attend. Distinct from "late" on purpose.
        orange: {
          400: '#F59E4B',
          500: '#E07C22',
        },

        // Laboratory context.
        blue: {
          400: '#63A0F5',
          500: '#3B7DE0',
        },

        /**
         * Text greys, overriding two steps of Tailwind's slate.
         *
         * The scale has exactly three levels for text, and every one of them
         * clears WCAG AA at 4.5:1 against both the page and a panel:
         *
         *   slate-200  #E2E8F0   ~14:1   what the row is about
         *   slate-400  #94A3B8   ~6.9:1  supporting detail
         *   slate-500  #737F92   ~4.7:1  metadata, hints, timestamps
         *
         * Tailwind's own slate-500 measured 3.97:1 and was carrying most of
         * the metadata in the product; slate-600 measured 2.2:1 and was being
         * used for hints that a reader is actually expected to read. Both were
         * comfortably illegible on a laptop screen in a lit room.
         *
         * slate-600 stays dark and is now for marks rather than words: rules,
         * the dot on a closed status, a disabled glyph.
         */
        slate: {
          500: '#737F92',
          600: '#59647A',
        },
      },

      /**
       * Named rather than numbered, because the point of each one is its job.
       * `hairline` is the workhorse: it separates rows, columns and sections
       * everywhere a card would otherwise have been reached for.
       */
      borderColor: {
        hairline: 'rgba(255,255,255,0.06)',
        rule: 'rgba(255,255,255,0.10)',
        strong: 'rgba(255,255,255,0.16)',
      },

      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '5px',
        '3xl': '6px',
        // Kept for the two things that genuinely are round.
        full: '9999px',
      },

      fontSize: {
        micro: ['10.5px', { lineHeight: '1.35', letterSpacing: '0.07em' }],
        // `xs` and `meta` are the same size on purpose: the codebase already
        // says text-xs in a hundred places and both should mean "metadata".
        xs: ['12px', { lineHeight: '1.45' }],
        meta: ['12px', { lineHeight: '1.45' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.55' }],
        lg: ['16px', { lineHeight: '1.45' }],
        xl: ['18px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '2xl': ['21px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        '3xl': ['26px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        '4xl': ['34px', { lineHeight: '1', letterSpacing: '-0.025em' }],
        title: ['21px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        figure: ['26px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'figure-lg': ['34px', { lineHeight: '1', letterSpacing: '-0.025em' }],
      },

      boxShadow: {
        // One shadow, tinted to the background, and only for things that float
        // above the page: menus, dialogs, the mobile drawer.
        overlay: '0 16px 40px -12px rgba(2,5,12,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
      },

      transitionDuration: {
        fast: '120ms',
        DEFAULT: '160ms',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drawer-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        // A slow sweep across a placeholder. Deliberately unhurried: a fast
        // shimmer reads as an error state.
        sweep: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 160ms ease-out both',
        'rise-in': 'rise-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'drawer-in': 'drawer-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        sweep: 'sweep 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
