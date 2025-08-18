"use client";

import React from "react";
import { Menu, Tooltip } from "antd";
import {
  FileOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  DashboardOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SideMenuProps {
  collapsed?: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({ collapsed = false }) => {
  const pathname = usePathname();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (pathname.startsWith("/design")) return ["design"];
    if (pathname.startsWith("/split")) return ["split"];
    if (pathname.startsWith("/production")) return ["production"];
    if (pathname.startsWith("/config")) return ["config"];
    return [];
  };

  const menuItems = [
    {
      key: "design",
      icon: collapsed ? (
        <Tooltip title="设计管理" placement="right">
          <Link href="/design">
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
        >
          设计管理
        </Link>
      ) : null,
    },
    {
      key: "split",
      icon: collapsed ? (
        <Tooltip title="拆单管理" placement="right">
          <Link href="/split">
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
        >
          拆单管理
        </Link>
      ) : null,
    },
    {
      key: "production",
      icon: collapsed ? (
        <Tooltip title="生产管理" placement="right">
          <Link href="/production">
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
        >
          生产管理
        </Link>
      ) : null,
    },
    {
      key: "config",
      icon: collapsed ? (
        <Tooltip title="系统配置" placement="right">
          <Link href="/config">
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
