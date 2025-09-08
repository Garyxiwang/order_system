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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
          <Spin size="large" spinning={true} />
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">验证登录状态</h3>
            <p className="text-sm text-gray-500">正在为您准备系统...</p>
          </div>
        </div>
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