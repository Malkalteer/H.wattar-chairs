/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9f3ee',
          100: '#f2e5d8',
          200: '#e7d1b6',
          300: '#d9b98b',
          400: '#c88d5d',
          500: '#a9653d',
          600: '#8d4d2d',
          700: '#5f3426',
          800: '#38231d',
          900: '#261712',
        },
        gold: '#d9b779',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(30, 20, 15, 0.12)',
      },
    },
  },
  plugins: [],
};
