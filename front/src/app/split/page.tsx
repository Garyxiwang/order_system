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
  DatePicker,
  Modal,
  Form,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  CheckOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { getSplitOrders, type SplitOrder } from "../../services/splitApi";
import EditOrderModal from "./editOrderModal";
import type { EditFormValues } from "./editOrderModal";
import SplitOrderModal from "./SplitOrderModal";
import type { SplitFormValues } from "./SplitOrderModal";
import type { Dayjs } from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;
const DesignPage: React.FC = () => {
  const [splitData, setSplitData] = useState<SplitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SplitOrder | null>(null);
  const [searchForm] = Form.useForm();

  // 订单状态修改相关状态
  const [isOrderStatusModalVisible, setIsOrderStatusModalVisible] =
    useState(false);
  const [orderStatusEditingRecord, setOrderStatusEditingRecord] =
    useState<SplitOrder | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("");

  // 报价状态修改相关状态
  const [isPriceStatusModalVisible, setIsPriceStatusModalVisible] =
    useState(false);
  const [priceStatusEditingRecord, setPriceStatusEditingRecord] =
    useState<SplitOrder | null>(null);
  const [selectedPriceStatus, setSelectedPriceStatus] = useState<string>("");
  const [actualPaymentDate, setActualPaymentDate] = useState<Dayjs | null>(
    null
  );
  const [dateError, setDateError] = useState<string>("");

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

  // 组件挂载时加载数据和设置默认筛选条件
  useEffect(() => {
    // 设置订单状态默认选择"拆单中"和"已审核"
    searchForm.setFieldsValue({
      splitStatus: ["未开始", "拆单中", "未审核", "已审核", "撤销中"], // -1: 拆单中, 1: 已审核
    });
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
  };

  // 处理搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    console.log("搜索条件:", values);
    // 这里可以调用API进行搜索
    loadSplitData();
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    // 重新加载数据
    loadSplitData();
  };

  // 显示订单状态修改弹窗
  const showOrderStatusModal = (record: SplitOrder) => {
    setOrderStatusEditingRecord(record);
    setSelectedOrderStatus(record.states || "");
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
      // 这里可以调用实际的API
      // const updateData = {
      //   ...orderStatusEditingRecord,
      //   states: selectedOrderStatus,
      //   ...(selectedOrderStatus === "已完成" && {
      //     cabinetArea: cabinetArea,
      //     wallPanelArea: wallPanelArea
      //   })
      // };
      // const response = await updateSplitOrder(
      //   orderStatusEditingRecord.designNumber,
      //   updateData
      // );

      message.success(`订单状态修改成功`);
      await loadSplitData(); // 重新加载数据
      handleOrderStatusModalCancel();
    } catch (error) {
      message.error("订单状态修改失败，请稍后重试");
      console.error("订单状态修改失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 显示报价状态修改弹窗
  const showPriceStatusModal = (record: SplitOrder) => {
    setPriceStatusEditingRecord(record);
    setSelectedPriceStatus(record.priceState || "");
    setIsPriceStatusModalVisible(true);
  };

  // 关闭报价状态修改弹窗
  const handlePriceStatusModalCancel = () => {
    setIsPriceStatusModalVisible(false);
    setPriceStatusEditingRecord(null);
    setSelectedPriceStatus("");
    setActualPaymentDate(null);
    setDateError("");
  };

  // 处理报价状态修改
  const handleUpdatePriceStatus = async () => {
    if (!priceStatusEditingRecord || !selectedPriceStatus) {
      message.warning("请选择报价状态");
      return;
    }

    // 如果选择了"已打款"但没有选择日期，提示用户
    if (selectedPriceStatus === "已打款" && !actualPaymentDate) {
      setDateError("请选择实际打款日期");
      return;
    }

    // 清除日期错误提示
    setDateError("");

    try {
      setLoading(true);
      // 这里可以调用实际的API
      // const updateData = {
      //   ...priceStatusEditingRecord,
      //   priceState: selectedPriceStatus,
      //   ...(selectedPriceStatus === "已打款" && actualPaymentDate && {
      //     actualPaymentDate: actualPaymentDate.format("YYYY-MM-DD")
      //   })
      // };
      // const response = await updateSplitOrder(
      //   priceStatusEditingRecord.designNumber,
      //   updateData
      // );

      // 模拟成功响应
      const dateInfo =
        selectedPriceStatus === "已打款" && actualPaymentDate
          ? `，实际打款日期：${actualPaymentDate.format("YYYY-MM-DD")}`
          : "";
      message.success(`报价状态修改成功${dateInfo}`);
      await loadSplitData(); // 重新加载数据
      handlePriceStatusModalCancel();
    } catch (error) {
      message.error("报价状态修改失败，请稍后重试");
      console.error("报价状态修改失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理下单操作
  const handlePlaceOrder = (record: SplitOrder) => {
    // 检查打款状态
    if (record.priceState !== "已打款") {
      message.warning("只有已打款的订单才能下单");
      return;
    }

    Modal.confirm({
      title: "确认下单",
      content: `确定要为订单 ${record.designNumber} 下单吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          setLoading(true);
          // 这里可以添加实际的API调用
          // const response = await updateSplitOrder(record.designNumber, {
          //   ...record,
          //   state: "已下单",
          // });

          // 模拟成功响应
          message.success("下单成功");
          await loadSplitData(); // 重新加载数据
        } catch (error) {
          message.error("下单失败，请稍后重试");
          console.error("下单失败:", error);
        } finally {
          setLoading(false);
        }
      },
    });
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
      width: 150,
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
      title: "拆单员",
      dataIndex: "splitPerson",
      key: "splitPerson",
      render: (text: string) => {
        if (!text) return "-";
        return text;
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
      title: "外购项",
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
      title: "完成日期",
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
      title: "订单金额",
      dataIndex: "orderAmount",
      key: "orderAmount",
      render: (text: string) => {
        if (!text) return "-";
        return `¥${text}`;
      },
    },
    {
      title: "设计面积",
      dataIndex: "designArea",
      key: "designArea",
      render: (text: string) => {
        if (!text) return "-";
        return `${text}㎡`;
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
      title: "订单状态",
      dataIndex: "states",
      key: "states",
      fixed: "right",
      render: (text: string) => {
        if (text === "已完成") {
          return <Tag color="green">{text}</Tag>;
        }
        return text;
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 145,
      render: (_: unknown, record: SplitOrder) => (
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
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => showSplitModal(record)}
          >
            更新进度
          </Button>

          <Button
            type="link"
            size="small"
            onClick={() => showOrderStatusModal(record)}
          >
            订单状态
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => showPriceStatusModal(record)}
          >
            报价状态
          </Button>
          <Button
            type="link"
            size="small"
            disabled={record.priceState !== "已打款"}
            onClick={() => handlePlaceOrder(record)}
          >
            下单
          </Button>
        </div>
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
              <Form.Item name="designer" label="设计师" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="designer1">设计师1</Option>
                  <Option value="designer2">设计师2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="salesPerson" label="销售员" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="designer1">销售员1</Option>
                  <Option value="designer2">销售员2</Option>
                  <Option value="designer2">销售员3</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="splitPerson" label="拆单员" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="designer1">拆单员1</Option>
                  <Option value="designer2">拆单员2</Option>
                  <Option value="designer2">拆单员3</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderCategory" label="下单类目" className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="全部"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="1">木门</Option>
                  <Option value="2">柜体</Option>
                  <Option value="3">石材</Option>
                  <Option value="4">板材</Option>
                  <Option value="5">铝合金门</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={6} className="py-2">
              <Form.Item name="priceStatus" label="报价状态" className="mb-0">
                <Select
                  placeholder="全部"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="normal">未打款</Option>
                  <Option value="normal">已打款</Option>
                  <Option value="important">报价已发未打款</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderType" label="订单类型" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="design">设计单</Option>
                  <Option value="development">生产单</Option>
                  <Option value="finish">成品单</Option>
                </Select>
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
                  <Option value="未开始">未开始</Option>
                  <Option value="拆单中">拆单中</Option>
                  <Option value="未审核">未审核</Option>
                  <Option value="已审核">已审核</Option>
                  <Option value="已完成">已完成</Option>
                  <Option value="撤销中">撤销中</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item
                name="orderDateRange"
                label="下单日期"
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
                name="finishDateRange"
                label="完成日期"
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
        {/* 新增按钮 */}
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
            {orderStatusEditingRecord?.designNumber}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {orderStatusEditingRecord?.customerName}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>当前状态：</strong>
            {orderStatusEditingRecord?.states}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>选择新状态：</strong>
            <Select
              value={selectedOrderStatus}
              onChange={setSelectedOrderStatus}
              placeholder="请选择订单状态"
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Option value="未开始">未开始</Option>
              <Option value="拆单中">拆单中</Option>
              <Option value="未审核">未审核</Option>
              <Option value="已审核">已审核</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* 报价状态修改Modal */}
      <Modal
        title="修改报价状态"
        open={isPriceStatusModalVisible}
        onOk={handleUpdatePriceStatus}
        onCancel={handlePriceStatusModalCancel}
        okText="确认"
        cancelText="取消"
        width={400}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>订单号：</strong>
            {priceStatusEditingRecord?.designNumber}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {priceStatusEditingRecord?.customerName}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>当前状态：</strong>
            {priceStatusEditingRecord?.priceState}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>选择新状态：</strong>
            <Select
              value={selectedPriceStatus}
              onChange={setSelectedPriceStatus}
              placeholder="请选择报价状态"
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Option value="未打款">未打款</Option>
              <Option value="已打款">已打款</Option>
              <Option value="报价已发未打款">报价已发未打款</Option>
            </Select>
          </div>
          {selectedPriceStatus === "已打款" && (
            <div>
              <strong>实际打款日期：</strong>
              <DatePicker
                value={actualPaymentDate}
                onChange={(date) => {
                  setActualPaymentDate(date);
                  if (date) {
                    setDateError("");
                  }
                }}
                placeholder="请选择实际打款日期"
                style={{ width: "100%", marginTop: "8px" }}
                format="YYYY-MM-DD"
              />
              {dateError && (
                <div
                  style={{
                    color: "#ff4d4f",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {dateError}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DesignPage;
