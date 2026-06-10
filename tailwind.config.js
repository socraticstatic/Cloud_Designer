/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ATT Aleck Sans', 'Inter var', 'system-ui', 'sans-serif'],
        att: ['ATT Aleck Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* AT&T Flywheel base colors */
        'att-blue': 'hsl(var(--att-blue))',
        'functional-blue': 'hsl(var(--functional-blue))',
        'cobalt-700': 'hsl(var(--cobalt-700))',
        'cobalt-600': 'hsl(var(--cobalt-600))',
        'cobalt-100': 'hsl(var(--cobalt-100))',

        /* Flywheel semantic tokens - text */
        'fw-heading': 'hsl(var(--fw-heading))',
        'fw-body': 'hsl(var(--fw-body))',
        'fw-bodyLight': 'hsl(var(--fw-bodyLight))',
        'fw-disabled': 'hsl(var(--fw-disabled))',
        'fw-link': 'hsl(var(--fw-link))',
        'fw-linkHover': 'hsl(var(--fw-linkHover))',
        'fw-success': 'hsl(var(--fw-success))',
        'fw-warn': 'hsl(var(--fw-warn))',
        'fw-error': 'hsl(var(--fw-error))',
        'fw-info': 'hsl(var(--fw-info))',

        /* Flywheel semantic tokens - backgrounds */
        'fw-base': 'hsl(var(--fw-base))',
        'fw-wash': 'hsl(var(--fw-wash))',
        'fw-neutral': 'hsl(var(--fw-neutral))',
        'fw-accent': 'hsl(var(--fw-accent))',
        'fw-primary': 'hsl(var(--fw-primary))',
        'fw-ctaPrimary': 'hsl(var(--fw-ctaPrimary))',
        'fw-ctaPrimaryHover': 'hsl(var(--fw-ctaPrimaryHover))',
        'fw-ctaGhost': 'hsl(var(--fw-ctaGhost))',
        'fw-disabled-bg': 'hsl(var(--fw-disabled-bg))',
        'fw-success-bg': 'hsl(var(--fw-success-bg))',
        'fw-warn-bg': 'hsl(var(--fw-warn-bg))',
        'fw-error-bg': 'hsl(var(--fw-error-bg))',

        /* Flywheel semantic tokens - borders */
        'fw-border-primary': 'hsl(var(--fw-border-primary))',
        'fw-border-secondary': 'hsl(var(--fw-border-secondary))',
        'fw-border-active': 'hsl(var(--fw-border-active))',
        'fw-border-hover': 'hsl(var(--fw-border-hover))',
        'fw-border-success': 'hsl(var(--fw-border-success))',
        'fw-border-warn': 'hsl(var(--fw-border-warn))',
        'fw-border-error': 'hsl(var(--fw-border-error))',
      },
    },
  },
  plugins: [],
}
