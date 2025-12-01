"use client";

import React, { useEffect, useState } from "react";
import { Menu, Tooltip } from "antd";
import {
  CreditCardOutlined,
  LaptopOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logger from "@/utils/logger";
import PermissionService, { PageModule } from "@/utils/permissions";

interface SideMenuProps {
  collapsed?: boolean;
}

// 使用统一的日志工具

const SideMenu: React.FC<SideMenuProps> = ({ collapsed = false }) => {
  const pathname = usePathname();
  const [accessibleModules, setAccessibleModules] = useState<PageModule[]>([]);

  // 监听路径变化并打印日志
  useEffect(() => {
    try {
      logger.navigation(pathname);
    } catch {
      console.log(`[导航日志] 页面已跳转到: ${pathname}`);
    }
  }, [pathname]);

  // 组件挂载时记录日志和获取用户权限
  useEffect(() => {
    try {
      logger.system("侧边菜单组件已加载");
    } catch {
      console.log(`[系统信息] 侧边菜单组件已加载`);
    }

    // 获取用户可访问的模块
    const modules = PermissionService.getAccessibleModules();
    setAccessibleModules(modules);
  }, []);

  // 监听用户信息更新事件
  useEffect(() => {
    const handleUserInfoUpdate = () => {
      const modules = PermissionService.getAccessibleModules();
      setAccessibleModules(modules);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("userInfoUpdated", handleUserInfoUpdate);
      return () => {
        window.removeEventListener("userInfoUpdated", handleUserInfoUpdate);
      };
    }
  }, []);

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (pathname.startsWith("/design")) return ["design"];
    if (pathname.startsWith("/split")) return ["split"];
    if (pathname.startsWith("/production")) return ["production"];
    if (pathname.startsWith("/config")) return ["config"];
    if (pathname.startsWith("/quotation-config")) return ["quotation-config"];
    if (pathname.startsWith("/after-sales")) return ["after-sales"];
    return [];
  };

  // 处理菜单项点击
  const handleMenuClick = (path: string, label: string) => {
    try {
      logger.menuClick(label, path);
    } catch {
      console.log(`[菜单点击] 用户点击了 ${label}，跳转到 ${path}`);
    }
  };

  // 检查用户是否有权限访问指定模块
  const hasPermission = (module: PageModule): boolean => {
    return accessibleModules.includes(module);
  };

  const menuItems = [
    // 设计管理
    ...(hasPermission(PageModule.DESIGN)
      ? [
          {
            key: "design",
            icon: collapsed ? (
              <Tooltip title="设计管理" placement="right">
                <Link
                  href="/design"
                  onClick={() => handleMenuClick("/design", "设计管理")}
                >
                  <LaptopOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <LaptopOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/design"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/design", "设计管理")}
              >
                设计管理
              </Link>
            ) : null,
          },
        ]
      : []),
    // 拆单管理
    ...(hasPermission(PageModule.SPLIT)
      ? [
          {
            key: "split",
            icon: collapsed ? (
              <Tooltip title="拆单管理" placement="right">
                <Link
                  href="/split"
                  onClick={() => handleMenuClick("/split", "拆单管理")}
                >
                  <CreditCardOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <CreditCardOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/split"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/split", "拆单管理")}
              >
                拆单管理
              </Link>
            ) : null,
          },
        ]
      : []),
    // 生产管理
    ...(hasPermission(PageModule.PRODUCTION)
      ? [
          {
            key: "production",
            icon: collapsed ? (
              <Tooltip title="生产管理" placement="right">
                <Link
                  href="/production"
                  onClick={() => handleMenuClick("/production", "生产管理")}
                >
                  <ShopOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <ShopOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/production"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/production", "生产管理")}
              >
                生产管理
              </Link>
            ) : null,
          },
        ]
      : []),
    // 安装管理
    ...(hasPermission(PageModule.AFTER_SALES)
      ? [
          {
            key: "after-sales",
            icon: collapsed ? (
              <Tooltip title="安装管理" placement="right">
                <Link
                  href="/after-sales"
                  onClick={() => handleMenuClick("/after-sales", "安装管理")}
                >
                  <CustomerServiceOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <CustomerServiceOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/after-sales"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/after-sales", "安装管理")}
              >
                安装管理
              </Link>
            ) : null,
          },
        ]
      : []),
    // 系统配置
    ...(hasPermission(PageModule.CONFIG)
      ? [
          {
            key: "config",
            icon: collapsed ? (
              <Tooltip title="系统配置" placement="right">
                <Link
                  href="/config"
                  onClick={() => handleMenuClick("/config", "系统配置")}
                >
                  <SettingOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <SettingOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/config"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/config", "系统配置")}
              >
                系统配置
              </Link>
            ) : null,
          },
        ]
      : []),
    // 报价管理
    ...(hasPermission(PageModule.QUOTATION)
      ? [
          {
            key: "quotation-config",
            icon: collapsed ? (
              <Tooltip title="报价配置" placement="right">
                <Link
                  href="/quotation-config"
                  onClick={() =>
                    handleMenuClick("/quotation-config", "报价配置")
                  }
                >
                  <ShoppingCartOutlined className="text-blue-600" />
                </Link>
              </Tooltip>
            ) : (
              <ShoppingCartOutlined className="text-blue-600" />
            ),
            label: !collapsed ? (
              <Link
                href="/quotation-config"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => handleMenuClick("/quotation-config", "报价配置")}
              >
                报价配置
              </Link>
            ) : null,
          },
        ]
      : []),
  ];

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={getSelectedKey()}
      items={menuItems}
      className="border-r-0 bg-transparent"
      style={{ fontSize: "15px" }}
    />
  );
};

export default SideMenu;
