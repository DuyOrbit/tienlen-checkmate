/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070a12',
          card: '#0f172a',
          panel: 'rgba(15, 23, 42, 0.85)',
          border: '#1e293b',
          glow: '#00f0ff',
        },
        neon: {
          cyan: '#00f0ff',
          pink: '#ff007f',
          gold: '#ffb703',
          emerald: '#10b981',
          purple: '#8b5cf6',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-gold': '0 0 15px rgba(255, 183, 3, 0.6), 0 0 30px rgba(255, 183, 3, 0.3)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.5), 0 0 30px rgba(255, 0, 127, 0.2)',
      },
    },
  },
  plugins: [],
};

