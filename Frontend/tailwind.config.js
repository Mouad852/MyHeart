/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display / headings font
        display: ['Syne', 'sans-serif'],
        // Body font
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // Core brand palette
        navy: {
          950: '#070B14',
          900: '#0D1424',
          800: '#111D35',
          700: '#162340',
          600: '#1E3058',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        slate: {
          850: '#1A2235',
        },
      },
      backgroundImage: {
        // Subtle dot-grid pattern for sidebar
        'dot-grid': "radial-gradient(circle, rgba(45,212,191,0.15) 1px, transparent 1px)",
      },
      backgroundSize: {
        'dot-sm': '20px 20px',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.18)',
        'card-hover': '0 0 0 1px rgba(45,212,191,0.2), 0 8px 32px rgba(0,0,0,0.28)',
        'teal-glow': '0 0 20px rgba(45,212,191,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
