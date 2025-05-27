import defaultTheme from 'tailwindcss/defaultTheme.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        assistant: ['Assistant', ...defaultTheme.fontFamily.sans],
        heebo: ['Heebo', ...defaultTheme.fontFamily.sans],
      },
    },
  },
};