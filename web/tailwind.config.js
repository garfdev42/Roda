/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        roda: {
          black: "#000000",
          dark: "#0C0D0D",
          white: "#FFFFFF",
          lime: "#EBFF00",
          green: "#C6F833",
          purple: "#B794F6",
        },
      },
    },
  },
  plugins: [],
};
