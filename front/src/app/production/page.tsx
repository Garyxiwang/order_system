"use client";

import React, { useState, useEffect } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule, PermissionService } from "@/utils/permissions";
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
  Modal,
  Tag,
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
  type PaginatedResponse,
  type ProductionListResponse,
} from "../../services/productionApi";
import EditProductionModal from "./editProductionModal";
import PurchaseStatusModal from "./purchaseStatusModal";
import ProductionProgressModal from "./productionProgressModal";
import PurchaseDetailModal from "./purchaseDetailModal";

const ProductionPage: React.FC = () => {
  const [productionData, setProductionData] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);
  const [
    isProductionProgressModalVisible,
    setIsProductionProgressModalVisible,
  ] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isOrderStatusModalVisible, setIsOrderStatusModalVisible] =
    useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("");
  const [orderStatusEditingRecord, setOrderStatusEditingRecord] =
    useState<ProductionOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null
  );

  const [searchForm] = Form.useForm();

  // 组件挂载时加载数据
  useEffect(() => {
    searchForm.setFieldsValue({
      splitStatus: ["未齐料", "已齐料", "已下料", "已入库", "已发货"],
    });
    handleSearch();
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
      const response = await updateProductionOrder(
        selectedOrder.id.toString(),
        values
      );
      if (response.code === 200) {
        message.success("更新成功");
        setIsEditModalVisible(false);
        setSelectedOrder(null);
        // 重新加载数据
        await handleSearch();
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
    setIsProductionProgressModalVisible(true);
  };

  // 显示采购状态模态框
  const showPurchaseModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setIsPurchaseModalVisible(true);
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

  // 处理采购状态模态框取消
  const handlePurchaseModalCancel = () => {
    setIsPurchaseModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理采购状态模态框确认
  const handlePurchaseModalOk = async (values: Partial<ProductionOrder>) => {
    setIsPurchaseModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    await handleSearch();
  };

  // 处理生产进度模态框取消
  const handleProductionProgressModalCancel = () => {
    setIsProductionProgressModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理生产进度模态框确认
  const handleProductionProgressModalOk = async (
    values: Record<string, string | number | null>
  ) => {
    setIsProductionProgressModalVisible(false);
    setSelectedOrder(null);
    // 重新加载数据
    await handleSearch();
  };

  // 显示订单状态修改弹窗
  const showOrderStatusModal = (record: ProductionOrder) => {
    setOrderStatusEditingRecord(record);
    setSelectedOrderStatus(record.order_status || "");
    setIsOrderStatusModalVisible(true);
  };

  // 关闭订单状态修改弹窗
  const handleOrderStatusModalCancel = () => {
    setIsOrderStatusModalVisible(false);
    setOrderStatusEditingRecord(null);
    setSelectedOrderStatus("");
  };

  // 处理订单状态修改
  const handleUpdateOrderStatus = async () => {
    if (!orderStatusEditingRecord || !selectedOrderStatus) {
      message.warning("请选择订单状态");
      return;
    }
    try {
      setLoading(true);

      // 调用API更新订单状态
      const response = await updateProductionOrder(
        orderStatusEditingRecord.id.toString(),
        {
          order_status: selectedOrderStatus,
        }
      );

      if (response.code === 200) {
        message.success(`订单状态修改成功`);
        await handleSearch(); // 重新加载数据
        handleOrderStatusModalCancel();
      } else {
        message.error(response.message || "订单状态修改失败");
      }
    } catch (error) {
      message.error("订单状态修改失败，请稍后重试");
      console.error("订单状态修改失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = async (
    customParams?: Record<string, string | string[]>,
    page?: number,
    size?: number
  ) => {
    setLoading(true);
    try {
      const values = customParams || searchForm.getFieldsValue();
      console.log("搜索条件:", values);

      const searchParams = {
        order_number: values.orderNumber,
        customer_name: values.orderName,
        order_status: values.splitStatus,
        // 时间筛选参数
        expected_delivery_start: values.expectedDeliveryDate?.[0]?.format
          ? values.expectedDeliveryDate[0].format("YYYY-MM-DD")
          : values.expectedDeliveryDate?.[0],
        expected_delivery_end: values.expectedDeliveryDate?.[1]?.format
          ? values.expectedDeliveryDate[1].format("YYYY-MM-DD")
          : values.expectedDeliveryDate?.[1],
        cutting_date_start: values.orderDate?.[0]?.format
          ? values.orderDate[0].format("YYYY-MM-DD")
          : values.orderDate?.[0],
        cutting_date_end: values.orderDate?.[1]?.format
          ? values.orderDate[1].format("YYYY-MM-DD")
          : values.orderDate?.[1],
        expected_shipment_start: values.expectedDate?.[0]?.format
          ? values.expectedDate[0].format("YYYY-MM-DD")
          : values.expectedDate?.[0],
        expected_shipment_end: values.expectedDate?.[1]?.format
          ? values.expectedDate[1].format("YYYY-MM-DD")
          : values.expectedDate?.[1],
        actual_shipment_start: values.actualDate?.[0]?.format
          ? values.actualDate[0].format("YYYY-MM-DD")
          : values.actualDate?.[0],
        actual_shipment_end: values.actualDate?.[1]?.format
          ? values.actualDate[1].format("YYYY-MM-DD")
          : values.actualDate?.[1],
      };

      // 过滤掉空值
      const filteredParams = Object.fromEntries(
        Object.entries(searchParams).filter(
          ([_, value]) => value !== undefined && value !== "" && value !== null
        )
      );

      const params = {
        ...filteredParams,
        page: page || currentPage,
        page_size: size || pageSize,
      };

      console.log("searchParams", filteredParams);
      const response = await getProductionOrders(params);
      if (response.code === 200) {
        // 后端返回的数据结构：{code, message, data: ProductionOrder[], total, page, page_size, total_pages}
        setProductionData(response.data || []);
        setTotal(response.total || 0);
        setCurrentPage(response.page || page || 1);
        setPageSize(response.page_size || size || pageSize);

        // 如果不是自定义参数调用，搜索时重置到第一页
        if (!customParams && !page) {
          setCurrentPage(1);
        }
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
  const handleReset = async () => {
    // 重置表单
    searchForm.resetFields();
    // 重置分页状态
    setCurrentPage(1);
    // 重新加载所有数据
    await handleSearch();
  };

  // 处理分页变化
  const handlePageChange = async (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    let newPage = page;

    // 如果是pageSize变化，重置到第一页
    if (size && size !== pageSize) {
      setPageSize(size);
      newPage = 1;
      setCurrentPage(1);
    } else {
      setCurrentPage(page);
    }

    // 获取当前搜索条件
    const formValues = searchForm.getFieldsValue();
    const searchParams: Record<string, string | string[]> = {
      orderNumber: formValues.orderNumber,
      orderName: formValues.orderName,
      splitStatus: formValues.splitStatus,
      // 时间筛选参数
      expectedDeliveryDate: formValues.expectedDeliveryDate,
      orderDate: formValues.orderDate,
      entryDate: formValues.entryDate,
      expectedDate: formValues.expectedDate,
      actualDate: formValues.actualDate,
    };

    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null
      )
    );

    await handleSearch(filteredParams, newPage, newPageSize);
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
          // 计算逻辑：拆单下单日期 - 客户打款日期
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
      dataIndex: "purchase_status",
      key: "purchase_status",
      render: (text: string, record: ProductionOrder) => {
        if (!text) {
          return "-";
        }

        const items = text.split("; ");
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(":");
              const name = parts[0];
              const status = parts[1];

              if (parts.length >= 2 && name !== undefined) {
                const isCompleted = status && status.trim() !== "";
                return (
                  <div key={index}>
                    {isCompleted ? (
                      <CheckOutlined
                        style={{ color: "green", marginRight: "4px" }}
                      />
                    ) : (
                      <span style={{ marginRight: "18px" }} />
                    )}
                    {name}: {status ? status : "-"}
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
      render: (text: string) => {
        // 向后兼容旧字段
        const status = text || "";
        let color = "";
        if (status === "已完成") {
          color = "green";
        }
        return <Tag color={color}>{status}</Tag>;
      },
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
          {/* 编辑订单 - 发货员、超管 */}
          {PermissionService.canEditProductionOrder() && (
            <Button
              type="link"
              size="small"
              disabled={record.order_status === "已完成"}
              onClick={() => showEditModal(record)}
            >
              编辑订单
            </Button>
          )}
          
          {/* 采购状态 - 采购、超管 */}
          {PermissionService.canManagePurchaseStatus() && (
            <Button
              type="link"
              size="small"
              disabled={record.order_status === "已完成"}
              onClick={() => showPurchaseModal(record)}
            >
              采购状态
            </Button>
          )}
          
          {/* 生产进度 - 车间、超管 */}
          {PermissionService.canManageProductionProgress() && (
            <Button
              type="link"
              size="small"
              disabled={record.order_status === "已完成"}
              onClick={() => showProgressModal(record)}
            >
              生产进度
            </Button>
          )}
          
          {/* 订单状态 - 发货员、超管 */}
          {PermissionService.canManageProductionOrderStatus() && (
            <Button
              type="link"
              size="small"
              disabled={record.order_status === "已完成"}
              onClick={() => showOrderStatusModal(record)}
            >
              订单状态
            </Button>
          )}
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
                  <Option value="已发货">已发货</Option>
                  <Option value="已完成">已完成</Option>
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
                onClick={() => handleSearch()}
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
        {/* 导出按钮 - 财务、超管 */}
        {PermissionService.canExportProduction() && (
          <div className="flex justify-end items-center mb-4">
            <Button
              icon={<ExportOutlined />}
              size="small"
              className="border-gray-300 hover:border-blue-500"
            >
              导出
            </Button>
          </div>
        )}
        {/* 表格区域 */}
        <Table<ProductionOrder>
          columns={columns}
          dataSource={productionData}
          loading={loading}
          bordered={false}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
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

      {/* 采购状态模态框 */}
      <PurchaseStatusModal
        visible={isPurchaseModalVisible}
        order={selectedOrder}
        onCancel={handlePurchaseModalCancel}
        onOk={handlePurchaseModalOk}
      />

      {/* 生产进度模态框 */}
      <ProductionProgressModal
        visible={isProductionProgressModalVisible}
        order={selectedOrder}
        onCancel={handleProductionProgressModalCancel}
        onOk={handleProductionProgressModalOk}
      />

      {/* 采购详情模态框 */}
      <PurchaseDetailModal
        visible={isDetailModalVisible}
        order={selectedOrder}
        onCancel={handleDetailModalCancel}
      />

      {/* 订单状态修改Modal */}
      <Modal
        title="修改订单状态"
        open={isOrderStatusModalVisible}
        onOk={handleUpdateOrderStatus}
        onCancel={handleOrderStatusModalCancel}
        okText="确认"
        cancelText="取消"
        width={400}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>订单号：</strong>
            {orderStatusEditingRecord?.order_number}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {orderStatusEditingRecord?.customer_name}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>当前状态：</strong>
            {orderStatusEditingRecord?.order_status}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>选择新状态：</strong>
            <Select
              value={selectedOrderStatus}
              onChange={setSelectedOrderStatus}
              placeholder="请选择订单状态"
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Option value="未齐料">未齐料</Option>
              <Option value="已齐料">已齐料</Option>
              <Option value="已下料">已下料</Option>
              <Option value="已入库">已入库</Option>
              <Option value="已发货">已发货</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function ProductionPageWithGuard() {
  return (
    <RouteGuard requiredModule={PageModule.PRODUCTION}>
      <ProductionPage />
    </RouteGuard>
  );
}
