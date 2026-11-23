/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
};
