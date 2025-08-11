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
  Divider,
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const DesignPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);

  // 模拟设计页数据
  const designData = [
    {
      key: "1",
      designNumber: "D2024-001",
      customerName: "客户A",
      productName: "产品X",
      designer: "张设计师",
      status: "进行中",
      createTime: "2024-06-20",
      previewImage: "/file.svg", // 使用已有的图片
    },
    {
      key: "2",
      designNumber: "D2024-002",
      customerName: "客户B",
      productName: "产品Y",
      designer: "李设计师",
      status: "已完成",
      createTime: "2024-06-18",
      previewImage: "/globe.svg", // 使用已有的图片
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
      key: "customerName",
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
    },
    {
      title: "分单日期",
      dataIndex: "splitTime",
      key: "splitTime",
    },
    {
      title: "进度过程",
      dataIndex: "progress",
      key: "progress",
    },
    {
      title: "进度详情",
      dataIndex: "progressDetail",
      key: "progressDetail",
    },
    {
      title: "下单类目",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "设计周期",
      dataIndex: "cycle",
      key: "cycle",
    },
    {
      title: "订单状态",
      dataIndex: "state",
      key: "state",
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
            更新进度
          </Button>
          <Button type="link" size="small">
            下单
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card variant="outlined" className="shadow-none">
        {/* 搜索和过滤区域 */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Row gutter={24}>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  订单编号
                </label>
                <Input
                  placeholder="请输入"
                  className="rounded-md border-gray-200 flex-1"
                  size="middle"
                />
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  订单名称
                </label>
                <Input
                  placeholder="请输入"
                  className="rounded-md border-gray-200 flex-1"
                  size="middle"
                />
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  订单状态
                </label>
                <Select
                  placeholder="全部状态"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="all">全部状态</Option>
                  <Option value="inProgress">进行中</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                  设计师
                </label>
                <Select
                  placeholder="请选择"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="designer1">设计师1</Option>
                  <Option value="designer2">设计师2</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                  销售员
                </label>
                <Select
                  placeholder="请选择"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="designer1">设计师1</Option>
                  <Option value="designer2">设计师2</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  进度详情
                </label>
                <Select
                  placeholder="正在设计中"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="designing">正在设计中</Option>
                  <Option value="reviewing">审核中</Option>
                  <Option value="completed">已完成</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  进度事项
                </label>
                <Select
                  placeholder="重点"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="normal">量尺</Option>
                  <Option value="important">初稿</Option>
                  <Option value="urgent">已报价未打款</Option>
                  <Option value="urgent">已打款</Option>
                  <Option value="urgent">已下单</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  订单类型
                </label>
                <Select
                  placeholder="设计类"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="design">设计类</Option>
                  <Option value="development">开发类</Option>
                  <Option value="consulting">咨询类</Option>
                </Select>
              </div>
            </Col>
            <Col span={6} className="py-2">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                  设计周期
                </label>
                <Select
                  placeholder="大于20天"
                  className="rounded-md flex-1"
                  size="middle"
                >
                  <Option value="short">小于10天</Option>
                  <Option value="medium">10-20天</Option>
                  <Option value="long">大于20天</Option>
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
        </div>
        <Divider className="my-4" />
        {/* 新增 */}
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
          >
            创建订单
          </Button>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={designData}
          bordered={false}
          pagination={{ pageSize: 10 }}
          className="shadow-sm"
          rowClassName="hover:bg-blue-50"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
};

export default DesignPage;
