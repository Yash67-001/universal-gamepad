/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gamepad: {
          bg: '#0A0D14',
          surface: '#121722',
          border: '#1F293D',
          accent: '#00F0FF',
          accentHover: '#33F3FF',
          purple: '#8B5CF6',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
          buttonBg: 'rgba(255, 255, 255, 0.08)',
          buttonActive: 'rgba(0, 240, 255, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
