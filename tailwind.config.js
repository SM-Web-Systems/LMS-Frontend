/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SM Web Systems brand (smwebsystems.com)
        primary: {
          DEFAULT: '#3d7a8c',
          dark: '#1b3a4b',
          medium: '#2d5a6b',
          light: '#4a7c8c',
          50: '#f0f9fb',
          100: '#e0f2f4',
          200: '#bae4e8',
          300: '#7dced8',
          400: '#4a9ca8',
          500: '#3d7a8c',
          600: '#3d7a8c',
          700: '#2d6a7c',
          800: '#1b3a4b',
          900: '#0f1a1f',
        },
        accent: {
          teal: '#3d7a8c',
          'teal-hover': '#2d6a7c',
        },
        neutral: {
          50: '#f8fafb',
          100: '#f1f5f7',
          200: '#e5eaed',
          300: '#d1d9dd',
          400: '#9ba8ae',
          500: '#6b7b82',
          600: '#4a5a62',
          700: '#374952',
          800: '#1f2e35',
          900: '#0f1a1f',
        },
        // Alias gray to neutral for brand consistency (optional use)
        gray: {
          50: '#f8fafb',
          100: '#f1f5f7',
          200: '#e5eaed',
          300: '#d1d9dd',
          400: '#9ba8ae',
          500: '#6b7b82',
          600: '#4a5a62',
          700: '#374952',
          800: '#1f2e35',
          900: '#0f1a1f',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.06)',
        /** Course-platform depth (Updraft-style cards) */
        'updraft': '0 4px 24px rgb(15 26 31 / 0.06), 0 1px 3px rgb(15 26 31 / 0.04)',
        'updraft-hover': '0 12px 40px rgb(15 26 31 / 0.1), 0 4px 12px rgb(15 26 31 / 0.06)',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgb(15 26 31 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 26 31 / 0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
    },
  },
  plugins: [],
}

