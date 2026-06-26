/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        bazaar: {
          bg: '#F7F5F0',
          bg2: '#EEEAE0',
          bg3: '#E3DDD0',
          white: '#FFFFFF',
          ink: '#1C1A14',
          ink2: '#4A4535',
          ink3: '#8A8170',
          gold: '#C8921A',
          'gold-l': '#FBF0D8',
          'gold-m': '#E8B84B',
          green: '#1A7A4A',
          'green-l': '#DFF2E9',
          red: '#C0392B',
          'red-l': '#FDECEA',
          blue: '#1A5CA8',
          'blue-l': '#DEE9F7',
          purple: '#6B3FA0',
          'purple-l': '#EDE4F8',
          orange: '#D4580A',
          'orange-l': '#FDEEDD',
          border: '#D8D3C5',
          border2: '#C5BFB0',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(28,26,20,.07), 0 4px 12px rgba(28,26,20,.05)',
        card: '0 4px 16px rgba(28,26,20,.10), 0 1px 4px rgba(28,26,20,.06)',
      },
    },
  },
  plugins: [],
};