/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fkblue: {
          DEFAULT: '#2874f0',
          dark: '#1c5ac6',
          light: '#f1f5fe'
        },
        fkyellow: {
          DEFAULT: '#ffe500',
          dark: '#fb641b',
          star: '#388e3c'
        }
      }
    },
  },
  plugins: [],
}
