/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // swcMinify is now enabled by default in Next.js 15
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure CSS is properly generated
  experimental: {
    optimizeCss: true,
  }
};

module.exports = nextConfig;