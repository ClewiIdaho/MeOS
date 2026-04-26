import type { Config } from 'tailwindcss';

/**
 * MY.OS design tokens.
 * Premium, dark, glassy. 2027 not 2020.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base canvas — deep midnight indigo, never pure black
        base: '#0A0918',
        surface: '#13112A',
        'surface-elevated': '#1C1A38',
        'border-subtle': 'rgba(42, 39, 80, 0.4)',

        // Text
        'text-primary': '#F4F1FF',
        'text-secondary': '#A8A3CC',
        'text-muted': '#6B6890',

        // Accents
        accent: {
          DEFAULT: '#8B5CF6',
          50: '#F3EEFF',
          100: '#E5DAFF',
          200: '#CCB6FF',
          300: '#B190FF',
          400: '#9C75F8',
          500: '#8B5CF6',
          600: '#7340E0',
          700: '#5A2EB8',
          800: '#421F8A',
          900: '#2A1364',
        },

        // Reserved (level-ups, XP gains, goal completions only)
        reserved: '#F59E0B',

        success: '#10D9A0',
        warning: '#FFB547',
        danger: '#FF6B8A',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Geist Variable"', 'Geist', '"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', '"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        display: '-0.02em',
        tighter: '-0.025em',
      },
      borderRadius: {
        card: '20px',
        sheet: '28px',
        pill: '14px',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(139, 92, 246, 0.45)',
        'glow-lg': '0 10px 60px -15px rgba(139, 92, 246, 0.55)',
        card: '0 8px 32px -12px rgba(10, 9, 24, 0.8), 0 2px 12px -4px rgba(139, 92, 246, 0.18)',
        'reserved-glow': '0 0 40px -10px rgba(245, 158, 11, 0.55)',
        nav: '0 -8px 32px -12px rgba(10, 9, 24, 0.6), 0 0 0 1px rgba(42, 39, 80, 0.4)',
      },
      backgroundImage: {
        'card-grad': 'linear-gradient(140deg, rgba(28, 26, 56, 0.85) 0%, rgba(19, 17, 42, 0.92) 100%)',
        'accent-grad': 'linear-gradient(135deg, #8B5CF6 0%, #5A2EB8 100%)',
        'reserved-grad': 'linear-gradient(135deg, #FFD27F 0%, #F59E0B 100%)',
        'hero-glow': 'radial-gradient(60% 60% at 50% 0%, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
