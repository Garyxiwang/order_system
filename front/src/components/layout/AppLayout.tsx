"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown, Space, Button } from "antd";
import type { MenuProps } from "antd";
import Image from "next/image";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import SideMenu from "@/components/layout/SideMenu";
import AntdRegistry from "../AntdRegistry";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AuthService, { UserInfo } from "../../services/authService";
import AuthGuard from "../auth/AuthGuard";

const { Content, Sider, Header } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [collapsed, setCollapsed] = useState(false);

  // 当前用户信息
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // 获取用户信息
  useEffect(() => {
    const userInfo = AuthService.getUserInfo();
    if (userInfo) {
      setCurrentUser(userInfo);
    }
  }, []);

  // 切换侧边栏收起状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 处理退出登录
  const handleLogout = () => {
    // 清除用户信息
    AuthService.clearUserInfo();
    // 立即跳转到登录页，避免显示"未登录"状态
    router.push("/login");
  };

  // 用户下拉菜单项
  const userMenuItems: MenuProps["items"] = [
    // {
    //   key: "profile",
    //   icon: <UserOutlined />,
    //   label: "个人信息",
    // },
    // {
    //   key: "settings",
    //   icon: <SettingOutlined />,
    //   label: "账户设置",
    // },
    // {
    //   type: "divider",
    // },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  return (
    <AntdRegistry>
      <AuthGuard>
        {isLoginPage ? (
          <>{children}</>
        ) : (
          <Layout style={{ height: "100vh", overflow: "hidden" }}>
            <Sider
              width={210}
              collapsedWidth={80}
              collapsed={collapsed}
              theme="light"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                height: "100vh",
                zIndex: 1000,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
              className="shadow-md bg-gradient-to-b from-blue-50 to-white"
            >
              <div
                className="flex items-center justify-center px-4 border-b border-gray-100"
                style={{ height: "64px" }}
              >
                <div className="text-xl font-bold  flex items-center">
                  <Image
                    src="/logoicon.jpg"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="mr-3 rounded-lg object-cover"
                  />
                  {!collapsed && <span>进度管理系统</span>}
                </div>
              </div>
              <div
                className="py-2 flex-1"
                style={{ height: "calc(100vh - 160px)", overflowY: "auto" }}
              >
                <SideMenu collapsed={collapsed} />
              </div>
              <div className="border-t border-gray-100 p-2 mt-auto">
                <Button
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={toggleCollapsed}
                  className="w-full flex items-center justify-center hover:bg-blue-50"
                  style={{ height: "40px" }}
                >
                  {!collapsed && <span className="ml-2">收起菜单</span>}
                </Button>
                {!collapsed && (
                  <div className="text-center text-xs text-gray-500 mt-2 px-2">
                    <span>下单系统 ©{new Date().getFullYear()}</span>
                  </div>
                )}
              </div>
            </Sider>
            <Layout
              style={{
                marginLeft: collapsed ? 80 : 200,
                transition: "margin-left 0.2s",
              }}
            >
              <Header
                style={{
                  backgroundColor: "white",
                  position: "fixed",
                  top: 0,
                  right: 0,
                  left: collapsed ? 80 : 200,
                  zIndex: 999,
                  height: 64,
                  transition: "left 0.2s",
                }}
                className="px-6 flex justify-between items-center shadow-sm"
              >
                <div className="flex-1">
                  <Menu
                    mode="horizontal"
                    selectedKeys={[pathname.split("/")[1] || ""]}
                    className="border-b-0 font-medium"
                    items={[
                      {
                        key: "design",
                        label: (
                          <Link
                            href="/design"
                            className="text-gray-700 hover:text-blue-600"
                          >
                            设计管理
                          </Link>
                        ),
                      },
                      {
                        key: "split",
                        label: (
                          <Link
                            href="/split"
                            className="text-gray-700 hover:text-blue-600"
                          >
                            拆单管理
                          </Link>
                        ),
                      },
                      {
                        key: "production",
                        label: (
                          <Link
                            href="/production"
                            className="text-gray-700 hover:text-blue-600"
                          >
                            生产管理
                          </Link>
                        ),
                      },
                      {
                        key: "config",
                        label: (
                          <Link
                            href="/config"
                            className="text-gray-700 hover:text-blue-600"
                          >
                            系统配置
                          </Link>
                        ),
                      },
                    ]}
                  />
                </div>
                <div className="flex items-center">
                  {/* <Button
                    type="text"
                    icon={<BellOutlined className="text-lg" />}
                    className="mr-4 hover:bg-gray-100 h-10 w-10 flex items-center justify-center rounded-full"
                  /> */}
                  <Dropdown
                    menu={{ items: userMenuItems }}
                    placement="bottomRight"
                    arrow
                  >
                    <Space className="cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100 border border-gray-100">
                      <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                      <span className="font-medium">
                        {currentUser?.username || "未登录"}
                      </span>
                    </Space>
                  </Dropdown>
                </div>
              </Header>
              <Content
                style={{
                  marginTop: 64,
                  maxHeight: "calc(100vh - 64px)",
                  overflow: "auto",
                  padding: "16px",
                }}
                className="rounded-lg"
              >
                <div>{children}</div>
              </Content>
            </Layout>
          </Layout>
        )}
      </AuthGuard>
    </AntdRegistry>
  );
};

export default AppLayout;
