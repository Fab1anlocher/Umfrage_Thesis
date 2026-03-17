import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#0071E3',
          gray: '#6E6E73',
          lightgray: '#E8E8ED',
          bg: '#F5F5F7',
          text: '#1D1D1F',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
