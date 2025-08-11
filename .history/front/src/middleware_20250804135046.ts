import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 获取当前路径
  const path = request.nextUrl.pathname;
  
  // 如果访问根路径，重定向到登录页面
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 其他路径正常处理
  return NextResponse.next();
}

// 配置中间件应用的路径
export const config = {
  matcher: ['/']
};
