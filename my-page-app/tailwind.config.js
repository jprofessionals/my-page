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
    extend: {
      colors: {
        orange: {
          brand: '#ff7a0c',
          hover: '#ffa500',
          light: '#ffbd8d',
          dark: '#d16512',
        },
        black: {
          nav: '#2c2c2c',
        },
        green: {
          brand: '#2f4f4f',
          success: '#3c5c5c',
        },
      },
    },
  },
  plugins: [],
}
