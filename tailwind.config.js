const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // No darkMode — MECH is light-only
  theme: {
    extend: {
      colors: {
        'mech-orange':          '#FF5B24',
        'mech-dark':            '#1D1A19',
        'mech-paper':           '#F9F2EE',
        'mech-paper-secondary': '#F1E7E2',
        'mech-ink-80':          '#3A3330',
        'mech-ink-50':          '#8C7D76',
        'mech-ink-20':          '#D4C8C2',
        'mech-signal-green':    '#2ECC71',
        'mech-signal-red':      '#E74C3C',
        // Legacy aliases
        cream:    '#F9F2EE',
        charcoal: '#1D1A19',
        brand: { orange: '#FF5B24' },
      },
      fontFamily: {
        'grotesk': ['Space Grotesk', ...fontFamily.sans],
        'poppins': ['Poppins', ...fontFamily.sans],
        'termina': ['Termina Test', ...fontFamily.sans],
        'mono':    ['JetBrains Mono', ...fontFamily.mono],
      },
      fontSize: {
        'display-2xl': ['3rem',      { lineHeight: '1.1',  fontWeight: '700' }],
        'display-xl':  ['2.25rem',   { lineHeight: '1.15', fontWeight: '700' }],
        'display-lg':  ['1.75rem',   { lineHeight: '1.2',  fontWeight: '600' }],
        'display-md':  ['1.375rem',  { lineHeight: '1.3',  fontWeight: '600' }],
        'display-sm':  ['1.125rem',  { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg':     ['1rem',      { lineHeight: '1.6',  fontWeight: '400' }],
        'body-md':     ['0.875rem',  { lineHeight: '1.6',  fontWeight: '400' }],
        'body-sm':     ['0.75rem',   { lineHeight: '1.5',  fontWeight: '400' }],
        'label-lg':    ['0.8125rem', { lineHeight: '1.4',  fontWeight: '500' }],
        'label-sm':    ['0.6875rem', { lineHeight: '1.3',  fontWeight: '500' }],
        'mono-lg':     ['0.9375rem', { lineHeight: '1.5',  fontWeight: '400' }],
        'mono-md':     ['0.8125rem', { lineHeight: '1.4',  fontWeight: '400' }],
        'mono-sm':     ['0.6875rem', { lineHeight: '1.3',  fontWeight: '400' }],
      },
      spacing: {
        '1':  '4px',  '2':  '8px',  '3':  '12px', '4':  '16px',
        '5':  '20px', '6':  '24px', '8':  '32px',  '10': '40px',
        '12': '48px', '16': '64px', '20': '80px',
      },
      borderRadius: {
        'none': '0px',
        'sm':   '2px',
        'full': '9999px',
      },
      boxShadow: {
        'none':   'none',
        'signal': '0 0 0 2px rgba(255, 91, 36, 0.30)',
      },
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sharp':   'cubic-bezier(0.4, 0, 0.6, 1)',
        'out':     'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        'instant': '80ms',
        'fast':    '150ms',
        'base':    '200ms',
        'slow':    '300ms',
        'crawl':   '500ms',
      },
    },
  },
  plugins: [],
}
