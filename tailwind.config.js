/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rf: {
          bg: '#FFF3EA',
          ink: '#1A1A1A',
          muted: '#4A4A4A',
          white: '#FFFFFF',
          coral: '#FF5C5C',
          purple: '#A78BFA',
          teal: '#36CFC0',
          yellow: '#FFE066',
          orange: '#F59E5B',
          blue: '#3BA7D9',
          pink: '#FFC9C4',
        },
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', '"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        3: '3px',
        4: '4px',
      },
      boxShadow: {
        'hard-sm': '3px 3px 0 0 #1A1A1A',
        hard: '4px 4px 0 0 #1A1A1A',
        'hard-lg': '6px 6px 0 0 #1A1A1A',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '20px',
        panel: '40px',
      },
      maxWidth: {
        content: '1120px',
      },
    },
  },
  plugins: [],
};
