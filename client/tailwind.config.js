/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9edff",
          500: "#1b82d2",
          700: "#135f99",
          900: "#0d3f63",
        },
      },
      boxShadow: {
        card: "0 20px 45px -28px rgba(14, 33, 48, 0.45)",
      },
    },
  },
  plugins: [],
};
