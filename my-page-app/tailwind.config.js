/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    // New app directory layout:
    // './app/**/*.{js,ts,jsx,tsx,mdx}',
    // './pages/**/*.{js,ts,jsx,tsx,mdx}',
    // './components/**/*.{js,ts,jsx,tsx,mdx}',

    // Or if using `src` directory:
    './src/**/*.tsx',
  ],
  theme: {
    data: {
      open: 'state~="open"',
      closed: 'state~="closed"',
    },
    extend: {
      boxShadow: {
        'y-2': '0 -3px 0px 0 #333, 0 3px 0px 0px #333',
      },
      colors: {
        orange: {
          brand: '#ff7a0c',
          hover: '#ffa500',
          light: '#ffbd8d',
          dark: '#d16512',
        },
        black: {
          DEFAULT: '#000000',
          nav: '#2c2c2c',
        },
        green: {
          brand: '#2f4f4f',
          success: '#3c5c5c',
        },
        blue: {
          'small-appartment': '#2B809B',
        },
        red: {
          'not-available': '#FC1E1E',
        },
        teal: {
          annex: '#5BCEAE',
        },
        yellow: {
          hotel: '#F6B26B',
        },
      },
      backgroundImage: {
        pattern: "url('/images/linjert-l.png')",
      },
    },
    keyframes: {
      'accordion-down': {
        from: { height: 0 },
        to: { height: 'var(--radix-accordion-content-height)' },
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: 0 },
      },
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    },
    animation: {
      spin: 'spin 1s linear infinite',
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
    textTransform: {
      'normal-case': 'none',
    },
  },
  daisyui: {
    themes: [
      {
        jpro: {
          primary: '#ff7a0c',
          secondary: '#ffa500',
          warning: '#d16512',
          accent: '#2f4f4f',
          neutral: '#2c2c2c',
          'base-100': '#ffffff',
          error: '#DC2626',
        },
      },
      'light',
    ],
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
}
