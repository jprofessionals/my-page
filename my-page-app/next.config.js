/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  output: 'standalone',

  // Enable TypeScript and ESLint checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  async rewrites() {
    // Use API_URL env var in production (Railway), localhost in development
    const apiUrl = process.env.API_URL || 'http://localhost:8080'
    return [
      {
        source: '/api/:slug*',
        destination: `${apiUrl}/api/:slug*`,
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cvpartner-images.s3.eu-west-1.amazonaws.com',
      },
    ],
  },
}

export default nextConfig
