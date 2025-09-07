"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import AuthService from '../../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 不需要认证的页面路径
  const publicPaths = ['/login'];

  useEffect(() => {
    const checkAuth = () => {
      // 如果是公开页面，直接允许访问
      if (publicPaths.includes(pathname)) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // 检查用户是否已登录
      const userInfo = AuthService.getUserInfo();
      if (userInfo) {
        setIsAuthenticated(true);
      } else {
        // 未登录，跳转到登录页
        router.push('/login');
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" spinning={true} tip="验证登录状态...">
          <div style={{ minHeight: 200 }} />
        </Spin>
      </div>
    );
  }

  // 如果未认证且不是公开页面，不渲染内容
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;