/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          light: '#f5e6d3',
          DEFAULT: '#d4a574',
          dark: '#8b6914',
          warm: '#e8c491',
        },
        ocean: {
          light: '#87ceeb',
          DEFAULT: '#1e90ff',
          dark: '#0047ab',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'sand-fall': 'sandFall linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'grain-drift': 'grainDrift linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sandFall: {
          '0%': { transform: 'translateY(-10%) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(360deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        grainDrift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -15px) rotate(90deg)' },
          '50%': { transform: 'translate(-5px, -25px) rotate(180deg)' },
          '75%': { transform: 'translate(15px, -10px) rotate(270deg)' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)' },
        },
      },
      backgroundImage: {
        'sand-gradient': 'linear-gradient(135deg, #d4a574 0%, #e8c491 50%, #f5e6d3 100%)',
        'ocean-gradient': 'linear-gradient(135deg, #0047ab 0%, #1e90ff 50%, #87ceeb 100%)',
        'sand-ocean': 'linear-gradient(135deg, #d4a574 0%, #1e90ff 100%)',
      },
    },
  },
  plugins: [],
}
