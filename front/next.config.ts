import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Zeabur 部署配置
  // 在构建时禁用rewrites，避免构建过程中访问外部URL
  async rewrites() {
    // 只在开发环境启用rewrites
    if (process.env.NODE_ENV === 'production') {
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
