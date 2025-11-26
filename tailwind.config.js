/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      default: {
        50: 'var(--default-50)',
        100: 'var(--default-100)',
        200: 'var(--default-200)',
        300: 'var(--default-300)',
        400: 'var(--default-400)',
        500: 'var(--default-500)',
        600: 'var(--default-600)',
        700: 'var(--default-700)',
        800: 'var(--default-800)',
        900: 'var(--default-900)',
      },
      warning: {
        50: 'var(--warning-50)',
        100: 'var(--warning-100)',
        200: 'var(--warning-200)',
        300: 'var(--warning-300)',
        400: 'var(--warning-400)',
        500: 'var(--warning-500)',
        600: 'var(--warning-600)',
        700: 'var(--warning-700)',
        800: 'var(--warning-800)',
        900: 'var(--warning-900)',
      },
      danger: {
        50: 'var(--danger-50)',
        100: 'var(--danger-100)',
        200: 'var(--danger-200)',
        300: 'var(--danger-300)',
        400: 'var(--danger-400)',
        500: 'var(--danger-500)',
        600: 'var(--danger-600)',
        700: 'var(--danger-700)',
        800: 'var(--danger-800)',
        900: 'var(--danger-900)',
      }
    },
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}

