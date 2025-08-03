/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Poppins',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'serif'
  			]
  		},
  		gridTemplateColumns: {
  			'70/30': '70% 28%'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'p': {
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.normal'),
          '@screen md': { fontSize: theme('fontSize.base') },
        },
        'h1': {
          fontSize: theme('fontSize.xl'),
          fontWeight: theme('fontWeight.bold'),
          '@screen sm': { fontSize: theme('fontSize.2xl') },
          '@screen md': { fontSize: theme('fontSize.3xl') },
          fontFamily: theme('fontFamily.serif'),
					lineHeight: theme('lineHeight.normal')
        },
        'h2': {
          fontSize: theme('fontSize.lg'),
          fontWeight: theme('fontWeight.semibold'),
          '@screen sm': { fontSize: theme('fontSize.xl') },
          '@screen md': { fontSize: theme('fontSize.2xl') },
          fontFamily: theme('fontFamily.serif'),
					lineHeight: theme('lineHeight.normal')
        },
        'h3': {
          fontSize: theme('fontSize.md'),
          fontWeight: theme('fontWeight.medium'),
          '@screen sm': { fontSize: theme('fontSize.lg') },
          '@screen md': { fontSize: theme('fontSize.xl') },
          fontFamily: theme('fontFamily.serif'),
					lineHeight: theme('lineHeight.normal')
        }
      });
    },
    require("tailwindcss-animate")
],
}