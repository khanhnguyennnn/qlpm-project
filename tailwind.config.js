/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        header: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', '-apple-system', 'BlinkMacSystemFont', '"San Francisco"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', '"SFMono-Regular"', 'ui-monospace', '"Geist Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c', // Primary Crimson Red
          700: '#9f1239',
          800: '#881337',
          900: '#4c0519',
          950: '#2b020c',
        },
        accent: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c', // Crimson
          700: '#9f1239',
          800: '#881337',
          900: '#4c0519',
          950: '#2b020c',
        },
        crimson: {
          light: '#fff1f2',
          DEFAULT: '#be123c',
          dark: '#881337',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
        'luxury': '0 10px 30px -5px rgba(180, 20, 30, 0.08), 0 4px 6px -2px rgba(180, 20, 30, 0.03)',
        'luxury-hover': '0 20px 40px -10px rgba(180, 20, 30, 0.16), 0 8px 16px -4px rgba(180, 20, 30, 0.06)',
        'glow-primary': '0 0 25px -5px rgba(190, 18, 60, 0.4)',
        'glass': '0 8px 32px 0 rgba(180, 20, 30, 0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
