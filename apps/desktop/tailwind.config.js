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
          surface: '#111622',
          card: '#161C2C',
          border: '#232C42',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.4)',
          purple: '#8B5CF6',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
