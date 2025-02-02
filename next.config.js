/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Change from 'export' to 'standalone'
  images: { unoptimized: true },
  experimental: {
    serverActions: true, // Ensure server actions work properly
  },
}

module.exports = nextConfig;
