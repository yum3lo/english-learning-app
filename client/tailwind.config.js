/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Lora', 'serif']
      },
      gridTemplateColumns: {
        '70/30': '70% 28%',
      },
      colors: {
        beige: '#fafaef',
        bordo: '#460c16',
        coral: '#943838',
        green: '#e0e1b7',
        red: '#691220',
        citron: '#babd61'
      }
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'body': {
          color: '#460c16',
          backgroundColor: '#fafaef',
          fontFamily: theme('fontFamily.sans')
        },
        'p': {
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.normal'),
          '@screen md': { fontSize: theme('fontSize.base') },
        },
        'h1': {
          fontSize: theme('fontSize.2xl'),
          fontWeight: theme('fontWeight.bold'),
          '@screen sm': { fontSize: theme('fontSize.3xl') },
          '@screen md': { fontSize: theme('fontSize.4xl') },
          fontFamily: theme('fontFamily.serif')
        },
        'h2': {
          fontSize: theme('fontSize.xl'),
          fontWeight: theme('fontWeight.semibold'),
          '@screen sm': { fontSize: theme('fontSize.2xl') },
          '@screen md': { fontSize: theme('fontSize.3xl') },
          fontFamily: theme('fontFamily.serif')
        },
        'h3': {
          fontSize: theme('fontSize.lg'),
          fontWeight: theme('fontWeight.medium'),
          '@screen sm': { fontSize: theme('fontSize.xl') },
          '@screen md': { fontSize: theme('fontSize.2xl') },
          fontFamily: theme('fontFamily.serif')
        }
      });
    },
  ],
}