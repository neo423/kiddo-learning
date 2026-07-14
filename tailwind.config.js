/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        rounded: ['"Arial Rounded MT Bold"', '"Noto Sans TC"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px rgba(66, 103, 140, 0.18)',
        button: '0 7px 0 rgba(44, 76, 110, 0.15)',
      },
    },
  },
  plugins: [],
}
