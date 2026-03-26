/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#E8DDD0',
        surface: '#FDF9F4',
        border: '#E8DDD0',
        muted: '#9E8E80',
        accent: '#C4714A',
        text: '#2C2420',
        'category-kids': '#8BA888',
        'category-health': '#7BA5C8',
        'category-family': '#C4714A',
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
