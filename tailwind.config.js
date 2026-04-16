/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#769656',
          light: '#eeeed2',
          highlight: '#baca44',
          lastMove: '#f7ec59',
          check: '#ff0000',
        },
      },
    },
  },
  plugins: [],
}
