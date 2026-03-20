/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg:       '#0A0A1A',
          surface:  '#12122A',
          card:     '#1A1A35',
          border:   '#2A2A50',
          muted:    '#6B6B9A',
        },
        stellar: {
          lavender: '#E8C5FF',
          amber:    '#FFB347',
          mint:     '#7EE8D0',
          rose:     '#FFB3C6',
          blue:     '#93C5FD',
        },
        sign: {
          fire:    '#FF6B4A',
          earth:   '#7EC98F',
          air:     '#93C5FD',
          water:   '#9B8FFF',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cosmos-gradient': 'radial-gradient(ellipse at 20% 50%, #1a0a2e 0%, #0A0A1A 50%, #0a1628 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(26,26,53,0.9) 0%, rgba(18,18,42,0.95) 100%)',
        'glow-lavender':   'radial-gradient(circle, rgba(232,197,255,0.15) 0%, transparent 70%)',
        'glow-amber':      'radial-gradient(circle, rgba(255,179,71,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm':   '0 0 15px rgba(232,197,255,0.2)',
        'glow-md':   '0 0 30px rgba(232,197,255,0.25)',
        'glow-amber':'0 0 20px rgba(255,179,71,0.3)',
        'card':      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'twinkle':     'twinkle 4s ease-in-out infinite',
        'spin-slow':   'spin 20s linear infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow:  { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        slideUp:    { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        twinkle:    { '0%,100%': { opacity: '0.2', transform: 'scale(0.8)' }, '50%': { opacity: '1', transform: 'scale(1.2)' } },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
