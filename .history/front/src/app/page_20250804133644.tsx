'use client';

import Image from "next/image";
import { Button, Space, Typography, Card, Divider, Row, Col } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <Card className="mb-8 shadow-md">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2}>订单系统</Title>
            <Paragraph>
              欢迎使用订单系统，这是一个基于Next.js、TypeScript和Ant Design构建的前端应用。
            </Paragraph>
            <Space>
              <Button type="primary" icon={<ShoppingCartOutlined />}>开始使用</Button>
              <Button>了解更多</Button>
            </Space>
          </Space>
        </Card>
        
        <Divider orientation="left">订单管理</Divider>
         
         <div className="mb-8">
           <dynamic import={import('@/components/order/OrderList')} />
         </div>
         
         <Divider orientation="left">技术栈</Divider>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Next.js" className="shadow-sm">
            <Paragraph>
              React框架，提供服务端渲染、路由等功能。
            </Paragraph>
          </Card>
          
          <Card title="TypeScript" className="shadow-sm">
            <Paragraph>
              JavaScript的超集，提供类型检查。
            </Paragraph>
          </Card>
          
          <Card title="Ant Design" className="shadow-sm">
            <Paragraph>
              企业级UI设计语言和React组件库。
            </Paragraph>
          </Card>
          
          <Card title="Tailwind CSS" className="shadow-sm">
            <Paragraph>
              实用优先的CSS框架。
            </Paragraph>
          </Card>
        </div>
        
        <div className="mt-8">
          <Space>
            <Button type="link" href="https://nextjs.org/docs" target="_blank">
              Next.js 文档
            </Button>
            <Button type="link" href="https://ant.design/docs/react/introduce-cn" target="_blank">
              Ant Design 文档
            </Button>
            <Button type="link" href="https://www.typescriptlang.org/docs/" target="_blank">
              TypeScript 文档
            </Button>
          </Space>
          </div>
      </main>
      <footer className="mt-12 text-center text-gray-500">
        <Divider />
        <p>订单系统 © {new Date().getFullYear()} - 基于Next.js、TypeScript和Ant Design构建</p>
      </footer>
    </div>
  );
}
