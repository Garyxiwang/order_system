'use client';

import React, { useState } from 'react';
import { Typography, Card, Tabs, Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const ConfigPage: React.FC = () => {
  const [form] = Form.useForm();

  interface ConfigFormValues {
    companyName: string;
    adminEmail: string;
    language: string;
    theme: string;
    notifications: boolean;
    autoSave: boolean;
    [key: string]: string | boolean | number;
  }

  const onFinish = (values: ConfigFormValues) => {
    console.log('配置保存:', values);
    // 实际项目中应该调用API保存配置
  };

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>系统配置</Title>
        <Divider />
        
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: '基础配置',
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    companyName: '示例公司',
                    adminEmail: 'admin@example.com',
                    language: 'zh_CN',
                    theme: 'light',
                    notifications: true,
                    autoSave: true
                  }}
                >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label="公司名称"
                    rules={[{ required: true, message: '请输入公司名称' }]}
                  >
                    <Input placeholder="请输入公司名称" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="adminEmail"
                    label="管理员邮箱"
                    rules={[{ required: true, message: '请输入管理员邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
                  >
                    <Input placeholder="请输入管理员邮箱" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="language"
                    label="系统语言"
                    rules={[{ required: true, message: '请选择系统语言' }]}
                  >
                    <Select placeholder="请选择系统语言">
                      <Option value="zh_CN">简体中文</Option>
                      <Option value="en_US">English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="theme"
                    label="系统主题"
                    rules={[{ required: true, message: '请选择系统主题' }]}
                  >
                    <Select placeholder="请选择系统主题">
                      <Option value="light">浅色主题</Option>
                      <Option value="dark">深色主题</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="notifications"
                    label="启用通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="autoSave"
                    label="自动保存"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  保存配置
                </Button>
              </Form.Item>
            </Form>
              )
            },
            {
              key: '2',
              label: '订单配置',
              children: (
                <Form layout="vertical">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="orderPrefix"
                    label="订单前缀"
                    initialValue="ORD-"
                  >
                    <Input placeholder="请输入订单前缀" />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="taxRate"
                    label="默认税率(%)"
                    initialValue="13"
                  >
                    <Input type="number" min="0" max="100" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="defaultPaymentTerms"
                    label="默认付款条件"
                    initialValue="30"
                  >
                    <Select>
                      <Option value="0">立即付款</Option>
                      <Option value="15">15天</Option>
                      <Option value="30">30天</Option>
                      <Option value="45">45天</Option>
                      <Option value="60">60天</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="defaultCurrency"
                    label="默认货币"
                    initialValue="CNY"
                  >
                    <Select>
                      <Option value="CNY">人民币 (CNY)</Option>
                      <Option value="USD">美元 (USD)</Option>
                      <Option value="EUR">欧元 (EUR)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  保存配置
                </Button>
              </Form.Item>
            </Form>
              )
            },
            {
              key: '3',
              label: '用户权限',
              children: (
                <>
                  <Paragraph className="mb-4">
                    在此配置用户角色和权限设置。
                  </Paragraph>
            
            <Card title="角色管理" className="mb-4" extra={<Button type="primary" size="small" icon={<PlusOutlined />}>添加角色</Button>}>
              <div className="mb-4">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Card size="small" title="管理员" extra={<Button type="link">编辑</Button>}>
                    <p>拥有系统所有权限，可以管理用户、角色和系统配置。</p>
                  </Card>
                  <Card size="small" title="设计师" extra={<Button type="link">编辑</Button>}>
                    <p>可以创建和管理设计，查看订单信息。</p>
                  </Card>
                  <Card size="small" title="销售人员" extra={<Button type="link">编辑</Button>}>
                    <p>可以创建订单，查看客户信息和订单状态。</p>
                  </Card>
                </Space>
              </div>
            </Card>
            
            <Card title="权限设置" extra={<Button type="primary" size="small" icon={<SettingOutlined />}>权限配置</Button>}>
              <Paragraph>
                配置各角色对系统功能模块的访问权限。
            </Paragraph>
          </Card>
        </>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default ConfigPage;