/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'vercel.app', 'vercel-production.up.railway.app'],
  },
  // Add trailing slash to prevent 404s
  trailingSlash: true,
  // Ensure proper page routing
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Enable static optimization
  output: 'standalone',
  // Enable compression
  compress: true,
  // Production source maps
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig 