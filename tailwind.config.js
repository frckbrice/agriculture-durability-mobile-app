/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryMuted: '#1f2937',
        background: '#F5F5F5',
        darkness: '#141518',
        gray: '#626D77',
        lightGray: '#D8DCE2',
        primary: '#161622',
        secondary: {
          DEFAULT: "#FF9C01",
          100: "#FF9001",
          200: "#FF8E01",
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: {
          100: '#CDCDE0',
        },
        fontFamily: {
          pthin: ["Poppins-Thin", "sans-serif"],
          pextralight: ["Poppins-ExtraLight", "sans-serif"],
          plight: ["Poppins-Regular", "sans-serif"],
          pmedium: ["Poppins-medium", "sans-serif"],
          psemibold: ["Poppins-SemiBold", "sans-serif"],
          pbold: ["Poppins-Bold", "sans-serif"],
          pblack: ["Poppins-Black", "sans-serif"],
        }
      }
    },
  },
  plugins: [],
}

