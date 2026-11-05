/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0f172a',        // Solid slate-900
          card: '#1e293b',      // Solid slate-800
          cardHover: '#243247',
          border: '#334155',    // Solid slate-700
          borderLight: '#475569',
          primary: '#2563eb',   // Solid blue-600
          primaryHover: '#1d4ed8',
          text: '#f8fafc',      // Solid slate-50
          muted: '#94a3b8',     // Solid slate-400
          success: '#16a34a',   // Solid green-600
          warning: '#d97706',   // Solid amber-600
          danger: '#dc2626',    // Solid red-600
        }
      }
    },
  },
  plugins: [],
}

