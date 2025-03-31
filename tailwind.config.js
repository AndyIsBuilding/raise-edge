/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'table-green': '#35654d',
        'spades': '#333333',
        'hearts': '#e41f25',
        'diamonds': '#0066cc',
        'clubs': '#007f00',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
} 