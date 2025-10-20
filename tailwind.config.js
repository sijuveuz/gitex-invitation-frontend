/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        sidebar: 'var(--sidebar-bg)',
        success: 'var(--success-color)',
        info: 'var(--info-color)',
        warning: 'var(--warning-color)',
      }, 
    },
  },
  plugins: [],
};