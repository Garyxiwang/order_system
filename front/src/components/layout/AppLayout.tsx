"use client";

import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import type { MenuProps } from "antd";
import Image from "next/image";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import SideMenu from "@/components/layout/SideMenu";
import AntdRegistry from "../AntdRegistry";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AuthService, { UserInfo } from "../../services/authService";
import AuthGuard from "../auth/AuthGuard";
import PermissionService, { PageModule } from "@/utils/permissions";

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
  const [accessibleModules, setAccessibleModules] = useState<PageModule[]>([]);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取用户信息
  useEffect(() => {
    const userInfo = AuthService.getUserInfo();
    setCurrentUser(userInfo);

    // 获取用户可访问的模块
    const modules = PermissionService.getAccessibleModules();
    setAccessibleModules(modules);
  }, []);

  // 监听用户信息变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userInfo") {
        const userInfo = AuthService.getUserInfo();
        setCurrentUser(userInfo);
      }
    };

    // 监听localStorage变化
    window.addEventListener("storage", handleStorageChange);

    // 监听自定义用户信息更新事件
    const handleUserInfoUpdate = () => {
      const userInfo = AuthService.getUserInfo();
      setCurrentUser(userInfo);

      // 更新可访问模块
      const modules = PermissionService.getAccessibleModules();
      setAccessibleModules(modules);
    };

    window.addEventListener("userInfoUpdated", handleUserInfoUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userInfoUpdated", handleUserInfoUpdate);
    };
  }, []);

  // 切换侧边栏收起状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 处理退出登录
  const handleLogout = () => {
    AuthService.clearUserInfo();
    window.location.href = "/login";
  };

  // 处理修改密码
  const handleChangePassword = () => {
    setChangePasswordVisible(true);
  };

  // 提交修改密码
  const handlePasswordSubmit = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      // 这里调用修改密码的API
      await AuthService.changePassword(values.oldPassword, values.newPassword);
      message.success("密码修改成功");
      setChangePasswordVisible(false);
      form.resetFields();
    } catch (error: unknown) {
      // 显示后端返回的具体错误信息
      let errorMessage = "密码修改失败";

      if (error && typeof error === "object") {
        const errorObj = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        errorMessage =
          errorObj.response?.data?.message || errorObj.message || errorMessage;
      }

      message.error(errorMessage);
    }
  };

  // 取消修改密码
  const handlePasswordCancel = () => {
    setChangePasswordVisible(false);
    form.resetFields();
  };

  // 检查用户是否有权限访问指定模块
  const hasPermission = (module: PageModule): boolean => {
    return accessibleModules.includes(module);
  };

  // 用户下拉菜单项
  const userMenuItems: MenuProps["items"] = [
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "修改密码",
      onClick: handleChangePassword,
    },
    {
      type: "divider",
    },
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
                      // 设计管理
                      ...(hasPermission(PageModule.DESIGN)
                        ? [
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
                          ]
                        : []),
                      // 拆单管理
                      ...(hasPermission(PageModule.SPLIT)
                        ? [
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
                          ]
                        : []),
                      // 生产管理
                      ...(hasPermission(PageModule.PRODUCTION)
                        ? [
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
                          ]
                        : []),
                      // 售后管理
                      ...(hasPermission(PageModule.AFTER_SALES)
                        ? [
                            {
                              key: "after-sales",
                              label: (
                                <Link
                                  href="/after-sales"
                                  className="text-gray-700 hover:text-blue-600"
                                >
                                  售后管理
                                </Link>
                              ),
                            },
                          ]
                        : []),
                      // 系统配置
                      ...(hasPermission(PageModule.CONFIG)
                        ? [
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
                          ]
                        : []),
                      // 报价管理
                      ...(hasPermission(PageModule.QUOTATION)
                        ? [
                            {
                              key: "quotation-config",
                              label: (
                                <Link
                                  href="/quotation-config"
                                  className="text-gray-700 hover:text-blue-600"
                                >
                                  报价配置管理
                                </Link>
                              ),
                            },
                          ]
                        : []),
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

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={changePasswordVisible}
        onOk={() => form.submit()}
        onCancel={handlePasswordCancel}
        okText="确认修改"
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: "请输入原密码" }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码长度至少6位" },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </AntdRegistry>
  );
};

export default AppLayout;
