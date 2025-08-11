'use client';

import React from 'react';
import { Typography, Card, Table, Button, Space, Input, Select, Row, Col, Divider, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, FileOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { Title } = Typography;

const SplitOrderPage: React.FC = () => {
  // 模拟拆单页数据
  const orderData = [
    {
      key: '1',
      orderNumber: 'D2024-03',
      customerName: '张三',
      productId: 'A',
      salesAmount: 'C',
      deliveryDate: '2023-06-20',
      processingStatus: [
        '设计中确认',
        '设计图确认',
        '设计部确认'
      ],
      processingPhase: '门下料',
      downPhase: '柜子',
      designPhase: '180天',
      orderStatus: '已下单',
      orderType: '设计图',
      total: '¥1200',
      actions: '查看'
    },
    {
      key: '2',
      orderNumber: 'D2024-04',
      customerName: '李四',
      productId: 'A',
      salesAmount: 'D',
      deliveryDate: '2023-06-20',
      processingStatus: [
        '设计中确认',
        '设计图确认',
        '设计部确认'
      ],
      processingPhase: '木工',
      downPhase: '柜子',
      designPhase: '180天',
      orderStatus: '未下单',
      orderType: '标准图',
      total: '¥1500',
      actions: '查看'
    },
  ];

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '设计师',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: '销售额',
      dataIndex: 'salesAmount',
      key: 'salesAmount',
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
    },
    {
      title: '进度状态',
      dataIndex: 'processingStatus',
      key: 'processingStatus',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => {
            return (
              <Tag color="blue" key={tag}>
                {tag}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: '进度阶段',
      dataIndex: 'processingPhase',
      key: 'processingPhase',
    },
    {
      title: '下单阶段',
      dataIndex: 'downPhase',
      key: 'downPhase',
    },
    {
      title: '设计周期',
      dataIndex: 'designPhase',
      key: 'designPhase',
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => {
        const color = status === '已下单' ? 'green' : 'gold';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      key: 'orderType',
    },
    {
      title: '合计',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Record<string, any>) => (
        <Space size="middle">
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">下载</Button>
          <Button type="link" size="small">下一步</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex items-center">
          <div className="mr-2">
            <FileOutlined style={{ fontSize: '24px' }} />
          </div>
          <Title level={4} className="m-0">拆单页</Title>
        </div>
      </div>
      
      {/* 搜索和过滤区域 */}
      <div className="mb-4 bg-white p-4 rounded shadow-sm">
        <Row gutter={16} className="mb-4">
          <Col span={4}>
            <Input placeholder="订单编号" />
          </Col>
          <Col span={4}>
            <Input placeholder="客户名称" />
          </Col>
          <Col span={4}>
            <Select placeholder="订单状态" style={{ width: '100%' }}>
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="placed">已下单</Select.Option>
              <Select.Option value="notPlaced">未下单</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select placeholder="进度阶段" style={{ width: '100%' }}>
              <Select.Option value="all">全部阶段</Select.Option>
              <Select.Option value="cutting">门下料</Select.Option>
              <Select.Option value="carpentry">木工</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button style={{ marginLeft: 8 }}>重置</Button>
            <Button style={{ marginLeft: 8 }} icon={<FilterOutlined />}>筛选</Button>
            <Button style={{ marginLeft: 8 }} icon={<DownloadOutlined />}>导出</Button>
          </Col>
        </Row>
      </div>
      
      {/* 表格区域 */}
      <div className="bg-white p-4 rounded shadow-sm">
        <Table 
          columns={columns} 
          dataSource={orderData} 
          bordered 
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </div>
    </div>
  );
};

export default SplitOrderPage;