/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  async redirects() {
    return [
      {
        source: '/TalentProfiler',
        destination: '/talentprofiler',
        permanent: true,
      },
      {
        source: '/Profiler',
        destination: '/talentprofiler',
        permanent: true,
      },
    ];
  },
  // Add trailing slash to prevent 404s
  trailingSlash: true,
  // Ensure proper page routing
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig 