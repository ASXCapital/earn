/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  images: {
    unoptimized: true
  },
};

export default nextConfig;