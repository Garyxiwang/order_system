'use client';

import { useRouter } from 'next/navigation';
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule } from "@/utils/permissions";
import { Button, Space, Typography, Card, Divider, Row, Col, Statistic } from 'antd';
import { ShoppingCartOutlined, FileOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

function Dashboard() {
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
                title="生产中" 
                value={8} 
                prefix={<UserOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已完成" 
                value={23} 
                prefix={<SettingOutlined />} 
              />
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">快速操作</Divider>
        
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center"
              onClick={navigateToDesign}
            >
              <FileOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <Title level={4}>设计管理</Title>
              <Paragraph>管理设计任务和进度</Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center"
              onClick={navigateToSplit}
            >
              <ShoppingCartOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Title level={4}>拆单管理</Title>
              <Paragraph>处理订单拆分和分配</Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              hoverable 
              className="text-center"
              onClick={navigateToConfig}
            >
              <SettingOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />
              <Title level={4}>系统配置</Title>
              <Paragraph>管理系统设置和用户</Paragraph>
            </Card>
          </Col>
        </Row>
        
        <Divider orientation="left">系统信息</Divider>
        
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Title level={4}>技术栈</Title>
              <ul>
                <li>前端框架: Next.js 14</li>
                <li>UI组件库: Ant Design</li>
                <li>开发语言: TypeScript</li>
                <li>样式方案: Tailwind CSS</li>
              </ul>
            </Col>
            <Col span={12}>
              <Title level={4}>系统状态</Title>
              <ul>
                <li>版本号: v1.0.0</li>
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

export default function DashboardWithGuard() {
  return (
    <RouteGuard requiredModule={PageModule.DASHBOARD}>
      <Dashboard />
    </RouteGuard>
  );
}