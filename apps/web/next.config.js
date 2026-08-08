/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses with gzip/brotli
  compress: true,

  // Allow Cloudinary images in next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;