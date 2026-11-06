/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F3E9DC',
        surface: '#FBF6EE',
        border: '#3B2A22',
        muted: '#3B2A22',
        accent: '#3B2A22',
        highlight: '#F2C4BF',
        text: '#3B2A22',
        'category-kids': '#8BA888',
        'category-health': '#7BA5C8',
        'category-family': '#3B2A22',
        'category-errands': '#D4A574',
        'category-me': '#B8A3C8',
        'category-ideas': '#A6968A',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        ui: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
