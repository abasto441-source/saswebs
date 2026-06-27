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
        'primary-celeste': '#0284c7', // Sleek sky blue for enterprise SaaS
        'celeste-claro': '#e0f2fe',   // Soft sky light tint
        'texto-n': '#1e293b',         // Slate 800 for high-contrast professional text
        'borla-negro': '#0f172a',     // Slate 900
        'fondo-blanco': '#f8fafc',    // Slate 50 background
      },
    },
  },
  plugins: [],
};
