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
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card variant="outlined" className="shadow-none">
            <div>
              {/* 搜索和过滤区域 */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Input
                      placeholder="订单编号"
                      prefix={<SearchOutlined className="text-gray-400" />}
                      className="rounded-md border-gray-200"
                      size="large"
                    />
                  </Col>
                  <Col span={6}>
                    <label htmlFor="customerName">客户名称</label>
                    <Input
                      placeholder="客户名称"
                      className="rounded-md border-gray-200"
                      size="large"
                    />
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="选择状态"
                      style={{ width: "100%" }}
                      className="rounded-md"
                      size="large"
                    >
                      <Option value="all">全部状态</Option>
                      <Option value="inProgress">进行中</Option>
                      <Option value="completed">已完成</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        size="large"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        搜索
                      </Button>
                      <Button size="large">重置</Button>
                    </Space>
                  </Col>
                </Row>
              </div>
              <Divider className="my-4" />
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
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DesignPage;
