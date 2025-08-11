"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Input, Select, Row, Col, Tag, message } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import CreateOrderModal from "../../components/CreateOrderModal";
import { getDesignOrders, createDesignOrder, updateDesignOrder, type DesignOrder } from "../../services/designApi";

const { Option } = Select;

const DesignPage: React.FC = () => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DesignOrder | null>(null);
  const [designData, setDesignData] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const showModal = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const showEditModal = (record: Record<string, string | number>) => {
    console.log("record", record);
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleOk = (values: {
    orderNumber: string;
    customerName: string;
    orderAddress: string;
    orderType: string;
    designer: string;
    salesperson: string;
    categories: string[];
    splitDate?: string;
    orderStatus: string;
    progressDetail: string;
    remark?: string;
  }) => {
    console.log("表单数据:", values);
    // 这里可以添加提交逻辑
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // 模拟设计页数据
  const designData = [
    {
      orderNumber: "D2024-022",
      customerName: "榆林古城店-段总别墅",
      address: "西安",
      designer: "张设计师",
      salesperson: "王销售员",
      splitTime: "2024-07-20",
      progress: "",
      progressDetail: "",
      category: "木门",
      cycle: "1",
      state: "未下单",
      orderType: "设计单",
      remark: "",
    },
    {
      orderNumber: "D2024-001",
      customerName: "计翠艳-甘肃庆阳宏都雅居马小伟",
      address: "西安",
      designer: "张设计师",
      salesperson: "王销售员",
      splitTime: "2024-06-20",
      progress: "量尺,初稿,已报价未打款",
      progressDetail: "正在进行中",
      category: "木门,柜体,石材",
      cycle: "70",
      state: "已下单",
      orderType: "设计单",
      remark: "这个是一个备注",
    },
    {
      orderNumber: "D2024-002",
      customerName: "县佳宁-天宝名都1号楼2108",
      address: "西安",
      designer: "张设计师",
      salesperson: "王销售员",
      splitTime: "2024-07-20",
      progress:
        "量尺:2025/07/11,初稿:2025/07/20,已报价未打款:2025/08/20,已打款,已打款,已打款,已打款",
      progressDetail: "待客户确认",
      category: "木门,柜体,石材,板材",
      cycle: "21",
      state: "已下单",
      orderType: "设计单",
      remark:
        "一个很长很长很长很长很很长很长很很长很长很很长很长很很长很长很很长很长很很长很长很长很长很长很长的备注",
    },
  ];

  const columns = [
    {
      title: "订单编号",
      dataIndex: "orderNumber",
      key: "orderNumber",
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
      render: (
        text: string,
        record: Record<string, unknown>,
        index: number
      ) => {
        if (!text) return "-";
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        const isExpanded = expandedRows.has(index);
        const shouldShowExpand = items.length > 3;
        const displayItems = isExpanded ? items : items.slice(0, 3);

        const toggleExpand = () => {
          const newExpandedRows = new Set(expandedRows);
          if (isExpanded) {
            newExpandedRows.delete(index);
          } else {
            newExpandedRows.add(index);
          }
          setExpandedRows(newExpandedRows);
        };

        // 解析进度项目，分离状态和时间
        const parseProgressItem = (item: string) => {
          if (item.includes(":")) {
            const [status, time] = item.split(":");
            return { status: status.trim(), time: time.trim() };
          }
          return { status: item, time: null };
        };

        return (
          <div>
            {displayItems.map((item, itemIndex) => {
              const { status, time } = parseProgressItem(item);

              return (
                <div key={itemIndex}>
                  {time ? (
                    <span>
                      {status}{" "}
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        ({time})
                      </span>
                    </span>
                  ) : (
                    <span>{status}</span>
                  )}
                </div>
              );
            })}
            {shouldShowExpand && !isExpanded && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={toggleExpand}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  展开
                </Button>
              </div>
            )}
            {shouldShowExpand && isExpanded && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={toggleExpand}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  收起
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "进度详情",
      dataIndex: "progressDetail",
      key: "progressDetail",
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
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
      render: (text: string) => {
        if (!text) return "-";

        // 提取数字部分
        const match = text.match(/(\d+)/);
        const days = match ? parseInt(match[1]) : 0;

        let color = "#000"; // 默认黑色
        if (days > 50) {
          color = "#ff4d4f"; // 红色 - 大于50天
        } else if (days > 20) {
          color = "#faad14"; // 橙色 - 大于20天
        }

        return <span style={{ color }}>{text} 天</span>;
      },
    },
    {
      title: "订单状态",
      dataIndex: "state",
      key: "state",
      render: (text: string) => {
        if (text === "已下单") {
          return <Tag color="green">{text}</Tag>;
        }
        return text;
      },
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
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
          >
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
                订单状态：
              </label>
              <Select
                placeholder="全部状态"
                className="rounded-md flex-1"
                size="middle"
                defaultValue={"-1"}
                allowClear
              >
                <Option value="-1">未下单</Option>
                <Option value="1">已下单</Option>
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                进度详情：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designing">正常进行中</Option>
                <Option value="reviewing">等硬装</Option>
                <Option value="completed">客户待打款</Option>
                <Option value="completed">待客户确认</Option>
                <Option value="completed">其他</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                进度事项：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
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
                设计周期：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                defaultValue={"20"}
                allowClear
              >
                <Option value="20">大于20天</Option>
                <Option value="50">大于50天</Option>
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
        {/* 新增按钮 */}
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={showModal}
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
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.orderNumber}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* 新增订单Modal */}
      <CreateOrderModal
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        initialValues={
          editingRecord
            ? {
                orderNumber: editingRecord.orderNumber as string,
                customerName: editingRecord.customerName as string,
                orderAddress: editingRecord.address as string,
                designer: editingRecord.designer as string,
                salesperson: editingRecord.salesperson as string,
                splitDate: editingRecord.splitTime as string,
                progressDetail: editingRecord.progressDetail as string,
                categories:
                  (editingRecord.category as string)?.split(",") || [],
                remark: editingRecord.remark as string,
              }
            : undefined
        }
      />
    </div>
  );
};

export default DesignPage;
