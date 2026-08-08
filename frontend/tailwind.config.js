/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // BizzGuest brand — deep navy + warm cream + soft gold. Navy carries
        // structural chrome (navbar, primary actions), cream grounds every
        // surface, gold is reserved for accents/icons so it stays a luxury
        // signal rather than wallpaper. See architecture §16.
        navy: {
          DEFAULT: '#0F2747',
          deep: '#081627', // hover/active states on navy surfaces
          soft: '#3C5578'  // muted navy — icon strokes, subtle borders on navy
        },
        cream: {
          DEFAULT: '#F7F3EA',
          line: '#E6DCC5', // borders/dividers over cream
          muted: '#EFE8D6' // slightly recessed panel background
        },
        gold: {
          DEFAULT: '#C9A45C', // fills, borders, badges, icons, gold-on-navy accents
          dark: '#8A6A2E',    // readable gold text/links on cream (AA contrast)
          light: '#E7CD94'    // soft hover tint, gold on dark navy backgrounds
        },
        // Text hierarchy — a navy-black family, distinct from the brand
        // "navy" used for chrome so headings don't compete with the navbar.
        ink: {
          DEFAULT: '#13223B',
          soft: '#5B6B82',
          faint: '#8B96A8'
        },
        status: {
          good: '#2F6B4F',
          warn: '#BF7327',
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
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,39,71,.06), 0 8px 24px rgba(15,39,71,.07)',
        gold: '0 0 0 1px rgba(201,164,92,.4)'
      }
    }
  },
  plugins: []
};
