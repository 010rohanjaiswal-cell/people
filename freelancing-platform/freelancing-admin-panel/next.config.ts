import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix for multiple lockfiles warning
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://freelancer-backend-jv21.onrender.com/api/:path*',
      },
    ];
  },
  // Remove deprecated turbo config
  // experimental: {
  //   turbo: {
  //     rules: {
  //       '*.svg': {
  //         loaders: ['@svgr/webpack'],
  //         as: '*.js',
  //       },
  //     },
  //   },
  // },
};

export default nextConfig;
