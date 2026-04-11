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
        },
        gold: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf0c4',
          300: '#fce49c',
          400: '#f9d05c',
          500: '#f5b827',
          600: '#d99b1b'
        }
      },
      boxShadow: {
        glow: '0 20px 40px -12px rgba(34,120,214,0.45)',
        card: '0 20px 45px -18px rgba(9, 30, 66, 0.18)',
        'glow-brand': '0 0 25px -5px rgba(34,120,214,0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16,185,129,0.3)',
        'glow-gold': '0 0 30px -5px rgba(245,184,39,0.35)',
        'card-hover': '0 25px 50px -12px rgba(9, 30, 66, 0.25)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.1)'
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgba(34,120,214,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(16,185,129,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(245,184,39,0.08) 0px, transparent 50%)'
      },
      backgroundSize: {
        grid: '28px 28px'
      },
      animation: {
        rise: 'rise 700ms ease forwards',
        drift: 'drift 5s ease-in-out infinite',
        slide: 'slide 26s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-down': 'slideDown 0.35s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite'
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
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(1deg)' },
          '66%': { transform: 'translateY(4px) rotate(-1deg)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      }
    }
  },
  plugins: []
};
