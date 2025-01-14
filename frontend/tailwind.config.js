/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-blue": "#005adf",
      },
    },
  },
  plugins: ["@tailwindcss/forms", "prettier-plugin-tailwindcss"],
};
