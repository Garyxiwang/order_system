import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "订单系统",
  description: "基于Next.js、TypeScript和Ant Design构建的订单系统",
};

const { Content, Footer } = Layout;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  );
}
