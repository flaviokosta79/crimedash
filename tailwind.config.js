/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
        'opensans': ['Open Sans', 'sans-serif'],
      },
      colors: {
        'bpm-10': '#1f77b4',
        'bpm-28': '#ff7f0e',
        'bpm-33': '#2ca02c',
        'bpm-37': '#d62728',
        'cipm-2': '#9467bd',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
