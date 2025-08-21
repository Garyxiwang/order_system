"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

// 确保客户端也设置中文语言
dayjs.locale("zh-cn");
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
  Modal,
  DatePicker,
  Form,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  PlusOutlined,
  ExportOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import CreateOrderModal from "./createOrderModal";
import UpdateProgressModal from "./updateProgressModal";
import ProgressDetailModal from "./progressDetailModal";
import {
  getDesignOrders,
  createDesignOrder,
  updateDesignOrder,
  type DesignOrder,
} from "../../services/designApi";

const { Option } = Select;
const { RangePicker } = DatePicker;

const DesignPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DesignOrder | null>(null);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
  const [selectedOrderName, setSelectedOrderName] = useState<string>("");
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedProgressData, setSelectedProgressData] = useState<string[]>(
    []
  );
  const [designData, setDesignData] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusEditingRecord, setStatusEditingRecord] =
    useState<DesignOrder | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);

  const showModal = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  // 显示订单状态修改弹窗
  const showStatusModal = (record: DesignOrder) => {
    setStatusEditingRecord(record);
    setSelectedStatus(record.state || "");
    setIsStatusModalVisible(true);
  };

  // 关闭订单状态修改弹窗
  const handleStatusModalCancel = () => {
    setIsStatusModalVisible(false);
    setStatusEditingRecord(null);
    setSelectedStatus("");
  };

  // 处理订单状态修改
  const handleUpdateOrderStatus = async () => {
    if (!statusEditingRecord || !selectedStatus) {
      message.warning("请选择订单状态");
      return;
    }

    try {
      setLoading(true);
      const response = await updateDesignOrder(
        statusEditingRecord.orderNumber,
        {
          ...statusEditingRecord,
          state: selectedStatus,
        }
      );

      if (response.code === 200) {
        message.success("订单状态修改成功");
        await loadDesignData(); // 重新加载数据
        handleStatusModalCancel();
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

  const showEditModal = (record: DesignOrder) => {
    console.log("record", record);
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // 处理下单操作
  const handlePlaceOrder = (record: DesignOrder) => {
    Modal.confirm({
      title: "确认下单",
      content: `确定要为订单 ${record.orderNumber} 下单吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          setLoading(true);
          const response = await updateDesignOrder(record.orderNumber, {
            ...record,
            state: "已下单",
          });

          if (response.code === 200) {
            message.success("下单成功");
            await loadDesignData(); // 重新加载数据
          } else {
            message.error(response.message || "下单失败");
          }
        } catch (error) {
          message.error("下单失败，请稍后重试");
          console.error("下单失败:", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 处理撤销操作
  const handleCancelOrder = (record: DesignOrder) => {
    // 检查订单状态
    if (record.state !== "已下单") {
      message.warning("只有已下单的订单才能撤销");
      return;
    }

    Modal.confirm({
      title: "确认撤销",
      content: `确定要撤销订单 ${record.orderNumber} 吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          setLoading(true);
          const response = await updateDesignOrder(record.orderNumber, {
            ...record,
            state: "未下单",
          });

          if (response.code === 200) {
            message.success("撤销成功");
            await loadDesignData(); // 重新加载数据
          } else {
            message.error(response.message || "撤销失败");
          }
        } catch (error) {
          message.error("撤销失败，请稍后重试");
          console.error("撤销失败:", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 显示更新进度弹窗
  const showProgressModal = (record: DesignOrder) => {
    setSelectedOrderNumber(record.orderNumber);
    setSelectedOrderName(record.customerName || "");
    setIsProgressModalVisible(true);
  };

  // 关闭更新进度弹窗
  const handleProgressModalCancel = () => {
    setIsProgressModalVisible(false);
    setSelectedOrderNumber("");
  };

  // 显示进度详情弹窗
  const showDetailModal = (record: DesignOrder) => {
    setSelectedOrderNumber(record.orderNumber);
    setSelectedOrderName(record.customerName || "");
    setSelectedProgressData(record.progress ? record.progress.split(",") : []);
    setIsDetailModalVisible(true);
  };

  // 关闭进度详情弹窗
  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
    setSelectedOrderNumber("");
    setSelectedOrderName("");
    setSelectedProgressData([]);
  };

  const handleOk = async (values: {
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
    finishTime?: string;
    isSetup: boolean;
    designArea?: string;
    orderAmount?: string;
  }) => {
    try {
      setLoading(true);

      if (editingRecord) {
        // 编辑模式
        const response = await updateDesignOrder(editingRecord.orderNumber, {
          customerName: values.customerName,
          address: values.orderAddress,
          designer: values.designer,
          salesperson: values.salesperson,
          splitTime: values.splitDate || "",
          category: values.categories.join(","),
          orderType: values.orderType,
          remark: values.remark || "",
          isSetup: values.isSetup,
          designArea: values.designArea || "",
          orderAmount: values.orderAmount || "",
        });

        if (response.code === 200) {
          message.success("更新成功");
        } else {
          message.error(response.message || "更新失败");
          return;
        }
      } else {
        // 新增模式
        const response = await createDesignOrder({
          customerName: values.customerName,
          address: values.orderAddress,
          designer: values.designer,
          salesperson: values.salesperson,
          splitTime: values.splitDate || "",
          progress: "",
          category: values.categories.join(","),
          cycle: "0",
          state: "未下单",
          orderType: values.orderType,
          remark: values.remark || "",
          isSetup: values.isSetup,
          designArea: values.designArea || "",
          orderAmount: values.orderAmount || "",
        });

        if (response.code === 200) {
          message.success("创建成功");
        } else {
          message.error(response.message || "创建失败");
          return;
        }
      }

      // 重新加载数据
      await loadDesignData();
      setIsModalVisible(false);
      setEditingRecord(null);
    } catch (error) {
      message.error("操作失败，请稍后重试");
      console.error("操作失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // 加载设计订单数据
  const loadDesignData = async () => {
    try {
      setLoading(true);
      const response = await getDesignOrders();
      if (response.code === 200) {
        setDesignData(response.data);
      } else {
        message.error(response.message || "获取数据失败");
      }
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索功能
  const handleSearch = () => {
    const formValues = searchForm.getFieldsValue();
    console.log("搜索条件:", formValues);
    console.log("当前筛选状态:", filterStatuses);
  };

  // 处理重置功能
  const handleReset = () => {
    // 重置表单
    searchForm.resetFields();
    setFilterStatuses([]);
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadDesignData();
  }, []); // 根据筛选条件过滤数据
  const filteredDesignData = designData.filter((item) => {
    // 订单状态筛选
    if (filterStatuses.length > 0 && !filterStatuses.includes(item.state)) {
      return false;
    }
    return true;
  });

  const columns: ColumnsType<DesignOrder> = [
    {
      title: "订单编号",
      dataIndex: "orderNumber",
      key: "orderNumber",
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
      title: "设计过程",
      dataIndex: "progress",
      key: "progress",
      width: 250,
      render: (text: string, record: DesignOrder) => {
        if (!text) return "-";
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        const displayItems = items;

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
            {displayItems.slice(0, 3).map((item, itemIndex) => {
              const { status, time } = parseProgressItem(item);

              return (
                <div key={itemIndex}>
                  {time ? (
                    <span>
                      <CheckOutlined
                        style={{ color: "green", marginRight: "4px" }}
                      />
                      {status}：
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        ({time})
                      </span>
                    </span>
                  ) : (
                    <span>{status}：-</span>
                  )}
                </div>
              );
            })}
            {displayItems.length >= 3 && (
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
            )}
          </div>
        );
      },
    },
    {
      title: "下单类目",
      dataIndex: "category",
      key: "category",
      render: (text: string) => {
        if (!text) return "-";
        const categories = text.split(",");
        return (
          <div>
            {categories.map((category, index) => (
              <div key={index}>{category.trim()}</div>
            ))}
          </div>
        );
      },
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
      title: "下单日期",
      dataIndex: "finishTime",
      key: "finishTime",
      render: (text: string) => <div>{text || "-"}</div>,
    },
    {
      title: "订单类型",
      dataIndex: "orderType",
      key: "orderType",
    },
    {
      title: "是否安装",
      dataIndex: "isSetup",
      key: "isSetup",
      render: (text: boolean) => <div>{text ? "是" : "否"}</div>,
    },
    {
      title: "设计面积",
      dataIndex: "designArea",
      key: "designArea",
      render: (text: string) => <div>{text ? `${text}㎡` : "-"}</div>,
    },
    {
      title: "订单金额",
      dataIndex: "orderAmount",
      key: "orderAmount",
      render: (text: string) => (
        <div>
          {text
            ? `¥${Number(text).toLocaleString("zh-CN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "-"}
        </div>
      ),
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
      dataIndex: "state",
      fixed: "right",
      key: "state",
      render: (text: string) => {
        if (text === "已下单") {
          return <Tag color="green">{text}</Tag>;
        }
        return text;
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      render: (_: unknown, record: DesignOrder) => (
        <div style={{ width: "120px" }}>
          <Row gutter={[4, 4]}>
            <Col span={12}>
              <Button
                type="link"
                size="small"
                onClick={() => showEditModal(record)}
                disabled={record.state === "已下单"}
                style={{ padding: "0 4px", width: "100%" }}
              >
                编辑
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="link"
                size="small"
                disabled={record.state === "已下单"}
                onClick={() => showProgressModal(record)}
                style={{ padding: "0 4px", width: "100%" }}
              >
                更新进度
              </Button>
            </Col>
            {record.state === "已下单" && (
              <Col span={12}>
                <Button
                  type="link"
                  size="small"
                  disabled={record.state !== "已下单"}
                  onClick={() => handleCancelOrder(record)}
                  style={{ padding: "0 4px", width: "100%" }}
                >
                  撤销
                </Button>
              </Col>
            )}
            {record.state !== "已下单" && (
              <Col span={12}>
                <Button
                  type="link"
                  size="small"
                  disabled={record.state === "已下单"}
                  onClick={() => handlePlaceOrder(record)}
                  style={{ padding: "0 4px", width: "100%" }}
                >
                  下单
                </Button>
              </Col>
            )}
            {/* <Col span={12}>
              <Button
                type="link"
                size="small"
                disabled={record.state === "已下单"}
                onClick={() => showStatusModal(record)}
                style={{ padding: "0 4px", width: "100%" }}
              >
                订单状态
              </Button>
            </Col> */}
          </Row>
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
                  className="rounded-md border-gray-200"
                  size="middle"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="customerName" label=" 客户名称" className="mb-0">
                <Input
                  placeholder="请输入"
                  className="rounded-md border-gray-200"
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
              <Form.Item name="salesperson" label="销售员" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="1">销售员1</Option>
                  <Option value="2">销售员2</Option>
                  <Option value="3">销售员3</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderStatus" label="订单状态" className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="全部"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="延期">延期</Option>
                  <Option value="暂停">暂停</Option>
                  <Option value="已完成">已完成</Option>
                  <Option value="等硬装">等硬装</Option>
                  <Option value="客户待打款">客户待打款</Option>
                  <Option value="待客户确认">待客户确认</Option>
                  <Option value="其他">其他</Option>
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
                  <Option value="development">生成单</Option>
                  <Option value="production">成品单</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="designCycle" label="设计周期" className="mb-0">
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="小于20天">小于20天</Option>
                  <Option value="大于20天">大于20天</Option>
                  <Option value="大于50天">大于50天</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="orderCategory" label="下单类目" className="mb-0">
                <Select
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
              <Form.Item
                name="splitDateRange"
                label="分单日期"
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
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={showModal}
          >
            创建订单
          </Button>
          <Button
            icon={<ExportOutlined />}
            size="small"
            className="border-gray-300 hover:border-blue-500"
          >
            导出
          </Button>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={filteredDesignData}
          loading={loading}
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
                orderType: editingRecord.orderType as string,
                designer: editingRecord.designer as string,
                salesperson: editingRecord.salesperson as string,
                splitDate: editingRecord.splitTime as string,
                orderStatus: editingRecord.state as string,
                categories:
                  (editingRecord.category as string)?.split(",") || [],
                remark: editingRecord.remark as string,
                designArea: editingRecord.designArea as string,
                orderAmount: editingRecord.orderAmount as string,
                isSetup: editingRecord.isSetup as boolean,
              }
            : undefined
        }
      />

      {/* 更新进度Modal */}
      <UpdateProgressModal
        visible={isProgressModalVisible}
        onCancel={handleProgressModalCancel}
        orderNumber={selectedOrderNumber}
      />

      {/* 进度详情Modal */}
      <ProgressDetailModal
        visible={isDetailModalVisible}
        onCancel={handleDetailModalCancel}
        orderNumber={selectedOrderNumber}
        orderName={selectedOrderName}
        progressData={selectedProgressData}
      />

      {/* 订单状态修改Modal */}
      <Modal
        title="修改订单状态"
        open={isStatusModalVisible}
        onOk={handleUpdateOrderStatus}
        onCancel={handleStatusModalCancel}
        okText="确认"
        cancelText="取消"
        width={400}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>订单号：</strong>
            {statusEditingRecord?.orderNumber}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {statusEditingRecord?.customerName}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>当前状态：</strong>
            {statusEditingRecord?.state}
          </div>
          <div>
            <strong>选择新状态：</strong>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="请选择订单状态"
              style={{ width: "100%", marginTop: "8px" }}
            >
              <Option value="进行中">进行中</Option>
              <Option value="延期">延期</Option>
              <Option value="暂停">暂停</Option>
              <Option value="等硬装">等硬装</Option>
              <Option value="客户待打款">客户待打款</Option>
              <Option value="待客户确认">待客户确认</Option>
              <Option value="其他">其他</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DesignPage;
