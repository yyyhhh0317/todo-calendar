/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 品牌主色 - CSS 变量驱动（tokens.css 定义），支持设置面板换肤
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          50: 'rgb(var(--brand-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--brand-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--brand-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--brand-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--brand-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--brand-900-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: '#00b894',
          50: '#e6faf5',
          100: '#c4f2e6',
          200: '#8ee5cd',
          300: '#54d4b0',
          400: '#1ec193',
          500: '#00b894',
          600: '#00997a',
          700: '#007a61',
        },
        danger: {
          DEFAULT: '#d63031',
          50: '#fdeaea',
          100: '#fbd0d0',
          200: '#f6a3a3',
          300: '#ef7070',
          400: '#e84848',
          500: '#d63031',
          600: '#b8262a',
          700: '#961f23',
        },
        success: {
          DEFAULT: '#00a86b',
          50: '#e6f7ef',
          100: '#c4eddb',
          200: '#8edcb9',
          300: '#54c994',
          400: '#1eb676',
          500: '#00a86b',
          600: '#008a57',
          700: '#006c44',
        },
        star: {
          DEFAULT: '#f6b93b',
          50: '#fef5e6',
          100: '#fde6bd',
          200: '#fbd27f',
          300: '#f9bd3f',
          400: '#f6b93b',
          500: '#e0a32a',
          600: '#b8831f',
        },
        ink: {
          DEFAULT: '#172033',
          muted: '#647086',
        },
        canvas: '#f7f5ff',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 24px 80px rgba(var(--brand-rgb), 0.10)',
        card: '0 10px 28px rgba(23, 32, 51, 0.06)',
        'card-hover': '0 16px 40px rgba(23, 32, 51, 0.10)',
        important: '0 12px 30px rgba(255, 118, 117, 0.18)',
        starred: '0 12px 30px rgba(246, 185, 59, 0.16)',
        task: '0 8px 18px rgba(var(--brand-rgb), 0.18)',
      },
      borderRadius: {
        '4xl': '28px',
        '3xl': '24px',
      },
      backdropBlur: {
        glass: '14px',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'drag-preview': 'drag-preview 0.18s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'drag-preview': {
          '0%': { opacity: '0.2', transform: 'scaleY(0.85)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
