"use client";

import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Button, Space } from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import SideMenu from "@/components/layout/SideMenu";
import AntdRegistry from "../AntdRegistry";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const { Content, Footer, Sider, Header } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  // 模拟当前用户信息
  const [currentUser] = useState({
    name: "张三",
    avatar: "",
    role: "管理员",
  });

  // 处理退出登录
  const handleLogout = () => {
    // 实际项目中应该调用登出API，清除token等
    console.log("用户登出");
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
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <Layout style={{ height: "100vh", overflow: "hidden" }}>
          <Sider
            width={250}
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
            breakpoint="lg"
            collapsible
          >
            <div className="flex items-center justify-center py-6 px-4 border-b border-gray-100">
              <div className="text-xl font-bold text-blue-700 flex items-center">
                <img src="/globe.svg" alt="Logo" className="w-8 h-8 mr-2" />
                <span>订单系统</span>
              </div>
            </div>
            <div className="py-2 flex-1">
              <SideMenu />
            </div>
            <div 
              style={{
                padding: "16px",
                borderTop: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
                textAlign: "center",
                fontSize: "12px",
                color: "#999",
              }}
            >
              订单系统 ©{new Date().getFullYear()}
            </div>
          </Sider>
          <Layout style={{ marginLeft: 250 }}>
            <Header
              style={{
                backgroundColor: "white",
                position: "fixed",
                top: 0,
                right: 0,
                left: 250,
                zIndex: 999,
                height: 64,
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
                    <span className="font-medium">{currentUser.name}</span>
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
    </AntdRegistry>
  );
};

export default AppLayout;
