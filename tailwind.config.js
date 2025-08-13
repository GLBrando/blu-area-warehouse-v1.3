/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blu-primary': '#1e40af',
        'blu-secondary': '#3b82f6',
        'blu-accent': '#60a5fa',
        'blu-dark': '#1e3a8a',
        'blu-light': '#dbeafe'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}