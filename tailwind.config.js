/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        card: '#1e293b',
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#22c55e',
        danger: '#ef4444'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(99, 102, 241, 0.28)'
      }
    }
  },
  plugins: []
};
