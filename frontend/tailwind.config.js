/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // BizzGuest brand — see architecture §16. Forest + brass reads as
        // hospitality without tipping into the generic "gold on black" hotel template.
        ink: '#1B2420',
        'ink-soft': '#4B564E',
        brass: {
          DEFAULT: '#A9722E',
          dark: '#7A5220',
          light: '#D3A55A'
        },
        forest: {
          DEFAULT: '#2F4A3C',
          soft: '#43614F'
        },
        stone: {
          DEFAULT: '#F4F2E9',
          line: '#D8D3C4'
        },
        status: {
          good: '#3D7A52',
          warn: '#A1793C',
          danger: '#A13C3C'
        }
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'Georgia', 'serif'],
        sans: ['-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', '"Cascadia Code"', '"SFMono-Regular"', 'Consolas', 'monospace']
      },
      borderRadius: {
        card: '10px'
      }
    }
  },
  plugins: []
};
