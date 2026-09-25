/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          accent: '#3B82F6'
        }
      }
    },
  },
  plugins: [],
}
