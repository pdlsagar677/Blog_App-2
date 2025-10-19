// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions with larger body size limit
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Increase API body size limit
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  // Image optimization domains
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'], // Add your domains
  },
  
  // ESLint and TypeScript config
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig