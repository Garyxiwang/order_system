"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Result, Button, Spin } from "antd";
import { PermissionService, PageModule } from "@/utils/permissions";
import AuthService from "@/services/authService";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredModule?: PageModule;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredModule,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      // 检查用户是否已登录
      const userInfo = AuthService.getUserInfo();
      if (!userInfo) {
        router.push("/login");
        return;
      }

      // 如果没有指定需要的模块权限，则允许访问
      if (!requiredModule) {
        setHasPermission(true);
        setIsLoading(false);
        return;
      }

      // 检查用户是否有权限访问指定模块
      const hasModulePermission =
        PermissionService.hasModulePermission(requiredModule);

      setHasPermission(hasModulePermission);

      setIsLoading(false);
    };

    checkPermission();

    // 监听用户信息更新事件
    const handleUserInfoUpdate = () => {
      checkPermission();
    };

    window.addEventListener("userInfoUpdated", handleUserInfoUpdate);

    return () => {
      window.removeEventListener("userInfoUpdated", handleUserInfoUpdate);
    };
  }, [requiredModule, router, pathname]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // 如果没有权限，显示无权限页面
  if (!hasPermission) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。"
          extra={
            <Button type="primary" onClick={() => router.push("/")}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  // 有权限，渲染子组件
  return <>{children}</>;
};

export default RouteGuard;
