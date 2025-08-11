"use client";

import React from "react";
import { Layout } from "antd";
import SideMenu from "@/components/layout/SideMenu";
import AntdRegistry from "../AntdRegistry";
import { usePathname } from "next/navigation";

const { Content, Footer, Sider } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AntdRegistry>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <Layout className="min-h-screen">
          <Layout>
            <Sider
              width={250}
              theme="light"
              className="min-h-screen"
              breakpoint="lg"
              collapsible
            >
              <div className="text-xl font-bold text-center py-4">订单系统</div>
              <SideMenu />
            </Sider>
            <Layout>
              <Content className="p-6">{children}</Content>
              <Footer className="text-center">
                订单系统 ©{new Date().getFullYear()} -
                基于Next.js、TypeScript和Ant Design构建
              </Footer>
            </Layout>
          </Layout>
        </Layout>
      )}
    </AntdRegistry>
  );
};

export default AppLayout;
