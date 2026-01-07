/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF0000', // YouTube Red
          hover: '#CC0000',
        },
        background: {
          DEFAULT: '#0F0F0F', // Main Background
          secondary: '#1E1E1E', // Card/Sidebar Background
          hover: '#272727', // Hover state
        },
        text: {
          primary: '#F1F1F1', // High emphasis
          secondary: '#AAAAAA', // Medium emphasis
          muted: '#717171', // Low emphasis
        },
        border: {
          DEFAULT: '#303030', // Border color
        }
      }
    },
  },
  plugins: [],
}