/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bee2fd',
          300: '#90d1fc',
          400: '#5bb7f9',
          500: '#3397f1',
          600: '#2278d6',
          700: '#1d61ad',
          800: '#1d538d',
          900: '#1d4775'
        },
        bark: {
          50: '#edf4ff',
          100: '#d8e6ff',
          200: '#b7d0ff',
          300: '#8db2f9',
          400: '#618fe8',
          500: '#426fcd',
          600: '#3158ad',
          700: '#274589',
          800: '#1e3467',
          900: '#142246'
        },
        accent: {
          50: '#fff5e8',
          100: '#ffe8cc',
          200: '#ffd39f',
          300: '#ffb86c',
          400: '#ff9737',
          500: '#f77916',
          600: '#db5f0c'
        },
        ink: {
          900: '#08132a',
          800: '#10213f'
        }
      },
      boxShadow: {
        glow: '0 20px 40px -12px rgba(34,120,214,0.45)',
        card: '0 20px 45px -18px rgba(9, 30, 66, 0.18)'
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '28px 28px'
      },
      animation: {
        rise: 'rise 700ms ease forwards',
        drift: 'drift 5s ease-in-out infinite',
        slide: 'slide 26s linear infinite'
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    }
  },
  plugins: []
};
