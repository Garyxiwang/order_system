"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { getSplitOrders, type SplitOrder } from "../../services/splitApi";
import EditOrderModal from "./editOrderModal";
import type { EditFormValues } from "./editOrderModal";
import SplitOrderModal from "./SplitOrderModal";
import type { SplitFormValues } from "./SplitOrderModal";

const { Option } = Select;

const DesignPage: React.FC = () => {
  const [splitData, setSplitData] = useState<SplitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SplitOrder | null>(null);

  // 加载拆单数据
  const loadSplitData = async () => {
    setLoading(true);
    try {
      const response = await getSplitOrders();
      if (response.code === 200) {
        setSplitData(response.data);
      } else {
        message.error(response.message || "获取数据失败");
      }
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取拆单数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadSplitData();
  }, []);

  // 显示编辑模态框
  const showEditModal = (record: SplitOrder) => {
    setSelectedOrder(record);
    setIsEditModalVisible(true);
  };

  // 处理编辑模态框取消
  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理编辑模态框确认
  const handleEditModalOk = (values: EditFormValues) => {
    console.log("编辑表单数据:", values);
    // 这里可以调用API更新数据
    setIsEditModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    loadSplitData();
  };

  // 显示拆单模态框
  const showSplitModal = (record: SplitOrder) => {
    setSelectedOrder(record);
    setIsSplitModalVisible(true);
  };

  // 处理拆单模态框取消
  const handleSplitModalCancel = () => {
    setIsSplitModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理拆单模态框确认
  const handleSplitModalOk = (values: SplitFormValues) => {
    console.log("拆单表单数据:", values);
    // 这里可以调用API更新数据
    setIsSplitModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    loadSplitData();
  };

  const columns: ColumnsType<SplitOrder> = [
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
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
    },
    {
      title: "木门/柜体",
      dataIndex: "doorBody",
      key: "doorBody",
      render: (text: string) => {
        if (!text) return null;

        const items = text.split(",");
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(":");
              const name = parts[0];
              const time = parts[1];
              const days = parts[2];

              if (parts.length === 3 && name && time && days) {
                const dayCount = parseInt(days);
                const dayColor = dayCount >= 3 ? "red" : "-";
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}:{time}{" "}
                    <span style={{ color: dayColor }}>{days}天</span>
                  </div>
                );
              } else if (parts.length >= 2 && name && time) {
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}:{time}
                  </div>
                );
              } else {
                return (
                  <div key={index} style={{ marginLeft: "20px" }}>
                    {name}: -
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
      render: (text: string) => {
        if (!text) return null;

        const items = text.split(",");
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(":");
              const name = parts[0];
              const time = parts[1];
              const days = parts[2];

              if (parts.length === 3 && name && time && days) {
                const dayCount = parseInt(days);
                const dayColor = dayCount >= 3 ? "red" : "";
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}:{time}{" "}
                    <span style={{ color: dayColor }}>{days}天</span>
                  </div>
                );
              } else if (parts.length >= 2 && name && time) {
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}:{time}
                  </div>
                );
              } else {
                return (
                  <div key={index} style={{ marginLeft: "20px" }}>
                    {name}: -
                  </div>
                );
              }
            })}
          </div>
        );
      },
    },
    {
      title: "报价状态",
      dataIndex: "priceState",
      key: "priceState",
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
    },
    {
      title: "定板日期",
      dataIndex: "fixedTime",
      key: "fixedTime",
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
    },
    {
      title: "拆单完成日期",
      dataIndex: "finishTime",
      key: "finishTime",
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
    },
    {
      title: "订单类型",
      dataIndex: "orderType",
      key: "orderType",
    },
    {
      title: "订单状态",
      dataIndex: "states",
      key: "states",
      render: (text: string) => {
        if (text === "已完成") {
          return <Tag color="green">{text}</Tag>;
        }
        return text;
      },
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
      render: (_: unknown, record: SplitOrder) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => showSplitModal(record)}
          >
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                订单编号
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                订单名称
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                拆单状态
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                设计师
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                销售员
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                拆单员
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                类目
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                报价状态
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                订单类型
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
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16 text-right">
                是否下单
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
        <Table<SplitOrder>
          columns={columns}
          dataSource={splitData}
          loading={loading}
          bordered={false}
          pagination={{ pageSize: 10 }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.designNumber}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* 编辑订单模态框 */}
      <EditOrderModal
        visible={isEditModalVisible}
        onCancel={handleEditModalCancel}
        onOk={handleEditModalOk}
        orderData={selectedOrder}
      />

      {/* 拆单操作模态框 */}
      <SplitOrderModal
        visible={isSplitModalVisible}
        onCancel={handleSplitModalCancel}
        onOk={handleSplitModalOk}
        orderData={selectedOrder}
      />
    </div>
  );
};

export default DesignPage;
