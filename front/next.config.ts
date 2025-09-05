import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 在构建时禁用rewrites，避免构建过程中访问外部URL
  async rewrites() {
    // 只在运行时启用rewrites，构建时跳过
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'https://orderendd.zeabur.app/:path*',
      },
    ];
  },
};

export default nextConfig;
