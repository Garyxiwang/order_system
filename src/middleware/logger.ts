import { NextRequest, NextResponse } from 'next/server';
import logger, { LogLevel } from '@/utils/logger';

/**
 * 服务端日志中间件
 * 用于记录所有请求和响应的日志
 */
export async function loggerMiddleware(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { pathname, search } = request.nextUrl;
    const method = request.method;
    
    // 记录请求开始 - 使用console.log确保在任何环境都能工作
    console.log(`[INFO] ${method} ${pathname}${search} - 请求开始`);
    
    // 继续处理请求
    const response = NextResponse.next();
    
    // 计算请求处理时间
    const duration = Date.now() - startTime;
    
    // 记录请求结束 - 使用console.log确保在任何环境都能工作
    console.log(`[INFO] ${method} ${pathname}${search} - 请求结束 (${duration}ms)`);
    
    return response;
  } catch (error: any) {
    console.error(`[ERROR] 日志中间件处理请求时出错: ${error.message}`);
    return NextResponse.next();
  }
}