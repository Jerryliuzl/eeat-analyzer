/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 🔑 這必須是 'class'
  content: [
    "./frontend/src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
