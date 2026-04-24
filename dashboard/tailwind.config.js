/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'waste-green': {
          DEFAULT: '#3B6D11',
          light: '#EAF3DE',
          mid: '#639922',
        },
        'waste-teal': {
          DEFAULT: '#0F6E56',
          light: '#E1F5EE',
          mid: '#1D9E75',
        },
        'waste-amber': {
          DEFAULT: '#BA7517',
          light: '#FAEEDA',
          mid: '#EF9F27',
        },
        'waste-coral': {
          DEFAULT: '#993C1D',
          light: '#FAECE7',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        wastebank: {
          "primary": "#3B6D11",
          "secondary": "#BA7517",
          "accent": "#0F6E56",
          "neutral": "#1a1a1a",
          "base-100": "#f8faf6",
          "info": "#1D9E75",
          "success": "#639922",
          "warning": "#EF9F27",
          "error": "#993C1D",
        },
      },
    ],
  },
}
