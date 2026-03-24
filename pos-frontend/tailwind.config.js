/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffd7d7',
          200: '#ffb0b0',
          300: '#ff7a7a',
          400: '#ff4242',
          500: '#f01818',
          600: '#c90c0c',
          700: '#a10a0a',
          800: '#7b0d0d',
          900: '#5b0d0d',
        },
      },
      boxShadow: {
        glow: '0 20px 45px -25px rgba(240, 24, 24, 0.6)',
      },
    },
  },
  plugins: [],
}
