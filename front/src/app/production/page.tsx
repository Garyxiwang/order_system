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
  type ProductionOrder,
} from "../../services/productionApi";
import EditProductionModal from "./editProductionModal";
import ProgressModal from "./progressModal";

const ProductionPage: React.FC = () => {
  const [productionData, setProductionData] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
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
  const handleEditModalOk = (values: Partial<ProductionOrder>) => {
    console.log("编辑表单数据:", values);
    // 这里可以调用API更新数据
    setIsEditModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    loadProductionData();
    message.success("更新成功");
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
      const response = await searchProductionOrders({
        orderCode: values.orderCode,
        customerName: values.customerName,
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
      title: "订单编码",
      dataIndex: "orderCode",
      key: "orderCode",
    },
    {
      title: "客户名称",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "地址",
      dataIndex: "deliveryAddress",
      key: "deliveryAddress",
      ellipsis: true,
    },
    {
      title: "是否安装",
      dataIndex: "isInstallation",
      key: "isInstallation",
      render: (value: boolean) => <span>{value ? "是" : "否"}</span>,
    },
    {
      title: "客户打款日期",
      dataIndex: "customerPaymentDate",
      key: "customerPaymentDate",
      render: (text: string) => text || "-",
    },
    {
      title: "拆单下单日期",
      dataIndex: "splitOrderDate",
      key: "splitOrderDate",
      render: (text: string) => text || "-",
    },
    {
      title: "下单天数",
      dataIndex: "orderDays",
      key: "orderDays",
      render: (value: number, record: ProductionOrder) => {
        if (record.splitOrderDate && record.customerPaymentDate) {
          const splitDate = new Date(record.splitOrderDate);
          const paymentDate = new Date(record.customerPaymentDate);
          const diffTime = splitDate.getTime() - paymentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return `${diffDays}天`;
        }
        return value ? `${value}天` : "-";
      },
    },
    {
      title: "预计交货日期",
      dataIndex: "expectedDeliveryDate",
      key: "expectedDeliveryDate",
      render: (text: string) => text || "-",
    },
    {
      title: "采购状态",
      dataIndex: "actualMaterialStatus",
      key: "actualMaterialStatus",
      render: (text: string) => {
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
            <div>18板：{record.board18}张</div>
            <div>09板：{record.board09}张</div>
          </div>
        );
      },
    },
    {
      title: "下料日期",
      dataIndex: "cuttingDate",
      key: "cuttingDate",
      render: (text: string) => text || "-",
    },
    {
      title: "成品入库日期",
      dataIndex: "warehouseDate",
      key: "warehouseDate",
      render: (text: string) =>  "-",
    },
    {
      title: "出货进度",
      dataIndex: "shipmentProgress",
      key: "shipmentProgress",
      render: (text, record: ProductionOrder) => {
        return (
          <div>
            <div>预计出货日期：{record.expectedShipmentDate || "-"}</div>
            <div>实际出货日期：{record.actualShipmentDate || "-"}</div>
          </div>
        );
      },
    },
    {
      title: "厂内生产项",
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
                    {name}:{time}
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
    // {
    //   title: "外购项",
    //   dataIndex: "external",
    //   key: "external",
    //   render: (text: string) => {
    //     if (!text) return null;

    //     const items = text.split(",");
    //     return (
    //       <div>
    //         {items.map((item, index) => {
    //           const parts = item.split(":");
    //           const name = parts[0];
    //           const time = parts[1];
    //           const days = parts[2];

    //           if (parts.length === 3 && name && time && days) {
    //             const dayCount = parseInt(days);
    //             const dayColor = dayCount >= 3 ? "red" : "";
    //             return (
    //               <div key={index}>
    //                 <CheckOutlined
    //                   style={{ color: "green", marginRight: "4px" }}
    //                 />
    //                 {name}:{time}{" "}
    //                 <span style={{ color: dayColor }}>{days}天</span>
    //               </div>
    //             );
    //           } else if (parts.length >= 2 && name && time) {
    //             return (
    //               <div key={index}>
    //                 <CheckOutlined
    //                   style={{ color: "green", marginRight: "4px" }}
    //                 />
    //                 {name}:{time}
    //               </div>
    //             );
    //           } else {
    //             return (
    //               <div key={index} style={{ marginLeft: "20px" }}>
    //                 {name}: -
    //               </div>
    //             );
    //           }
    //         })}
    //       </div>
    //     );
    //   },
    // },

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
      dataIndex: "status",
      key: "status",
      fixed: "right",
    },
    {
      title: "操作",
      key: "action",
      width: 145,
      fixed: "right",
      render: (_, record) => (
        <>
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
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索Card */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Form form={searchForm} layout="inline">
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
    </div>
  );
};

export default ProductionPage;
