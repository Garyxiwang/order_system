"use client";

import React, { useEffect } from "react";
import { Menu, Tooltip } from "antd";
import {
  FileOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logger from "@/utils/logger";

interface SideMenuProps {
  collapsed?: boolean;
}

// 使用统一的日志工具

const SideMenu: React.FC<SideMenuProps> = ({ collapsed = false }) => {
  const pathname = usePathname();

  // 监听路径变化并打印日志
  useEffect(() => {
    try {
      logger.navigation(pathname);
    } catch (error) {
      console.log(`[导航日志] 页面已跳转到: ${pathname}`);
    }
  }, [pathname]);
  
  // 组件挂载时记录日志
  useEffect(() => {
    try {
      logger.system('侧边菜单组件已加载');
    } catch (error) {
      console.log(`[系统信息] 侧边菜单组件已加载`);
    }
  }, []);

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (pathname.startsWith("/design")) return ["design"];
    if (pathname.startsWith("/split")) return ["split"];
    if (pathname.startsWith("/production")) return ["production"];
    if (pathname.startsWith("/config")) return ["config"];
    return [];
  };

  // 处理菜单项点击
  const handleMenuClick = (path: string, label: string) => {
    try {
      logger.menuClick(label, path);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      console.log(`[菜单点击] 用户点击了 ${label}，跳转到 ${path}`);
    }
  };

  const menuItems = [
    {
      key: "design",
      icon: collapsed ? (
        <Tooltip title="设计管理" placement="right">
          <Link href="/design" onClick={() => handleMenuClick("/design", "设计管理")}>
            <FileOutlined className="text-blue-600" />
          </Link>
        </Tooltip>
      ) : (
        <FileOutlined className="text-blue-600" />
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
    {
      key: "split",
      icon: collapsed ? (
        <Tooltip title="拆单管理" placement="right">
          <Link href="/split" onClick={() => handleMenuClick("/split", "拆单管理")}>
            <ShoppingCartOutlined className="text-blue-600" />
          </Link>
        </Tooltip>
      ) : (
        <ShoppingCartOutlined className="text-blue-600" />
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
    {
      key: "production",
      icon: collapsed ? (
        <Tooltip title="生产管理" placement="right">
          <Link href="/production" onClick={() => handleMenuClick("/production", "生产管理")}>
            <ToolOutlined className="text-blue-600" />
          </Link>
        </Tooltip>
      ) : (
        <ToolOutlined className="text-blue-600" />
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
    {
      key: "config",
      icon: collapsed ? (
        <Tooltip title="系统配置" placement="right">
          <Link href="/config" onClick={() => handleMenuClick("/config", "系统配置")}>
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
