/** Tailwind config for the compiled stylesheet (replaces the Play CDN). */
export default {
  content: ['./public/index.html', './scripts/page-solutions.html', './scripts/page-students.html'],
  theme: {
    extend: {
      colors: {
        ink: '#0A1020',
        ink2: '#121B33',
        brand: {
          blue: '#2F6BFF',
          sky: '#6E9BFF',
          violet: '#6E9BFF',
          cyan: '#6E9BFF'
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
