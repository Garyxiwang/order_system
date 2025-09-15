"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
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
  updateOrderStatus,
  type DesignOrder,
  type OrderListParams,
} from "../../services/designApi";
import { formatDateTime } from "../../utils/dateUtils";
import { UserService, UserData, UserRole } from "../../services/userService";
import { CategoryService, CategoryData } from "../../services/categoryService";

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
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [designers, setDesigners] = useState<UserData[]>([]);
  const [salespersons, setSalespersons] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  const showModal = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const showEditModal = (record: DesignOrder) => {
    console.log("record", record);
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // 检查是否可以下单（设计进度中是否包含下单事项）
  const canPlaceOrder = (record: DesignOrder) => {
    if (!record.design_process || record.design_process === "暂无进度") {
      return false;
    }
    // 检查设计进度中是否包含"下单"相关的事项
    const progressItems = record.design_process
      .split(",")
      .map((item) => item.trim());
    return progressItems.some((item) => {
      const [taskName] = item.split(":");
      return (
        taskName && (taskName.includes("下单") || taskName.includes("订单"))
      );
    });
  };

  // 处理下单操作
  const handlePlaceOrder = (record: DesignOrder) => {
    Modal.confirm({
      title: "确认下单",
      content: `确定要为订单 ${record.order_number} 下单吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          setLoading(true);
          const response = await updateOrderStatus(
            record.id?.toString() || record.order_number,
            "已下单"
          );

          if (response.code === 200) {
            message.success("下单成功");
            await handleSearch();
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
    if (record.order_status !== "已下单") {
      message.warning("只有已下单的订单才能撤销");
      return;
    }

    Modal.confirm({
      title: "确认撤销",
      content: `确定要撤销订单 ${record.order_number} 吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          setLoading(true);
          const response = await updateOrderStatus(
            record.order_number,
            "已撤销"
          );
          console.log("response", response);
          if (response.code === 200) {
            message.success("撤销成功");
            await handleSearch(); // 重新加载数据
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
    setSelectedOrderNumber(record.order_number);
    setSelectedOrderName(record.customer_name || "");
    setIsProgressModalVisible(true);
  };

  // 关闭更新进度弹窗
  const handleProgressModalCancel = () => {
    setIsProgressModalVisible(false);
    setSelectedOrderNumber("");
    handleSearch();
  };

  // 显示进度详情弹窗
  const showDetailModal = (record: DesignOrder) => {
    setSelectedOrderNumber(record.order_number);
    setSelectedOrderName(record.customer_name || "");
    setSelectedProgressData(
      record.design_process ? record.design_process.split(",") : []
    );
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
    order_number: string;
    customer_name: string;
    address: string;
    order_type: string;
    designer: string;
    salesperson: string;
    category_name: string;
    assignment_date?: string;
    remarks?: string;
    is_installation: boolean;
    cabinet_area?: string;
    wall_panel_area?: string;
    order_amount?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);

      if (editingRecord) {
        // 编辑模式 - 不传递order_number字段，因为后端不允许修改订单编号
        const response = await updateDesignOrder(editingRecord.id!.toString(), {
          customer_name: values.customer_name,
          address: values.address,
          designer: values.designer,
          salesperson: values.salesperson,
          assignment_date: values.assignment_date
            ? dayjs(values.assignment_date).format("YYYY-MM-DD")
            : "",
          category_name: values.category_name,
          order_type: values.order_type,
          remarks: values.remarks || "",
          is_installation: values.is_installation,
          order_amount: values.order_amount || undefined,
          cabinet_area: values.cabinet_area || undefined,
          wall_panel_area: values.wall_panel_area || undefined,
        });

        if (response.code === 200) {
          message.success("更新成功");
        } else {
          message.error(response.message || "更新失败");
          return false;
        }
      } else {
        // 新增模式
        const response = await createDesignOrder({
          order_number: values.order_number,
          customer_name: values.customer_name,
          address: values.address,
          designer: values.designer,
          salesperson: values.salesperson,
          assignment_date: values.assignment_date
            ? dayjs(values.assignment_date).format("YYYY-MM-DD")
            : "",
          design_process: "",
          category_name: values.category_name,
          order_status: "未下单",
          order_type: values.order_type,
          design_cycle: "0",
          remarks: values.remarks || "",
          is_installation: values.is_installation,
          order_amount: values.order_amount || undefined,
          cabinet_area: values.cabinet_area || undefined,
          wall_panel_area: values.wall_panel_area || undefined,
        });

        if (response.code === 200) {
          message.success(response.message || "创建成功");
        } else {
          message.error(response.message || "创建失败");
          return false;
        }
      }

      // 重新加载数据
      await handleSearch();
      setIsModalVisible(false);
      setEditingRecord(null);
      return true;
    } catch (error) {
      message.error("操作失败，请稍后重试");
      console.error("操作失败:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // 加载设计订单数据
  const loadDesignData = async (
    searchParams?: OrderListParams,
    page?: number,
    size?: number
  ) => {
    try {
      setLoading(true);
      const params = {
        ...searchParams,
        page: page || currentPage,
        pageSize: size || pageSize,
      };
      console.log("searchParams", searchParams);
      const response = await getDesignOrders(params);
      // 后端直接返回OrderListResponse对象，不是包装在ApiResponse中
      setDesignData(response.items || []);
      setTotal(response.total || 0);
      setCurrentPage(response.page || 1);
      setPageSize(response.page_size || 10);
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索功能
  const handleSearch = async () => {
    const formValues = searchForm.getFieldsValue();
    const searchParams: OrderListParams = {
      orderNumber: formValues.orderNumber,
      customerName: formValues.customerName,
      designer: formValues.designer,
      salesperson: formValues.salesperson,
      orderStatus:
        formValues.orderStatus && formValues.orderStatus.length > 0
          ? formValues.orderStatus
          : undefined,
      orderType: formValues.orderType,
      orderCategory:
        formValues.orderCategory && formValues.orderCategory.length > 0
          ? formValues.orderCategory
          : undefined,
      designCycleFilter: formValues.designCycleFilter,
      startDate: formValues.splitDateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: formValues.splitDateRange?.[1]?.format("YYYY-MM-DD"),
      orderDateStart: formValues.orderDateRange?.[0]?.format("YYYY-MM-DD"),
      orderDateEnd: formValues.orderDateRange?.[1]?.format("YYYY-MM-DD"),
    };

    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null
      )
    );

    // 搜索时重置到第一页
    setCurrentPage(1);
    await loadDesignData(filteredParams, 1, pageSize);
  };

  // 处理重置功能
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
    const searchParams: OrderListParams = {
      orderNumber: formValues.orderNumber,
      customerName: formValues.customerName,
      designer: formValues.designer,
      salesperson: formValues.salesperson,
      orderStatus:
        formValues.orderStatus && formValues.orderStatus.length > 0
          ? formValues.orderStatus
          : undefined,
      orderType: formValues.orderType,
      orderCategory:
        formValues.orderCategory && formValues.orderCategory.length > 0
          ? formValues.orderCategory
          : undefined,
      designCycleFilter: formValues.designCycleFilter,
      startDate: formValues.splitDateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: formValues.splitDateRange?.[1]?.format("YYYY-MM-DD"),
      orderDateStart: formValues.orderDateRange?.[0]?.format("YYYY-MM-DD"),
      orderDateEnd: formValues.orderDateRange?.[1]?.format("YYYY-MM-DD"),
    };

    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null
      )
    );

    await loadDesignData(filteredParams, newPage, newPageSize);
  };

  // 加载用户数据
  const loadUserData = async () => {
    try {
      const allUsers = await UserService.getUserList();
      const designerList = allUsers.filter(
        (user) => user.role === UserRole.DESIGNER
      );
      const salespersonList = allUsers.filter(
        (user) => user.role === UserRole.SALESPERSON
      );
      setDesigners(designerList);
      setSalespersons(salespersonList);
    } catch (error) {
      console.error("加载用户数据失败:", error);
      message.error("加载用户数据失败");
    }
  };

  // 加载类目数据
  const loadCategoryData = async () => {
    try {
      const categoryList = await CategoryService.getCategoryList();
      setCategories(categoryList);
    } catch (error) {
      console.error("加载类目数据失败:", error);
      message.error("加载类目数据失败");
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    handleSearch();
    loadUserData();
    loadCategoryData();
  }, []);

  const columns: ColumnsType<DesignOrder> = [
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
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
      render: (text: string) => (text ? text : "-"),
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
      render: (text: string) => (text ? text : "-"),
    },
    {
      title: "分单日期",
      dataIndex: "assignment_date",
      key: "assignment_date",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "设计过程",
      dataIndex: "design_process",
      key: "design_process",
      render: (text: string, record: DesignOrder) => {
        if (!text || text === "暂无进度") return "-";
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        // 解析进度项目，分离事件名和实际时间
        const parseProgressItem = (item: string) => {
          if (item.includes(":")) {
            const [status, time] = item.split(":");
            return { status: status.trim(), time: time.trim() };
          }
          return { status: item, time: null };
        };

        // 默认显示最近的3条记录
        const displayItems = items.slice(0, 3);

        return (
          <div>
            {displayItems.map((item, itemIndex) => {
              const { status, time } = parseProgressItem(item);

              return (
                <div key={itemIndex}>
                  {time && time !== "-" ? (
                    <span>
                      <CheckOutlined
                        style={{ color: "green", marginRight: "4px" }}
                      />
                      {status}：
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {time}
                      </span>
                    </span>
                  ) : (
                    <span
                      style={{ display: "inline-block", marginLeft: "15px" }}
                    >
                      {status}：-
                    </span>
                  )}
                </div>
              );
            })}
            {items.length > 0 && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => showDetailModal(record)}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  详情{` (${items.length})`}
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "下单类目",
      dataIndex: "category_name",
      key: "category_name",
      render: (categories: string[] | string) => {
        if (!categories) return "-";

        // 处理字符串类型的情况（兼容旧数据）
        const categoryArray = Array.isArray(categories)
          ? categories
          : categories
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);

        if (categoryArray.length === 0) return "-";

        return (
          <div>
            {categoryArray.map((category, index) => (
              <div key={index}>{category}</div>
            ))}
          </div>
        );
      },
    },

    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "设计周期",
      dataIndex: "design_cycle",
      key: "design_cycle",
      render: (cycle: string) => {
        if (!cycle) return "-";
        const days = parseInt(cycle);
        let color = "default";
        if (days <= 3) {
          color = "green";
        } else if (days > 3 && days <= 20) {
          color = "orange";
        } else if (days > 20) {
          color = "red";
        }
        return <Tag color={color}>{days}天</Tag>;
      },
    },
    {
      title: "订单类型",
      dataIndex: "order_type",
      key: "order_type",
    },
    {
      title: "是否安装",
      dataIndex: "is_installation",
      key: "is_installation",
      render: (text: boolean) => <div>{text ? "是" : "否"}</div>,
    },
    {
      title: "面积信息",
      key: "area_info",
      render: (text: string, record: DesignOrder) => {
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
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
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
      dataIndex: "order_status",
      fixed: "right",
      key: "order_status",
      render: (text: string) => {
        // 如果已下单，显示已完成
        if (text === "下单") {
          return <Tag color="blue">待下单</Tag>;
        }
        if (text === "已下单") {
          return <Tag color="green">{text}</Tag>;
        }
        if (text === "已撤销" || text === "暂停") {
          return <Tag color="red">{text}</Tag>;
        }

        return <Tag color="blue">{text}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      render: (_: unknown, record: DesignOrder) => (
        <div style={{ width: "50px" }}>
          <Row gutter={[4, 4]}>
            <Col span={14}>
              <Button
                type="link"
                size="small"
                onClick={() => showEditModal(record)}
                disabled={record.order_status === "已下单"}
                style={{ padding: "0 4px", width: "100%" }}
              >
                编辑订单
              </Button>
            </Col>
            <Col span={14}>
              <Button
                type="link"
                size="small"
                disabled={record.order_status === "已下单"}
                onClick={() => showProgressModal(record)}
                style={{ padding: "0 4px", width: "100%" }}
              >
                更新进度
              </Button>
            </Col>
            {record.order_status === "已下单" && (
              <Col span={14}>
                <Button
                  type="link"
                  size="small"
                  disabled={record.order_status !== "已下单"}
                  onClick={() => handleCancelOrder(record)}
                  style={{ padding: "0 4px", width: "100%" }}
                >
                  撤销
                </Button>
              </Col>
            )}
            {record.order_status !== "已下单" && (
              <Col span={14}>
                <Button
                  type="link"
                  size="small"
                  disabled={
                    record.order_status === "已下单" || !canPlaceOrder(record)
                  }
                  onClick={() => handlePlaceOrder(record)}
                  style={{ padding: "0 4px", width: "100%" }}
                >
                  下单
                </Button>
              </Col>
            )}
          </Row>
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
            orderStatus: [
              "量尺",
              "初稿",
              "公司对方案",
              "线上对方案",
              "改图",
              "客户确认图",
              "客户硬装阶段",
              "出内部结构图",
              "出下单图",
              "复尺",
              "报价",
              "打款",
              "下单",
              "其他",
            ],
          }}
        >
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
                  {designers.map((designer) => (
                    <Option key={designer.username} value={designer.username}>
                      {designer.username}
                    </Option>
                  ))}
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
              <Form.Item name="orderStatus" label="订单状态" className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="全部"
                  className="rounded-md"
                  size="middle"
                  allowClear
                  maxTagCount="responsive"
                  popupRender={(menu) => {
                    const allStatusOptions = [
                      "量尺",
                      "初稿",
                      "公司对方案",
                      "线上对方案",
                      "改图",
                      "客户确认图",
                      "客户硬装阶段",
                      "出内部结构图",
                      "出下单图",
                      "复尺",
                      "报价",
                      "打款",
                      "下单",
                      "暂停",
                      "已下单",
                      "已撤销",
                      "其他",
                    ];
                    const currentValues =
                      searchForm.getFieldValue("orderStatus") || [];
                    const isAllSelected = allStatusOptions.every((status) =>
                      currentValues.includes(status)
                    );

                    return (
                      <>
                        <div
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              if (isAllSelected) {
                                searchForm.setFieldsValue({ orderStatus: [] });
                              } else {
                                searchForm.setFieldsValue({
                                  orderStatus: allStatusOptions,
                                });
                              }
                            }}
                            style={{ padding: 0, height: "auto" }}
                          >
                            {isAllSelected ? "取消全选" : "全选"}
                          </Button>
                        </div>
                        {menu}
                      </>
                    );
                  }}
                >
                  <Option value="量尺">量尺</Option>
                  <Option value="初稿">初稿</Option>
                  <Option value="公司对方案">公司对方案</Option>
                  <Option value="线上对方案">线上对方案</Option>
                  <Option value="改图">改图</Option>
                  <Option value="客户确认图">客户确认图</Option>
                  <Option value="客户硬装阶段">客户硬装阶段</Option>
                  <Option value="出内部结构图">出内部结构图</Option>
                  <Option value="出下单图">出下单图</Option>
                  <Option value="复尺">复尺</Option>
                  <Option value="报价">报价</Option>
                  <Option value="打款">打款</Option>
                  <Option value="下单">待下单</Option>
                  <Option value="已下单">已下单</Option>
                  <Option value="已撤销">已撤销</Option>
                  <Option value="暂停">暂停</Option>
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
                  <Option value="设计单">设计单</Option>
                  <Option value="生成单">生成单</Option>
                  <Option value="成品单">成品单</Option>
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
              <Form.Item
                name="designCycleFilter"
                label="设计周期"
                className="mb-0"
              >
                <Select
                  placeholder="请选择"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="lte20">小于20天</Option>
                  <Option value="gt20">大于20天</Option>
                  <Option value="lt50">小于50天</Option>
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
          dataSource={designData}
          loading={loading}
          bordered={false}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
          }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.order_number}
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
                order_number: editingRecord.order_number,
                customer_name: editingRecord.customer_name,
                address: editingRecord.address,
                order_type: editingRecord.order_type,
                designer: editingRecord.designer,
                salesperson: editingRecord.salesperson,
                assignment_date: editingRecord.assignment_date,
                category_name: editingRecord.category_name,
                remarks: editingRecord.remarks,
                order_amount:
                  editingRecord.order_amount &&
                  editingRecord.order_amount !== "0.00"
                    ? editingRecord.order_amount
                    : undefined,
                is_installation: editingRecord.is_installation,
                cabinet_area:
                  editingRecord.cabinet_area &&
                  editingRecord.cabinet_area !== "0.00"
                    ? editingRecord.cabinet_area
                    : undefined,
                wall_panel_area:
                  editingRecord.wall_panel_area &&
                  editingRecord.wall_panel_area !== "0.00"
                    ? editingRecord.wall_panel_area
                    : undefined,
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
    </div>
  );
};

export default DesignPage;
