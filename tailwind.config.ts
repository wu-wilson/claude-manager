import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#fafaf9',
          dark: '#0f0f0f',
        },
        accent: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
        },
        entity: {
          agent: '#7c3aed',
          skill: '#059669',
          hook: '#d97706',
          command: '#0284c7',
          claude: '#e11d48',
          settings: '#475569',
          memory: '#0891b2',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
};

export default config;
