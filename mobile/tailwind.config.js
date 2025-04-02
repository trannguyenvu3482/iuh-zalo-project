/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#257dfd",
        secondary: "#0056B3",
        background: "#F8F9FA",
        text: "#212529",
      },
    },
  },
  plugins: [],
};
