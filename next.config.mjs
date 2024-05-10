/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  experimental: {
    images: {
      unoptimized: true
    }
  }
};

export default nextConfig;
