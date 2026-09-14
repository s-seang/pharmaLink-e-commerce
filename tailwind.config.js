/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2B5C8A',
          deep: '#1F4466',
          tint: '#EAF1F7',
        },
        teal: {
          DEFAULT: '#4A9A96',
          tint: '#E4F0EF',
        },
        ink: '#1F2937',
        muted: '#8A93A0',
        line: '#E0E6EC',
        surface: '#F7F9FB',
        sale: '#C2410C',
        star: '#EF9F27',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        script: ['"Dancing Script"', 'cursive'],
      },
      borderRadius: {
        card: '12px',
      },
      maxWidth: {
        app: '1120px',
      },
    },
  },
  plugins: [],
}
