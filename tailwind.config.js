/** Tailwind config for the compiled stylesheet (replaces the Play CDN). */
export default {
  content: ['./public/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0F',
        ink2: '#0C0C14',
        brand: {
          blue: '#4F7CFF',
          violet: '#8B5CF6',
          cyan: '#22D3EE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
};
