'use client';

import { useRouter } from 'next/navigation';
import { Button, Space, Typography, Card, Divider, Row, Col, Statistic } from 'antd';
import { ShoppingCartOutlined, FileOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();
  
  // 导航到各个页面的处理函数
  const navigateToDesign = () => router.push('/design');
  const navigateToSplit = () => router.push('/split');
  const navigateToConfig = () => router.push('/config');
  
  return (
    <div className="font-sans min-h-screen">
      <main>
        <div className="mb-6">
          <Card className="shadow-md">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Title level={2}>订单系统控制台</Title>
              <Paragraph>
                欢迎使用订单系统，这是一个基于Next.js、TypeScript和Ant Design构建的前端应用。
                您可以通过左侧菜单或下方卡片快速访问系统功能。
              </Paragraph>
            </Space>
          </Card>
        </div>
        
        <Divider orientation="left">系统概览</Divider>
        
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic 
                title="设计任务" 
                value={12} 
                prefix={<FileOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="待拆单" 
                value={5} 
                prefix={<ShoppingCartOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已完成" 
                value={28} 
                prefix={<FileOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="系统用户" 
                value={8} 
                prefix={<UserOutlined />} 
              />
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">快速访问</Divider>
        
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center" 
              onClick={navigateToDesign}
            >
              <FileOutlined style={{ fontSize: '2rem' }} />
              <Title level={4} className="mt-4">设计页</Title>
              <Paragraph>管理设计任务和设计流程</Paragraph>
              <Button type="primary">进入设计页</Button>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center" 
              onClick={navigateToSplit}
            >
              <ShoppingCartOutlined style={{ fontSize: '2rem' }} />
              <Title level={4} className="mt-4">拆单页</Title>
              <Paragraph>管理订单拆分和处理流程</Paragraph>
              <Button type="primary">进入拆单页</Button>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center" 
              onClick={navigateToConfig}
            >
              <SettingOutlined style={{ fontSize: '2rem' }} />
              <Title level={4} className="mt-4">配置页</Title>
              <Paragraph>系统设置和参数配置</Paragraph>
              <Button type="primary">进入配置页</Button>
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">系统信息</Divider>
        
        <Card className="mb-6">
          <Row gutter={16}>
            <Col span={12}>
              <Title level={4}>技术栈</Title>
              <ul className="list-disc pl-5">
                <li>Next.js - React框架，提供服务端渲染、路由等功能</li>
                <li>TypeScript - JavaScript的超集，提供类型检查</li>
                <li>Ant Design - 企业级UI设计语言和React组件库</li>
                <li>Tailwind CSS - 实用优先的CSS框架</li>
              </ul>
            </Col>
            <Col span={12}>
              <Title level={4}>系统版本</Title>
              <ul className="list-disc pl-5">
                <li>当前版本: v1.0.0</li>
                <li>更新日期: {new Date().toLocaleDateString()}</li>
                <li>系统状态: 正常运行</li>
              </ul>
            </Col>
          </Row>
        </Card>
      </main>
    </div>
  );
}
