import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-sans-jp)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f3eeff',
          100: '#e4d9ff',
          200: '#ccb8ff',
          300: '#ae8cff',
          400: '#9055ff',
          500: '#7420ff',
          600: '#5200cc',
          700: '#4400aa',
          800: '#380088',
          900: '#2d006e',
        },
        surface: {
          light: '#f7f5f8',
          dark: '#170f23',
          elevated: '#1e1529',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        elevated: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        'card-lift': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        '.card': {
          '@apply rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-700/60 dark:bg-surface-elevated': {},
        },
        '.card-interactive': {
          '@apply rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-200 hover:shadow-card-lift hover:border-gray-300 hover:-translate-y-1 dark:border-gray-700/60 dark:bg-surface-elevated dark:hover:border-gray-600': {},
        },
        '.btn-primary': {
          '@apply inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-600/20 transition-all duration-150 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-secondary': {
          '@apply inline-flex items-center justify-center rounded-lg border border-primary-600/20 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed dark:border-primary-600/20 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700': {},
        },
        '.btn-ghost': {
          '@apply inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100 active:scale-[0.98] dark:text-gray-400 dark:hover:bg-gray-800': {},
        },
        '.badge': {
          '@apply inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium': {},
        },
      });
    }),
  ],
};

export default config;
