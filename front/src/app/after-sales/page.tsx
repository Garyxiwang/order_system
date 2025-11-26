"use client";

import React, { useState, useEffect } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule } from "@/utils/permissions";
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
  Form,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import CreateAfterSalesModal from "./createAfterSalesModal";
import AfterSalesLogModal from "./afterSalesLogModal";
import RemainingIssuesModal from "./remainingIssuesModal";
import FollowUpModal from "./followUpModal";
import AfterSalesLogDetailModal from "./afterSalesLogDetailModal";
import RemainingIssuesDetailModal from "./remainingIssuesDetailModal";
import FollowUpDetailModal from "./followUpDetailModal";
import {
  getAfterSalesOrders,
  createAfterSalesOrder,
  updateAfterSalesOrder,
  type AfterSalesOrder,
  type AfterSalesListParams,
} from "../../services/afterSalesApi";
import { formatDateTime } from "../../utils/dateUtils";
import { UserService, UserData } from "../../services/userService";
import { UserRole } from "../../utils/permissions";

const { Option } = Select;
const { RangePicker } = DatePicker;

const AfterSalesPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AfterSalesOrder | null>(
    null
  );
  const [afterSalesData, setAfterSalesData] = useState<AfterSalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [designers, setDesigners] = useState<UserData[]>([]);
  const [splitters, setSplitters] = useState<UserData[]>([]);

  // 三个独立modal的状态
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [isIssuesModalVisible, setIsIssuesModalVisible] = useState(false);
  const [isFollowUpModalVisible, setIsFollowUpModalVisible] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");

  // 三个详情modal的状态
  const [isLogDetailModalVisible, setIsLogDetailModalVisible] = useState(false);
  const [isIssuesDetailModalVisible, setIsIssuesDetailModalVisible] =
    useState(false);
  const [isFollowUpDetailModalVisible, setIsFollowUpDetailModalVisible] =
    useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<AfterSalesOrder | null>(null);

  const showModal = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const showEditModal = (record: AfterSalesOrder) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // 显示售后日志modal
  const showLogModal = (record: AfterSalesOrder) => {
    setSelectedOrderNumber(record.order_number);
    setIsLogModalVisible(true);
  };

  // 显示遗留问题modal
  const showIssuesModal = (record: AfterSalesOrder) => {
    setSelectedOrderNumber(record.order_number);
    setIsIssuesModalVisible(true);
  };

  // 显示回访情况modal
  const showFollowUpModal = (record: AfterSalesOrder) => {
    setSelectedOrderNumber(record.order_number);
    setIsFollowUpModalVisible(true);
  };

  // 显示售后日志详情modal
  const showLogDetailModal = (record: AfterSalesOrder) => {
    setSelectedOrderForDetail(record);
    setIsLogDetailModalVisible(true);
  };

  // 显示遗留问题详情modal
  const showIssuesDetailModal = (record: AfterSalesOrder) => {
    setSelectedOrderForDetail(record);
    setIsIssuesDetailModalVisible(true);
  };

  // 显示回访情况详情modal
  const showFollowUpDetailModal = (record: AfterSalesOrder) => {
    setSelectedOrderForDetail(record);
    setIsFollowUpDetailModalVisible(true);
  };

  const handleOk = async (values: {
    order_number: string;
    customer_name: string;
    shipping_address: string;
    customer_phone: string;
    delivery_date?: string;
    installation_date?: string;
    first_completion_date?: string;
    is_completed: boolean;
    external_purchase_details?: string;
    costs?: string;
    designer: string;
    splitter?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);

      if (editingRecord) {
        // 编辑模式
        const response = await updateAfterSalesOrder(
          editingRecord.id!.toString(),
          {
            customer_name: values.customer_name,
            shipping_address: values.shipping_address,
            customer_phone: values.customer_phone,
            delivery_date: values.delivery_date,
            installation_date: values.installation_date,
            first_completion_date: values.first_completion_date,
            is_completed: values.is_completed,
            external_purchase_details: values.external_purchase_details,
            costs: values.costs,
            designer: values.designer,
            splitter: values.splitter,
          }
        );

        if (response.code === 200) {
          message.success("更新成功");
        } else {
          message.error(response.message || "更新失败");
          return false;
        }
      } else {
        // 新增模式
        const response = await createAfterSalesOrder({
          order_number: values.order_number,
          customer_name: values.customer_name,
          shipping_address: values.shipping_address,
          customer_phone: values.customer_phone,
          delivery_date: values.delivery_date,
          installation_date: values.installation_date,
          first_completion_date: values.first_completion_date,
          is_completed: values.is_completed,
          external_purchase_details: values.external_purchase_details,
          costs: values.costs,
          designer: values.designer,
          splitter: values.splitter,
        });

        if (response.code === 200) {
          message.success(response.message || "创建成功");
        } else {
          message.error(response.message || "创建失败");
          return false;
        }
      }

      // 重新加载数据，保持当前查询条件和分页状态
      const formValues = searchForm.getFieldsValue();
      const filteredParams = buildSearchParams(formValues, {
        pagination: true,
      });
      await loadAfterSalesData(filteredParams, currentPage, pageSize);
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

  // 加载售后订单数据
  const loadAfterSalesData = async (
    searchParams?: AfterSalesListParams,
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
      const response = await getAfterSalesOrders(params);
      setAfterSalesData(response.items || []);
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

  // 提取公共的查询参数构建函数
  const buildSearchParams = (
    formValues: {
      orderNumber?: string;
      customerName?: string;
      designer?: string;
      splitter?: string;
      installationDateRange?: dayjs.Dayjs[];
      isCompleted?: boolean;
    },
    options: { pagination?: boolean } = {}
  ): AfterSalesListParams => {
    const params: AfterSalesListParams = {
      orderNumber: formValues.orderNumber,
      customerName: formValues.customerName,
      designer: formValues.designer,
      splitter: formValues.splitter,
      installationDateStart:
        formValues.installationDateRange?.[0]?.format("YYYY-MM-DD"),
      installationDateEnd:
        formValues.installationDateRange?.[1]?.format("YYYY-MM-DD"),
      isCompleted:
        formValues.isCompleted !== undefined
          ? formValues.isCompleted
          : undefined,
    };

    // 如果需要分页，添加分页参数
    if (options.pagination) {
      params.page = currentPage;
      params.pageSize = pageSize;
    } else {
      // 不分页时使用 no_pagination 字段
      params.no_pagination = true;
    }

    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== "" && value !== null
      )
    );

    return filteredParams as AfterSalesListParams;
  };

  // 处理搜索功能
  const handleSearch = async () => {
    const formValues = searchForm.getFieldsValue();
    const filteredParams = buildSearchParams(formValues, { pagination: true });

    // 搜索时重置到第一页
    setCurrentPage(1);
    await loadAfterSalesData(filteredParams, 1, pageSize);
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
    const searchParams = buildSearchParams(formValues, { pagination: true });

    await loadAfterSalesData(searchParams, newPage, newPageSize);
  };

  const loadUserData = async () => {
    try {
      const allUsers = await UserService.getUserList();
      const designerList = allUsers.filter(
        (user) => user.role === UserRole.DESIGNER
      );
      const splitterList = allUsers.filter(
        (user) => user.role === UserRole.SPLITTING
      );
      setDesigners(designerList);
      setSplitters(splitterList);
    } catch (error) {
      console.error("加载用户数据失败:", error);
      message.error("加载用户数据失败");
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    const initData = async () => {
      await handleSearch();
      await loadUserData();
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<AfterSalesOrder> = [
    {
      title: "订单编号",
      dataIndex: "order_number",
      key: "order_number",
      width: 90,
      fixed: "left",
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 120,
      fixed: "left",
    },
    {
      title: "发货地址",
      dataIndex: "shipping_address",
      key: "shipping_address",
      width: 90,
      render: (text: string) => text || "-",
    },
    {
      title: "客户电话",
      dataIndex: "customer_phone",
      key: "customer_phone",
      render: (text: string) => text || "-",
    },
    {
      title: "送货日期",
      dataIndex: "delivery_date",
      key: "delivery_date",
      width: 120,
      render: (date: string) => (date ? formatDateTime(date) : "-"),
    },
    {
      title: "安装日期",
      dataIndex: "installation_date",
      key: "installation_date",
      width: 120,
      render: (date: string) => (date ? formatDateTime(date) : "-"),
    },
    {
      title: "首次完工日期",
      dataIndex: "first_completion_date",
      key: "first_completion_date",
      width: 130,
      render: (date: string) => (date ? formatDateTime(date) : "-"),
    },
    {
      title: "是否完工",
      dataIndex: "is_completed",
      key: "is_completed",
      width: 90,
      render: (isCompleted: boolean) => (
        <Tag color={isCompleted ? "green" : "orange"}>
          {isCompleted ? "是" : "否"}
        </Tag>
      ),
    },
    {
      title: "外购产品明细",
      dataIndex: "external_purchase_details",
      key: "external_purchase_details",
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
      title: "售后日志",
      dataIndex: "after_sales_log",
      key: "after_sales_log",
      width: "auto",
      minWidth: 120,
      render: (_: unknown, record: AfterSalesOrder) => {
        // 模拟数据 - 实际应该从API获取
        const mockLogs = [
          { date: "2024-01-15", content: "客户反馈安装完成，整体满意" },
          { date: "2024-01-20", content: "回访客户，无问题" },
        ];

        if (!mockLogs || mockLogs.length === 0) return "-";

        // 默认显示最近的3条记录
        const displayItems = mockLogs.slice(0, 3);

        return (
          <div>
            {displayItems.map((item, itemIndex) => (
              <div key={itemIndex} style={{ marginBottom: 4 }}>
                <span>
                  {item.date}：
                  {item.content.length > 20
                    ? `${item.content.substring(0, 20)}...`
                    : item.content}
                </span>
              </div>
            ))}
            {mockLogs.length > 0 && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => showLogDetailModal(record)}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  详情{` (${mockLogs.length})`}
                </Button>
              </div>
            )}
          </div>
        );
      },
    },

    {
      title: "遗留问题",
      dataIndex: "remaining_issues",
      key: "remaining_issues",
      width: "auto",
      minWidth: 120,
      render: (_: unknown, record: AfterSalesOrder) => {
        // 模拟数据 - 实际应该从API获取
        const mockIssues = [
          { date: "2024-01-15", content: "需要更换部分配件", status: "待处理" },
        ];

        if (!mockIssues || mockIssues.length === 0) return "-";

        // 默认显示最近的3条记录
        const displayItems = mockIssues.slice(0, 3);

        return (
          <div>
            {displayItems.map((item, itemIndex) => (
              <div key={itemIndex} style={{ marginBottom: 4 }}>
                <span>
                  {item.date}：
                  {item.content.length > 20
                    ? `${item.content.substring(0, 20)}...`
                    : item.content}
                </span>
              </div>
            ))}
            {mockIssues.length > 0 && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => showIssuesDetailModal(record)}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  详情{` (${mockIssues.length})`}
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "产生费用",
      dataIndex: "costs",
      key: "costs",
      render: (text: string) =>
        text
          ? `¥${Number(text).toLocaleString("zh-CN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : "-",
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
      render: (text: string) => text || "-",
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      render: (text: string) => text || "-",
    },
    {
      title: "回访情况",
      dataIndex: "follow_up_issues",
      key: "follow_up_issues",
      width: "auto",
      minWidth: 120,
      render: (_: unknown, record: AfterSalesOrder) => {
        // 模拟数据 - 实际应该从API获取
        const mockFollowUps = [
          { date: "2024-01-25", content: "客户满意，无问题" },
        ];

        if (!mockFollowUps || mockFollowUps.length === 0) return "-";

        // 默认显示最近的3条记录
        const displayItems = mockFollowUps.slice(0, 3);

        return (
          <div>
            {displayItems.map((item, itemIndex) => (
              <div key={itemIndex} style={{ marginBottom: 4 }}>
                <span>
                  {item.date}：
                  {item.content.length > 20
                    ? `${item.content.substring(0, 20)}...`
                    : item.content}
                </span>
              </div>
            ))}
            {mockFollowUps.length > 0 && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => showFollowUpDetailModal(record)}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  详情{` (${mockFollowUps.length})`}
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 80,
      render: (_: unknown, record: AfterSalesOrder) => (
        <div style={{ width: "50px" }}>
          <Row gutter={[4, 4]}>
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
              onClick={() => showIssuesModal(record)}
            >
              遗留问题
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => showFollowUpModal(record)}
            >
              回访情况
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => showLogModal(record)}
            >
              售后日志
            </Button>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <RouteGuard requiredModule={PageModule.AFTER_SALES}>
      <div className="space-y-6">
        {/* 搜索Card */}
        <Card variant="outlined" style={{ marginBottom: 20 }}>
          <Form form={searchForm}>
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
                <Form.Item
                  name="customerName"
                  label="客户名称"
                  className="mb-0"
                >
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
                    showSearch
                    filterOption={(input, option) => {
                      const label = option?.label as string | undefined;
                      return (
                        label?.toLowerCase().includes(input.toLowerCase()) ??
                        false
                      );
                    }}
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
                <Form.Item name="splitter" label="拆单员" className="mb-0">
                  <Select
                    placeholder="请选择"
                    className="rounded-md"
                    size="middle"
                    allowClear
                    showSearch
                    filterOption={(input, option) => {
                      const label = option?.label as string | undefined;
                      return (
                        label?.toLowerCase().includes(input.toLowerCase()) ??
                        false
                      );
                    }}
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
                <Form.Item
                  name="installationDateRange"
                  label="安装日期"
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
                <Form.Item name="isCompleted" label="是否完工" className="mb-0">
                  <Select
                    placeholder="请选择"
                    className="rounded-md"
                    size="middle"
                    allowClear
                  >
                    <Option value={true}>是</Option>
                    <Option value={false}>否</Option>
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
          {/* 新增按钮 */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="bg-blue-600 hover:bg-blue-700"
                onClick={showModal}
              >
                新增售后单
              </Button>
            </div>
          </div>

          {/* 表格区域 */}
          <Table
            columns={columns}
            dataSource={afterSalesData}
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
            rowKey={(record) => record.id?.toString() || record.order_number}
            scroll={{ x: "max-content" }}
            sticky={{ offsetHeader: -20 }}
          />
        </Card>

        <CreateAfterSalesModal
          visible={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          initialValues={
            editingRecord
              ? {
                  order_number: editingRecord.order_number,
                  customer_name: editingRecord.customer_name,
                  shipping_address: editingRecord.shipping_address,
                  customer_phone: editingRecord.customer_phone,
                  delivery_date: editingRecord.delivery_date,
                  installation_date: editingRecord.installation_date,
                  first_completion_date: editingRecord.first_completion_date,
                  is_completed: editingRecord.is_completed,
                  external_purchase_details:
                    editingRecord.external_purchase_details,
                  costs: editingRecord.costs,
                  designer: editingRecord.designer,
                  splitter: editingRecord.splitter,
                }
              : undefined
          }
        />

        {/* 售后日志Modal */}
        <AfterSalesLogModal
          visible={isLogModalVisible}
          onCancel={() => {
            setIsLogModalVisible(false);
            setSelectedOrderNumber("");
          }}
          orderNumber={selectedOrderNumber}
          onSuccess={() => {
            handleSearch();
          }}
        />

        {/* 遗留问题Modal */}
        <RemainingIssuesModal
          visible={isIssuesModalVisible}
          onCancel={() => {
            setIsIssuesModalVisible(false);
            setSelectedOrderNumber("");
          }}
          orderNumber={selectedOrderNumber}
          onSuccess={() => {
            handleSearch();
          }}
        />

        {/* 回访情况Modal */}
        <FollowUpModal
          visible={isFollowUpModalVisible}
          onCancel={() => {
            setIsFollowUpModalVisible(false);
            setSelectedOrderNumber("");
          }}
          orderNumber={selectedOrderNumber}
          onSuccess={() => {
            handleSearch();
          }}
        />

        {/* 售后日志详情Modal */}
        <AfterSalesLogDetailModal
          visible={isLogDetailModalVisible}
          onCancel={() => {
            setIsLogDetailModalVisible(false);
            setSelectedOrderForDetail(null);
          }}
          orderNumber={selectedOrderForDetail?.order_number || ""}
          customerName={selectedOrderForDetail?.customer_name}
        />

        {/* 遗留问题详情Modal */}
        <RemainingIssuesDetailModal
          visible={isIssuesDetailModalVisible}
          onCancel={() => {
            setIsIssuesDetailModalVisible(false);
            setSelectedOrderForDetail(null);
          }}
          orderNumber={selectedOrderForDetail?.order_number || ""}
          customerName={selectedOrderForDetail?.customer_name}
        />

        {/* 回访情况详情Modal */}
        <FollowUpDetailModal
          visible={isFollowUpDetailModalVisible}
          onCancel={() => {
            setIsFollowUpDetailModalVisible(false);
            setSelectedOrderForDetail(null);
          }}
          orderNumber={selectedOrderForDetail?.order_number || ""}
          customerName={selectedOrderForDetail?.customer_name}
        />
      </div>
    </RouteGuard>
  );
};

export default AfterSalesPage;
