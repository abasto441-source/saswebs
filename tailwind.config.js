/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-celeste': '#6ac4d7',
        'celeste-claro': '#bce6ed',
        'texto-n': '#333333',
        'borla-negro': '#000000',
        'fondo-blanco': '#ffffff',
      },
    },
  },
  plugins: [],
};
