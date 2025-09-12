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
  message,
  DatePicker,
  Form,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  CheckOutlined,
  ExportOutlined,
} from "@ant-design/icons";
const { Option } = Select;
const { RangePicker } = DatePicker;
import {
  getProductionOrders,
  searchProductionOrders,
  updateProductionOrder,
  type ProductionOrder,
} from "../../services/productionApi";
import EditProductionModal from "./editProductionModal";
import ProgressModal from "./progressModal";
import PurchaseDetailModal from "./purchaseDetailModal";

const ProductionPage: React.FC = () => {
  const [productionData, setProductionData] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null
  );
  const [modalType, setModalType] = useState<"progress" | "purchase">(
    "progress"
  );
  const [searchForm] = Form.useForm();

  // 加载生产订单数据
  const loadProductionData = async () => {
    setLoading(true);
    try {
      const response = await getProductionOrders();
      if (response.code === 200) {
        setProductionData(response.data);
      } else {
        message.error(response.message || "获取数据失败");
      }
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取生产订单数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    searchForm.setFieldsValue({
      splitStatus: ["未齐料", "已齐料", "已下料", "已入库"], // -1: 拆单中, 1: 已审核
    });
    loadProductionData();
  }, []);

  // 显示编辑模态框
  const showEditModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setIsEditModalVisible(true);
  };

  // 处理编辑模态框取消
  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理编辑模态框确认
  const handleEditModalOk = async (values: Partial<ProductionOrder>) => {
    if (!selectedOrder?.id) {
      message.error("订单ID不存在");
      return;
    }

    try {
      const response = await updateProductionOrder(selectedOrder.id.toString(), values);
      if (response.code === 200) {
        message.success("更新成功");
        setIsEditModalVisible(false);
        setSelectedOrder(null);
        // 重新加载数据
        loadProductionData();
      } else {
        message.error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("更新生产订单失败:", error);
      message.error("更新失败，请稍后重试");
    }
  };

  // 显示生产进度模态框
  const showProgressModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setModalType("progress");
    setIsProgressModalVisible(true);
  };

  // 显示采购状态模态框
  const showPurchaseModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setModalType("purchase");
    setIsProgressModalVisible(true);
  };

  // 显示采购状态详情模态框
  const showDetailModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setIsDetailModalVisible(true);
  };

  // 处理详情模态框取消
  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理模态框取消
  const handleProgressModalCancel = () => {
    setIsProgressModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理模态框确认
  const handleProgressModalOk = (values: Partial<ProductionOrder>) => {
    console.log("表单数据:", values);
    // 这里可以调用API更新数据
    setIsProgressModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    loadProductionData();
    message.success(
      modalType === "progress" ? "生产进度更新成功" : "采购状态更新成功"
    );
  };

  // 处理搜索
  const handleSearch = async () => {
    const values = searchForm.getFieldsValue();
    console.log("搜索条件:", values);

    setLoading(true);
    try {
      const response = await getProductionOrders({
        order_number: values.orderNumber,
        customer_name: values.orderName,
        order_status: values.splitStatus,
      });
      if (response.code === 200) {
        setProductionData(response.data);
      } else {
        message.error(response.message || "搜索失败");
      }
    } catch (error) {
      message.error("搜索失败，请稍后重试");
      console.error("搜索生产订单失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    // 重新加载数据
    loadProductionData();
  };

  // 表格列定义
  const columns: ColumnsType<ProductionOrder> = [
    {
      title: "订单编号",
      dataIndex: "order_number",
      key: "order_number",
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 150,
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      render: (text: string) => text || "-",
    },
    {
      title: "是否安装",
      dataIndex: "is_installation",
      key: "is_installation",
      render: (value: boolean) => <span>{value ? "是" : "否"}</span>,
    },
    {
      title: "客户打款日期",
      dataIndex: "customer_payment_date",
      key: "customer_payment_date",
      render: (text: string) => text || "-",
    },
    {
      title: "拆单下单日期",
      dataIndex: "split_order_date",
      key: "split_order_date",
      render: (text: string) => text || "-",
    },
    {
      title: "下单天数",
      dataIndex: "order_days",
      key: "order_days",
      render: (value: string, record: ProductionOrder) => {
        if (record.split_order_date && record.customer_payment_date) {
          const splitDate = new Date(record.split_order_date);
          const paymentDate = new Date(record.customer_payment_date);
          const diffTime = splitDate.getTime() - paymentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return `${diffDays}天`;
        }
        return value ? `${value}天` : "-";
      },
    },
    {
      title: "预计交货日期",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      render: (text: string) => text || "-",
    },
    {
      title: "采购状态",
      dataIndex: "actualMaterialStatus",
      key: "actualMaterialStatus",
      render: (text: string, record: ProductionOrder) => {
        if (!text) return null;

        const items = text.split(",");
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(":");
              const name = parts[0];
              const time = parts[1];

              if (parts.length >= 2 && name && time) {
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
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <Button
                type="link"
                size="small"
                onClick={() => showDetailModal(record)}
                style={{ padding: "0 4px", fontSize: "12px" }}
              >
                详情
              </Button>
            </div>
          </div>
        );
      },
    },
    {
      title: "材料数量",
      dataIndex: "materialQuantity",
      key: "materialQuantity",
      render: (value, record: ProductionOrder) => {
        return (
          <div>
            <div>18板：{record.board_18 ? `${record.board_18}张` : "-"}</div>
            <div>09板：{record.board_09 ? `${record.board_09}张` : "-"}</div>
          </div>
        );
      },
    },
    {
      title: "下料日期",
      dataIndex: "cutting_date",
      key: "cutting_date",
      render: (text: string) => text || "-",
    },

    {
      title: "出货进度",
      dataIndex: "shipmentProgress",
      key: "shipmentProgress",
      render: (text, record: ProductionOrder) => {
        return (
          <div>
            <div>预计出货日期：{record.expected_shipping_date || "-"}</div>
            <div>实际出货日期：{record.actual_delivery_date || "-"}</div>
          </div>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      ellipsis: true,
      render: (text: string) => text || "-",
    },

    {
      title: "订单状态",
      dataIndex: "order_status",
      key: "order_status",
      fixed: "right",
    },
    {
      title: "操作",
      key: "action",
      width: 145,
      fixed: "right",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: "145px",
          }}
        >
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑订单
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => showPurchaseModal(record)}
          >
            采购状态
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => showProgressModal(record)}
          >
            生产进度
          </Button>
          <Button type="link" size="small">
            订单状态
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索Card */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Form
          form={searchForm}
          layout="inline"
          initialValues={{
            sort: "预计交货日期",
          }}
        >
          <Row gutter={24}>
            <Col span={6} className="py-2">
              <Form.Item name="orderNumber" label="订单编号" className="mb-0">
                <Input
                  placeholder="请输入"
                  className="rounded-md"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderName" label="客户名称" className="mb-0">
                <Input
                  placeholder="请输入"
                  className="rounded-md"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col span={6} className="py-2">
              <Form.Item name="splitStatus" label="订单状态" className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="全部状态"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="未齐料">未齐料</Option>
                  <Option value="已齐料">已齐料</Option>
                  <Option value="已下料">已下料</Option>
                  <Option value="已入库">已入库</Option>
                  <Option value="已出货">已出货</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item
                name="expectedDeliveryDate"
                label="预计交货日期"
                className="mb-0"
              >
                <RangePicker
                  placeholder={["开始日期", "结束日期"]}
                  className="rounded-md w-full"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderDate" label="下料日期" className="mb-0">
                <RangePicker
                  placeholder={["开始日期", "结束日期"]}
                  className="rounded-md w-full"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="entryDate" label="成品入库日期" className="mb-0">
                <RangePicker
                  placeholder={["开始日期", "结束日期"]}
                  className="rounded-md w-full"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item
                name="expectedDate"
                label="预计出货日期"
                className="mb-0"
              >
                <RangePicker
                  placeholder={["开始日期", "结束日期"]}
                  className="rounded-md w-full"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item
                name="actualDate"
                label="实际出货日期"
                className="mb-0"
              >
                <RangePicker
                  placeholder={["开始日期", "结束日期"]}
                  className="rounded-md w-full"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="sort" label="排序项" className="mb-0">
                <Select
                  placeholder="全部状态"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="预计交货日期">预计交货日期</Option>
                  <Option value="预计出货日期">预计出货日期</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Row className="mt-4">
          <Col span={24} className="text-right">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="middle"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSearch}
              >
                查询
              </Button>
              <Button
                size="middle"
                className="border-gray-300 hover:border-blue-500"
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 内容Card */}
      <Card variant="outlined">
        {/* 导出按钮 */}
        <div className="flex justify-end items-center mb-4">
          <Button
            icon={<ExportOutlined />}
            size="small"
            className="border-gray-300 hover:border-blue-500"
          >
            导出
          </Button>
        </div>
        {/* 表格区域 */}
        <Table<ProductionOrder>
          columns={columns}
          dataSource={productionData}
          loading={loading}
          bordered={false}
          pagination={{ pageSize: 10 }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.id}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* 编辑订单模态框 */}
      <EditProductionModal
        visible={isEditModalVisible}
        onCancel={handleEditModalCancel}
        onOk={handleEditModalOk}
        orderData={selectedOrder}
      />

      {/* 生产进度/采购状态模态框 */}
      <ProgressModal
        visible={isProgressModalVisible}
        order={selectedOrder}
        onCancel={handleProgressModalCancel}
        onOk={handleProgressModalOk}
        modalType={modalType}
      />

      {/* 采购详情模态框 */}
      <PurchaseDetailModal
        visible={isDetailModalVisible}
        order={selectedOrder}
        onCancel={handleDetailModalCancel}
      />
    </div>
  );
};

export default ProductionPage;
