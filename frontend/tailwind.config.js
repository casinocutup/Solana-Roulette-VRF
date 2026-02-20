/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          dark: '#0a0a0a',
          darker: '#050505',
          gold: '#d4af37',
          'gold-light': '#f4e4bc',
          red: '#c41e3a',
          black: '#1a1a1a',
          green: '#2d5016',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
}
