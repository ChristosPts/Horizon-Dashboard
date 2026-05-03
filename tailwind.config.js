/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,jsx}',
    './src/index.html',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          purple: '#8B5CF6',
          blue: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
