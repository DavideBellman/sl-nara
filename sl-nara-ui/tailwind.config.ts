import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"SF Mono"', 'Monaco', 'Menlo', 'monospace'],
      },
      colors: {
        transit: {
          bus: '#d71d24',
          'metro-green': '#148541',
          'metro-red': '#d71d24',
          'metro-blue': '#007db8',
          pendel: '#a25ea6',
          tram: '#f36e21',
          boat: '#00a0e3',
          'bus-dark': '#e24b4a',
          'metro-green-dark': '#1da86a',
          'metro-blue-dark': '#2b9ee0',
          'pendel-dark': '#c078c4',
          'tram-dark': '#f68e4e',
          'boat-dark': '#3bb6e8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
