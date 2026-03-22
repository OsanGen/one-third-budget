import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,js,jsx}', './components/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        whiteTone: 'var(--white)',
        fog: 'var(--fog)',
        ink: 'var(--ink)',
        'cog-blue': 'var(--cog-blue)',
        'cog-mint': 'var(--cog-mint)',
        'cog-yellow': 'var(--cog-yellow)',
        'cog-pink': 'var(--cog-pink)',
        'cog-accent': 'var(--cog-accent)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.5rem',
      },
      boxShadow: {
        fog: '0 16px 32px rgba(18, 28, 44, 0.07)',
      },
      spacing: {
        2.5: '0.625rem',
        4: '1rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
      },
      keyframes: {
        none: {
          '0%': { opacity: '1' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
