import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  
  try {
    // 记录请求开始 - 使用console.log确保在任何环境都能工作
    console.log(`[INFO] ${method} ${pathname}${search} - 请求开始`);
    
    // 如果访问根路径，重定向到登录页面
    if (pathname === '/') {
      console.log(`[INFO] 将根路径重定向到登录页面`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // 继续处理请求
    const response = NextResponse.next();
    
    // 计算请求处理时间
    const duration = Date.now() - startTime;
    
    // 记录请求结束 - 使用console.log确保在任何环境都能工作
    console.log(`[INFO] ${method} ${pathname}${search} - 请求结束 (${duration}ms)`);
    
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[ERROR] 中间件处理请求时出错: ${errorMessage}`);
    return NextResponse.next();
  }
}

// 配置中间件应用的路径
export const config = {
  // 匹配所有路径，确保所有请求都经过中间件处理
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};