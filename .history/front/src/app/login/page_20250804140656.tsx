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
    <div className="flex min-h-screen items-center justify-center p-6 bg-gray-50">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-lg shadow-lg">
        {/* 左侧图片区域 */}
        <div className="relative hidden w-1/2 bg-gray-100 md:block">
          <div className="flex h-full items-center justify-center">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                图片
              </div>
              {/* 实际项目中可以替换为真实图片 */}
              {/* <Image 
                src="/login-image.jpg" 
                alt="登录页面图片"
                layout="fill"
                objectFit="cover"
              /> */}
            </div>
          </div>
        </div>

        {/* 右侧登录表单区域 */}
        <div className="w-full bg-white p-10 md:w-1/2">
          <div className="mb-10 text-center">
            <Title level={1}>用户登录</Title>
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
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名!" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码!" }]}
            >
              <Input.Password placeholder="请输入" />
            </Form.Item>

            <Form.Item className="mt-8">
              <Button type="primary" htmlType="submit" block>
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
