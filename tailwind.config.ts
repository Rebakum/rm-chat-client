import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['"Segoe UI"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f7fd',
          100: '#cceffb',
          200: '#99def7',
          300: '#66cef2',
          400: '#33bdee',
          500: '#00a3e0',
          600: '#008fc4',
          700: '#007ba8',
          800: '#00678c',
          900: '#005370',
        },
        accent: {
          50: '#f5faeb',
          100: '#ebf5d7',
          200: '#d7ecaf',
          300: '#c3e287',
          400: '#afd95f',
          500: '#8dc63f',
          600: '#76a832',
          700: '#5f8a25',
          800: '#486c19',
          900: '#314e0c',
        },
        rahmah: {
          blue: '#00A3E0',
          lime: '#8DC63F',
        },
        'text-main': '#1f2937',
      },
    },
  },
  plugins: [],
};

export default config;