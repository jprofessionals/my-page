/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',

  async rewrites() {
    return [
      {
        source: '/api/:slug*',
        destination: `http://localhost:8080/api/:slug*`,
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
