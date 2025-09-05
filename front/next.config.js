/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nginx 代理部署配置
  // 在生产环境下，API 请求将通过 Nginx 代理到后端服务
  // 在开发环境下，直接代理到本地后端服务
  async rewrites() {
    // 生产环境下不需要 rewrites，由 Nginx 处理代理
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // 开发环境下代理到本地后端服务
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
  
  // 优化配置
  experimental: {
    // optimizeCss: true, // 暂时禁用，避免 critters 依赖问题
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;