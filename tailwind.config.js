/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        whopPrimary: {
          DEFAULT: "#5C6CFF",
          foreground: "#FFFFFF"
        },
        whopSurface: "#0F1117"
      },
      maxWidth: {
        "content-readable": "72ch"
      },
      boxShadow: {
        card: "0 20px 45px -25px rgba(15, 17, 23, 0.65)"
      }
    }
  },
  plugins: []
};
