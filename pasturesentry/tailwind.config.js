/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        comic: {
          yellow: '#FFE600',
          yellowHover: '#FFD000',
          red: '#FF3B30',
          redDark: '#D90429',
          green: '#00D26A',
          blue: '#00A3FF',
          cream: '#F4EEDD',
          creamDark: '#EBE5D5',
          card: '#FFFFFF',
          dark: '#141414',
          gray: '#E2DEC9',
        }
      },
      fontFamily: {
        comic: ['Bungee', 'Impact', 'sans-serif'],
        display: ['"Space Grotesk"', 'Impact', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'comic': '6px 6px 0px #000000',
        'comic-sm': '4px 4px 0px #000000',
        'comic-lg': '8px 8px 0px #000000',
        'comic-xl': '12px 12px 0px #000000',
        'comic-yellow': '6px 6px 0px #FFE600',
        'comic-red': '6px 6px 0px #FF3B30',
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
      },
      animation: {
        'bounce-slight': 'bounceSlight 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        bounceSlight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
