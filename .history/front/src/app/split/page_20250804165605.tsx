"use client";

import React, { useState } from "react";
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  Tag,
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const DesignPage: React.FC = () => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("1");
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);

  // 模拟设计页数据
  const designData = [
    {
      designNumber: "D2024-022",
      customerName: "客户B",
      address: "西安",
      createTime: "2024-07-20",
      designer: "张三",
      salesPerson: "李四",
      splitPerson: "王五",
      doorBody: "木门:2025/07/01:3,柜体:2025/07/04:2",
      external: "石材:2025/07/01:3,板材:2025/07/01:2",
      priceState: "已报价",
      fixedTime: "2024-07-20",
      finishTime: "2024-07-30",
      orderType: "设计单",
      remark: "这个是一个备注",
    },
    {
      designNumber: "D2024-023",
      customerName: "客户B",
      address: "西安",
      createTime: "2024-07-20",
      designer: "张三",
      salesPerson: "李四",
      splitPerson: "王五",
      doorBody: "木门:2025/07/01:3,柜体:",
      external: "石材:2025/07/01:3,板材:2025/07/01:2",
      priceState: "已报价",
      fixedTime: "2024-07-20",
      finishTime: "2024-07-30",
      orderType: "设计单",
      remark: "这个是一个备注",
    },
  ];

  const columns = [
    {
      title: "订单编号",
      dataIndex: "designNumber",
      key: "designNumber",
    },
    {
      title: "客户名称",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "下单日期",
      dataIndex: "createTime",
      key: "createTime",
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
    },
    {
      title: "销售员",
      dataIndex: "salesPerson",
      key: "salesPerson",
    },
    {
      title: "拆单员",
      dataIndex: "splitPerson",
      key: "splitPerson",
    },
    {
      title: "木门/柜体",
      dataIndex: "doorBody",
      key: "doorBody",
      render: (text: string) => {
        if (!text) return null;
        
        const items = text.split(',');
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(':');
              const name = parts[0];
              const time = parts[1];
              const days = parts[2];
              
              if (parts.length === 3 && name && time && days) {
                return (
                  <div key={index} style={{ color: 'green' }}>
                    {name}:{time}  {days}天
                  </div>
                );
              } else {
                return (
                  <div key={index}>
                    {name}
                  </div>
                );
              }
            })}
          </div>
        );
      },
    },
    {
      title: "外购项目",
      dataIndex: "external",
      key: "external",
    },
    {
      title: "报价状态",
      dataIndex: "priceState",
      key: "priceState",
    },
    {
      title: "定板日期",
      dataIndex: "fixedTime",
      key: "fixedTime",
    },
    {
      title: "拆单完成日期",
      dataIndex: "finishTime",
      key: "finishTime",
    },
    {
      title: "订单类型",
      dataIndex: "orderType",
      key: "orderType",
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text: string) => (
        <div
          style={{
            maxWidth: "150px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text || "-"}
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: Record<string, string | number>) => (
        <Space size="middle">
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small">
            拆单
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索Card */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Row gutter={24}>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单编号：
              </label>
              <Input
                placeholder="请输入"
                className="rounded-md border-gray-200 flex-1"
                size="middle"
                allowClear
              />
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单名称：
              </label>
              <Input
                placeholder="请输入"
                className="rounded-md border-gray-200 flex-1"
                size="middle"
                allowClear
              />
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                拆单状态：
              </label>
              <Select
                placeholder="全部状态"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="-1">拆单中</Option>
                <Option value="1">已审核</Option>
                <Option value="1">已完结</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                设计师：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designer1">设计师1</Option>
                <Option value="designer2">设计师2</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                销售员：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designer1">销售员1</Option>
                <Option value="designer2">销售员2</Option>
                <Option value="designer2">销售员3</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                拆单员：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designer1">拆单员1</Option>
                <Option value="designer2">拆单员2</Option>
                <Option value="designer2">拆单员3</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                类目：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designing">木门</Option>
                <Option value="reviewing">柜体</Option>
                <Option value="completed">石材</Option>
                <Option value="completed">板材</Option>
                <Option value="completed">铝合金门</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                报价状态：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="normal">已打款</Option>
                <Option value="important">报价已发未大款</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单类型：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="design">设计单</Option>
                <Option value="development">拆单订单</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                是否下单：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="-1">已下单</Option>
                <Option value="0">未下单</Option>
              </Select>
            </div>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col span={24} className="text-right">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="middle"
                className="bg-blue-600 hover:bg-blue-700"
              >
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 内容Card */}
      <Card variant="outlined">
        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={designData}
          bordered={false}
          pagination={{ pageSize: 10 }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.designNumber}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default DesignPage;
