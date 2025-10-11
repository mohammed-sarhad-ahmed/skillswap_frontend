/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"], // your files
  theme: {
    extend: {},
    screens: {
      sm: "640px",
      md: "850px", // changed breakpoint
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};
