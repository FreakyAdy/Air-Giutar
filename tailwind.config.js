/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      colors: {
        rock: {
          dark: '#0a0a0f',
          panel: '#12121a',
          accent: '#e63946',
          glow: '#ff6b6b',
        },
      },
      animation: {
        'chord-flash': 'chordFlash 0.4s ease-out',
      },
      keyframes: {
        chordFlash: {
          '0%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
