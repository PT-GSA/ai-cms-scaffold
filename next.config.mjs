/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint checks in production
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks in production
  },
  
  // Image optimization
  images: {
    unoptimized: false, // Enable image optimization for production
    domains: [
      'localhost',
      '*.supabase.co',
      '*.supabase.in',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/cms',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
