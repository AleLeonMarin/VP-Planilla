import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      '@fullcalendar/core',
      '@fullcalendar/react',
      'framer-motion',
    ],
  },
};

export default nextConfig;
