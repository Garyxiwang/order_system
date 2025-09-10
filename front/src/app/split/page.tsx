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
import {
  getSplitOrders,
  updateSplitStatus,
  type SplitOrder,
  type ProductionItem,
} from "../../services/splitApi";
import { formatDateTime } from "../../utils/dateUtils";
import EditOrderModal from "./editOrderModal";
import type { EditFormValues } from "./editOrderModal";
import SplitOrderModal from "./splitOrderModal";
import type { SplitFormValues } from "./splitOrderModal";
import type { Dayjs } from "dayjs";
import { UserService, UserData, UserRole } from "../../services/userService";
import { CategoryService, CategoryData } from "../../services/categoryService";

const { Option } = Select;
const { RangePicker } = DatePicker;
const DesignPage: React.FC = () => {
  const [splitData, setSplitData] = useState<SplitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SplitOrder | null>(null);
  const [searchForm] = Form.useForm();
  const [designers, setDesigners] = useState<UserData[]>([]);
  const [salespersons, setSalespersons] = useState<UserData[]>([]);
  const [splitters, setSplitters] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

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
      setSplitData(response.items);
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取拆单数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 加载用户数据
  const loadUserData = async () => {
    try {
      const allUsers = await UserService.getUserList();
      setDesigners(allUsers.filter((user) => user.role === UserRole.DESIGNER));
      setSalespersons(
        allUsers.filter((user) => user.role === UserRole.SALESPERSON)
      );
      setSplitters(allUsers.filter((user) => user.role === UserRole.SPLITTING));
    } catch (error) {
      console.error("加载用户数据失败:", error);
      message.error("加载用户数据失败");
    }
  };

  // 加载类目数据
  const loadCategories = async () => {
    try {
      const categoryList = await CategoryService.getCategoryList();
      setCategories(categoryList);
    } catch (error) {
      console.error("获取类目数据失败:", error);
    }
  };

  // 组件挂载时加载数据和设置默认筛选条件
  useEffect(() => {
    // 设置订单状态默认选择"拆单中"和"已审核"
    searchForm.setFieldsValue({
      splitStatus: ["未开始", "拆单中", "未审核", "已审核", "撤销中"], // -1: 拆单中, 1: 已审核
    });
    loadSplitData();
    loadUserData();
    loadCategories();
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
      const response = await updateSplitStatus(orderStatusEditingRecord.id, {
        order_status: selectedOrderStatus,
      });

      if (response.code === 200) {
        message.success(`订单状态修改成功`);
        await loadSplitData(); // 重新加载数据
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

  // 显示报价状态修改弹窗
  const showPriceStatusModal = (record: SplitOrder) => {
    setPriceStatusEditingRecord(record);
    setSelectedPriceStatus(record.quote_status || "");
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

      // 调用API更新报价状态
      const statusData: { quote_status: string; actual_payment_date?: string } =
        { quote_status: selectedPriceStatus };
      if (selectedPriceStatus === "已打款" && actualPaymentDate) {
        statusData.actual_payment_date = actualPaymentDate.format("YYYY-MM-DD");
      }

      const response = await updateSplitStatus(
        priceStatusEditingRecord.id,
        statusData
      );

      if (response.code === 200) {
        const dateInfo =
          selectedPriceStatus === "已打款" && actualPaymentDate
            ? `，实际打款日期：${actualPaymentDate.format("YYYY-MM-DD")}`
            : "";
        message.success(`报价状态修改成功${dateInfo}`);
        await loadSplitData(); // 重新加载数据
        handlePriceStatusModalCancel();
      } else {
        message.error(response.message || "报价状态修改失败");
      }
    } catch (error) {
      message.error("报价状态修改失败，请稍后重试");
      console.error("报价状态修改失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理下单操作
  const handlePlaceOrder = (record: SplitOrder) => {
    if (
      (!record.cabinet_area && !record.wall_panel_area) ||
      !record.order_amount
    ) {
      // message.warning("请输入面积和订单金额");
      Modal.error({
        title: "订单错误",
        content: (
          <div>
            <p>当前订单缺少面积信息和订单金额</p>
            <p>请先补充，再下单！</p>
          </div>
        ),
      });
      return;
    }
    // 检查打款状态
    if (record.quote_status !== "已打款") {
      message.warning("只有已打款的订单才能下单");
      return;
    }

    Modal.confirm({
      title: "确认下单",
      content: `确定要为订单 ${record.order_number} 下单吗？`,
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
    },

    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      render: (text: string) => text || "-",
    },
    {
      title: "厂内生产项",
      dataIndex: "internal_production_items",
      key: "internal_production_items",
      render: (items: ProductionItem[] | string) => {
        let productionItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          productionItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              planned_date: undefined,
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
            };
          });
        }
        if (!productionItems || productionItems.length === 0) return null;

        return (
          <div>
            {productionItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;

              if (actualDate) {
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}
                  </div>
                );
              } else {
                return <div key={index}>{name}:-</div>;
              }
            })}
          </div>
        );
      },
    },
    {
      title: "外购项",
      dataIndex: "external_purchase_items",
      key: "external_purchase_items",
      render: (items: ProductionItem[] | string) => {
        let purchaseItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          purchaseItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              planned_date: undefined,
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
            };
          });
        }
        if (!purchaseItems || purchaseItems.length === 0) return null;

        return (
          <div>
            {purchaseItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;

              if (actualDate) {
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}
                  </div>
                );
              } else {
                return <div key={index}>{name}: -</div>;
              }
            })}
          </div>
        );
      },
    },
    {
      title: "报价状态",
      dataIndex: "quote_status",
      key: "quote_status",
      render: (text: string) => {
        // 向后兼容旧字段
        const status = text || "";
        let color = "";
        if (status === "已打款") {
          color = "green";
        } else if (status === "未打款") {
          color = "red";
        }
        return <span style={{ color }}>{status || "-"}</span>;
      },
    },

    {
      title: "完成日期",
      dataIndex: "completion_date",
      key: "completion_date",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "订单类型",
      dataIndex: "order_type",
      key: "order_type",
    },

    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
      render: (text: string) => text || "-",
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
      render: (text: string) => {
        // 向后兼容旧字段
        return text || "-";
      },
    },

    {
      title: "订单金额",
      dataIndex: "order_amount",
      key: "order_amount",
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
      title: "面积信息",
      key: "area_info",
      render: (text: string, record: SplitOrder) => {
        const cabinetArea = record.cabinet_area;
        const wallPanelArea = record.wall_panel_area;
        return (
          <div>
            <div>柜体面积: {cabinetArea ? `${cabinetArea}㎡` : "-"}</div>
            <div>墙板面积: {wallPanelArea ? `${wallPanelArea}㎡` : "-"}</div>
          </div>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
      render: (text: string) => {
        const remark = text;
        return (
          <div
            style={{
              maxWidth: "150px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {remark || "-"}
          </div>
        );
      },
    },
    {
      title: "订单状态",
      dataIndex: "order_status",
      key: "order_status",
      fixed: "right",
      render: (text: string, record: SplitOrder) => {
        // 向后兼容旧字段
        const status = text || record.order_status || "";
        let color = "";
        if (status === "已完成") {
          return <Tag color="green">{status}</Tag>;
        } else if (status === "进行中") {
          color = "blue";
        } else if (status === "撤销中") {
          color = "red";
        }
        return color ? <span style={{ color }}>{status}</span> : status;
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 145,
      render: (_: unknown, record: SplitOrder) => {
        const isRevoked = record.order_status === "撤销中";
        return (
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
              disabled={isRevoked}
              onClick={() => showEditModal(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              disabled={isRevoked}
              onClick={() => showSplitModal(record)}
            >
              更新进度
            </Button>

            <Button
              type="link"
              size="small"
              disabled={isRevoked}
              onClick={() => showOrderStatusModal(record)}
            >
              订单状态
            </Button>
            <Button
              type="link"
              size="small"
              disabled={isRevoked || record.quote_status === "已打款"}
              onClick={() => showPriceStatusModal(record)}
            >
              报价状态
            </Button>
            <Button
              type="link"
              size="small"
              disabled={isRevoked || record.quote_status !== "已打款"}
              onClick={() => handlePlaceOrder(record)}
            >
              下单
            </Button>
          </div>
        );
      },
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
                  {designers.map((designer) => (
                    <Option key={designer.username} value={designer.username}>
                      {designer.username}
                    </Option>
                  ))}
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
                  {salespersons.map((salesperson) => (
                    <Option
                      key={salesperson.username}
                      value={salesperson.username}
                    >
                      {salesperson.username}
                    </Option>
                  ))}
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
                  {splitters.map((splitter) => (
                    <Option key={splitter.username} value={splitter.username}>
                      {splitter.username}
                    </Option>
                  ))}
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
                  {categories.map((category) => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
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
                  <Option value="未打款">未打款</Option>
                  <Option value="已打款">已打款</Option>
                  <Option value="报价已发未打款">报价已发未打款</Option>
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
                  <Option value="设计单">设计单</Option>
                  <Option value="生产单">生产单</Option>
                  <Option value="成品单">成品单</Option>
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
          rowKey={(record) =>
            record.id?.toString() || record.order_number || "unknown"
          }
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
            {priceStatusEditingRecord?.order_number}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {priceStatusEditingRecord?.customer_name}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>当前状态：</strong>
            {priceStatusEditingRecord?.quote_status}
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
