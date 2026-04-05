/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy (keep for old components)
        canvas: "#f5f2ea",
        ink:    "#1f1a17",
        sand:   "#efe8dd",
        clay:   "#d5c2aa",
        accent: "#c96d42",
        green:  "#2c7a5f",
        border: "#dccdb8",
      },
      boxShadow: {
        card: "0 16px 40px rgba(66, 39, 24, 0.08)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body:    ["Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
