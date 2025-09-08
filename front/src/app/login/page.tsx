"use client";

import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthService from "../../services/authService";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  interface LoginFormValues {
    username: string;
    password: string;
    remember?: boolean;
  }

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // 调用登录API
      const userInfo = await AuthService.login({
        username: values.username,
        password: values.password,
      });

      // 存储用户信息到localStorage
      AuthService.setUserInfo(userInfo);

      // 跳转到设计页面
      router.push("/design");
    } catch (error) {
      // 显示错误消息
      const errorMessage =
        error instanceof Error ? error.message : "登录失败，请检查用户名和密码";
      message.error( errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url(/bgm.jpg)",
      }}
    >
      <div className="w-full max-w-2xl">
        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-2xl p-16">
          {/* Logo和标题区域 */}
          <div className="flex items-center justify-center mb-8">
            <Image
              src="/logo3.png"
              alt="Logo"
              width={200}
              height={0}
              className="mr-6 rounded-lg h-auto"
            />
            <Title
              level={1}
              className="!text-4xl !font-bold !text-gray-800 !mb-0"
            >
              进度管理系统
            </Title>
          </div>

          {/* 登录表单 */}
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: "请输入用户名!" }]}
              className="mb-4"
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="用户名"
                className="h-12 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "请输入密码!" }]}
              className="mb-2"
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
                className="h-12 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="h-12 text-base font-medium bg-blue-500 hover:bg-blue-600 rounded-lg shadow-md border-0"
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
