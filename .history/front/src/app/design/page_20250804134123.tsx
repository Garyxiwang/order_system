'use client';

import React from 'react';
import { Typography, Card, Table, Button, Space, Input, Select, Row, Col, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, FileOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const DesignPage: React.FC = () => {
  // 模拟设计页数据
  const designData = [
    {
      key: '1',
      designNumber: 'D2024-001',
      customerName: '客户A',
      productName: '产品X',
      designer: '张设计师',
      status: '进行中',
      createTime: '2024-06-20',
    },
    {
      key: '2',
      designNumber: 'D2024-002',
      customerName: '客户B',
      productName: '产品Y',
      designer: '李设计师',
      status: '已完成',
      createTime: '2024-06-18',
    },
  ];

  const columns = [
    {
      title: '设计编号',
      dataIndex: 'designNumber',
      key: 'designNumber',
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '设计师',
      dataIndex: 'designer',
      key: 'designer',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>设计页</Title>
        <Divider />
        
        {/* 搜索和过滤区域 */}
        <div className="mb-4">
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input placeholder="订单编号" prefix={<SearchOutlined />} />
            </Col>
            <Col span={6}>
              <Input placeholder="客户名称" />
            </Col>
            <Col span={6}>
              <Select placeholder="选择状态" style={{ width: '100%' }}>
                <Option value="all">全部状态</Option>
                <Option value="inProgress">进行中</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
              <Button style={{ marginLeft: 8 }}>重置</Button>
            </Col>
          </Row>
        </div>
        
        {/* 操作按钮区域 */}
        <div className="mb-4">
          <Button type="primary" icon={<PlusOutlined />}>新建设计</Button>
          <Button icon={<FileOutlined />} style={{ marginLeft: 8 }}>导出</Button>
        </div>
        
        {/* 表格区域 */}
        <Table 
          columns={columns} 
          dataSource={designData} 
          bordered 
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default DesignPage;