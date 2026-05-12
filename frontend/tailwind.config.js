/** @type {import('tailwindcss').Config} */
export default {
   // Tell Tailwind which files contain class names to scan
  // Without this, Tailwind doesn't know which CSS to generate
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

