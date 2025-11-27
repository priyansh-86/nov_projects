/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- Yahan change kiya hai
    autoprefixer: {},
  },
};

export default config;