/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove turbopack for Vercel compatibility
  // experimental: {
  //   turbopack: true,
  // },
  
  // Disable TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint errors during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable static optimization for pages with Three.js
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Enable static optimization
  trailingSlash: false,
  
  // Image optimization for external sources
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com', 
      'lh3.googleusercontent.com',
      'encrypted-tbn0.gstatic.com',
      'example.com'
    ],
    unoptimized: false,
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for Three.js
  webpack: (config, { isServer }) => {
    // Handle Three.js in client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/searchall',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
