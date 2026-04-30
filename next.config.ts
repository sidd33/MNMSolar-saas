import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion', 
      '@radix-ui/react-icons',
      'date-fns',
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  }
};

export default nextConfig;
