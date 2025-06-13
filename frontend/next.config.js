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
        source: '/castingfit',
        destination: '/castingfit',
        permanent: true,
      },
      {
        source: '/Profiler',
        destination: '/profiler',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 