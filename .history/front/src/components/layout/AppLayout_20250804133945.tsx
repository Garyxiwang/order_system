'use client';

import React from 'react';
import { Layout } from 'antd';
import Navbar from './Navbar';
import AntdRegistry from '../AntdRegistry';

const { Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <AntdRegistry>
      <Layout className="min-h-screen">
        <Navbar />
        <Content className="p-6">
          {children}
        </Content>
        <Footer className="text-center">
          订单系统 ©{new Date().getFullYear()} - 基于Next.js、TypeScript和Ant Design构建
        </Footer>
      </Layout>
    </AntdRegistry>
  );
};

export default AppLayout;