"use client";

import React from "react";
import { Form, Input, Button, Typography } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const router = useRouter();

  interface LoginFormValues {
    username: string;
    password: string;
    remember?: boolean;
  }

  const onFinish = (values: LoginFormValues) => {
    console.log("登录信息:", values);
    // 模拟登录成功，实际项目中应该调用API
    router.push("/design");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-xl shadow-xl">
        {/* 左侧图片区域 */}
        <div className="relative hidden w-1/2 md:block">
          <div className="flex h-full items-center justify-center">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br ">
                <Image 
                  src="/globe.svg" 
                  alt="登录页面图片"
                  width={200}
                  height={200}
                  className="mb-8"
                />
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-4">订单管理系统</h2>
                <p className="text-blue-100 text-lg">高效、便捷的设计与生产管理平台</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单区域 */}
        <div className="w-full bg-white p-12 md:w-1/2">
          <div className="mb-10 text-center">
            <Title level={1} className="text-blue-700">用户登录</Title>
            <p className="text-gray-500 mt-2">请输入您的账号和密码</p>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="text-lg"
          >
            <Form.Item
              label={<span className="text-base font-medium text-gray-700">用户名</span>}
              name="username"
              rules={[{ required: true, message: "请输入用户名!" }]}
              className="mb-6"
            >
              <Input 
                placeholder="请输入用户名" 
                size="large" 
                className="py-2 rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500" 
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-base font-medium text-gray-700">密码</span>}
              name="password"
              rules={[{ required: true, message: "请输入密码!" }]}
              className="mb-8"
            >
              <Input.Password 
                placeholder="请输入密码" 
                size="large" 
                className="py-2 rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500" 
              />
            </Form.Item>

            <Form.Item className="mt-10">
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large" 
                className="h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 rounded-md shadow-md"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
