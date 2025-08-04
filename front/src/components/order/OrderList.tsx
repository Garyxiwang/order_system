'use client';

import React from 'react';
import { Table, Tag, Space, Button } from 'antd';
import type { TableColumnsType } from 'antd';

interface OrderItem {
  key: string;
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

const mockData: OrderItem[] = [
  {
    key: '1',
    orderNumber: 'ORD-2023-001',
    customer: '张三',
    date: '2023-08-01',
    amount: 199.99,
    status: 'completed',
  },
  {
    key: '2',
    orderNumber: 'ORD-2023-002',
    customer: '李四',
    date: '2023-08-02',
    amount: 99.50,
    status: 'processing',
  },
  {
    key: '3',
    orderNumber: 'ORD-2023-003',
    customer: '王五',
    date: '2023-08-03',
    amount: 299.99,
    status: 'pending',
  },
  {
    key: '4',
    orderNumber: 'ORD-2023-004',
    customer: '赵六',
    date: '2023-08-04',
    amount: 149.99,
    status: 'cancelled',
  },
];

const OrderList: React.FC = () => {
  const columns: TableColumnsType<OrderItem> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        
        switch(status) {
          case 'pending':
            color = 'gold';
            text = '待处理';
            break;
          case 'processing':
            color = 'blue';
            text = '处理中';
            break;
          case 'completed':
            color = 'green';
            text = '已完成';
            break;
          case 'cancelled':
            color = 'red';
            text = '已取消';
            break;
          default:
            color = 'default';
            text = status;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small">查看</Button>
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button type="link" size="small">编辑</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={mockData} 
      pagination={false}
      bordered
      title={() => '最近订单'}
    />
  );
};

export default OrderList;