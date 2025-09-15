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
  placeSplitOrder,
  type SplitOrder,
  type ProductionItem,
  type SplitListParams,
} from "../../services/splitApi";
import { formatDateTime } from "../../utils/dateUtils";
import EditOrderModal from "./editOrderModal";
import type { EditFormValues } from "./editOrderModal";
import SplitOrderModal from "./splitOrderModal";
import type { SplitFormValues } from "./splitOrderModal";
import type { Dayjs } from "dayjs";
import { UserService, UserData, UserRole } from "../../services/userService";
import { CategoryService, CategoryData } from "../../services/categoryService";
import InternalProductionDetailModal from "./progressDetailModal";

const { Option } = Select;
const { RangePicker } = DatePicker;
const DesignPage: React.FC = () => {
  const [splitData, setSplitData] = useState<SplitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // 订单信息补充Modal相关状态
  const [isOrderInfoModalVisible, setIsOrderInfoModalVisible] = useState(false);
  const [orderInfoEditingRecord, setOrderInfoEditingRecord] =
    useState<SplitOrder | null>(null);
  const [orderInfoForm] = Form.useForm();

  // 厂内生产项详情Modal相关状态
  const [isInternalDetailModalVisible, setIsInternalDetailModalVisible] =
    useState(false);
  const [internalDetailOrder, setInternalDetailOrder] =
    useState<SplitOrder | null>(null);
  const [detailModalItemType, setDetailModalItemType] = useState<
    "internal" | "external"
  >("internal");

  // 加载拆单数据

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
      orderStatus: ["未开始", "拆单中", "撤销中", "未审核", "已审核"], // -1: 拆单中, 1: 已审核
    });
    // 使用表单默认值加载数据
    handleSearch();
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
    handleSearch();
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
  const handleSplitModalOk = async (values: SplitFormValues) => {
    console.log("拆单表单数据:", values);
    // 重新加载数据
    await handleSearch();
    setIsSplitModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理搜索
  const handleSearch = async (
    customParams?: SplitListParams,
    page?: number,
    size?: number
  ) => {
    try {
      setLoading(true);

      let searchParams: SplitListParams;

      if (customParams) {
        // 如果传入了自定义参数，直接使用
        searchParams = customParams;
      } else {
        // 否则从表单获取参数
        const formValues = searchForm.getFieldsValue();
        searchParams = {
          orderNumber: formValues.orderNumber,
          customerName: formValues.customerName,
          designer: formValues.designer,
          salesperson: formValues.salesperson,
          splitter: formValues.splitter,
          orderStatus:
            formValues.orderStatus && formValues.orderStatus.length > 0
              ? formValues.orderStatus
              : undefined,
          quoteStatus:
            formValues.quoteStatus && formValues.quoteStatus.length > 0
              ? formValues.quoteStatus
              : undefined,
          orderType: formValues.orderType,
          orderCategory:
            formValues.orderCategory && formValues.orderCategory.length > 0
              ? formValues.orderCategory
              : undefined,
          startDate: formValues.splitDateRange?.[0]?.format("YYYY-MM-DD"),
          endDate: formValues.splitDateRange?.[1]?.format("YYYY-MM-DD"),
          orderDateStart: formValues.orderDateRange?.[0]?.format("YYYY-MM-DD"),
          orderDateEnd: formValues.orderDateRange?.[1]?.format("YYYY-MM-DD"),
        };
      }

      // 过滤掉空值
      const filteredParams = Object.fromEntries(
        Object.entries(searchParams).filter(
          ([_, value]) => value !== undefined && value !== "" && value !== null
        )
      );

      const params = {
        ...filteredParams,
        page: page || currentPage,
        pageSize: size || pageSize,
      };

      console.log("searchParams", filteredParams);
      const response = await getSplitOrders(params);
      setSplitData(response.items || []);
      setTotal(response.total || 0);
      setCurrentPage(response.page || 1);
      setPageSize(response.page_size || 10);

      // 如果不是自定义参数调用，搜索时重置到第一页
      if (!customParams && !page) {
        setCurrentPage(1);
      }
    } catch (error) {
      message.error("获取数据失败，请稍后重试");
      console.error("获取拆单数据失败:", error);
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
    // 设置订单状态默认选择"拆单中"和"已审核"
    searchForm.setFieldsValue({
      orderStatus: ["未开始", "拆单中", "撤销中"], // -1: 拆单中, 1: 已审核
    });
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
    const searchParams: SplitListParams = {
      orderNumber: formValues.orderNumber,
      customerName: formValues.customerName,
      designer: formValues.designer,
      salesperson: formValues.salesperson,
      splitter: formValues.splitter,
      orderStatus:
        formValues.orderStatus && formValues.orderStatus.length > 0
          ? formValues.orderStatus
          : undefined,
      quoteStatus:
        formValues.quoteStatus && formValues.quoteStatus.length > 0
          ? formValues.quoteStatus
          : undefined,
      orderType: formValues.orderType,
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

    await handleSearch(filteredParams, newPage, newPageSize);
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
        await handleSearch(); // 重新加载数据
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

  // 检查厂内生产项是否都有拆单日期
  const checkAllInternalItemsHaveSplitDate = (record: SplitOrder): boolean => {
    // 处理字符串格式的厂内生产项数据
    if (
      typeof record.internal_production_items === "string" &&
      record.internal_production_items
    ) {
      const itemStrings: string[] = record.internal_production_items.split(",");
      if (itemStrings.length === 0) {
        return false; // 没有厂内生产项，不能下单
      }

      // 检查所有厂内生产项是否都有实际时间（格式："类目:实际时间:消耗时间"）
      return itemStrings.every((item: string) => {
        const parts: string[] = item.split(":");
        const actualDate = parts[1]; // 实际时间在第二个位置
        return actualDate && actualDate.trim() !== "" && actualDate !== "-";
      });
    }

    // 处理数组格式的厂内生产项数据
    if (Array.isArray(record.internal_production_items)) {
      if (record.internal_production_items.length === 0) {
        return false; // 没有厂内生产项，不能下单
      }

      // 检查所有厂内生产项是否都有拆单日期（actual_date）
      return record.internal_production_items.every(
        (item) =>
          item.actual_date &&
          item.actual_date.trim() !== "" &&
          item.actual_date !== "-"
      );
    }

    return false; // 没有厂内生产项数据
  };

  // 处理下单操作
  const handlePlaceOrder = (record: SplitOrder) => {
    if (
      (!record.cabinet_area && !record.wall_panel_area) ||
      !record.order_amount
    ) {
      // 打开订单信息补充Modal
      handleOrderInfoEdit(record);
      return;
    }
    // 检查打款状态
    if (record.quote_status !== "已打款") {
      message.warning("只有已打款的订单才能下单！");
      return;
    }

    // 检查厂内生产项是否都有拆单日期
    if (!checkAllInternalItemsHaveSplitDate(record)) {
      message.warning("请先为所有厂内生产项更新拆单日期！");
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
          // 调用拆单下单API
          await placeSplitOrder(record.id);
          message.success("拆单下单成功");
          await handleSearch(); // 重新加载数据
        } catch (error) {
          message.error("下单失败，请稍后重试");
          console.error("下单失败:", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 处理订单信息补充
  const handleOrderInfoEdit = (record: SplitOrder) => {
    setOrderInfoEditingRecord(record);
    orderInfoForm.setFieldsValue({
      cabinet_area: record.cabinet_area || "",
      wall_panel_area: record.wall_panel_area || "",
      order_amount: record.order_amount || "",
    });
    setIsOrderInfoModalVisible(true);
  };

  // 提交订单信息补充
  const handleOrderInfoSubmit = async () => {
    if (!orderInfoEditingRecord) return;

    try {
      const values = await orderInfoForm.validateFields();
      setLoading(true);

      // 调用设计订单更新API
      const { updateDesignOrder } = await import("../../services/designApi");
      await updateDesignOrder(orderInfoEditingRecord.id.toString(), {
        cabinet_area: values.cabinet_area,
        wall_panel_area: values.wall_panel_area,
        order_amount: values.order_amount,
      });

      message.success("订单信息更新成功");
      setIsOrderInfoModalVisible(false);
      orderInfoForm.resetFields();
      setOrderInfoEditingRecord(null);

      // 重新加载数据
      await handleSearch();

      // 继续下单流程
      handlePlaceOrder({
        ...orderInfoEditingRecord,
        cabinet_area: parseFloat(values.cabinet_area) || 0,
        wall_panel_area: parseFloat(values.wall_panel_area) || 0,
        order_amount: parseFloat(values.order_amount) || 0,
      });
    } catch (error) {
      console.error("更新订单信息失败:", error);
      message.error("更新订单信息失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 关闭订单信息补充Modal
  const handleOrderInfoCancel = () => {
    setIsOrderInfoModalVisible(false);
    orderInfoForm.resetFields();
    setOrderInfoEditingRecord(null);
  };

  // 显示厂内生产项详情Modal
  const showInternalDetailModal = (record: SplitOrder) => {
    setInternalDetailOrder(record);
    setDetailModalItemType("internal");
    setIsInternalDetailModalVisible(true);
  };

  // 关闭厂内生产项详情Modal
  const handleInternalDetailCancel = () => {
    setIsInternalDetailModalVisible(false);
    setInternalDetailOrder(null);
  };

  // 显示外购项详情Modal
  const showExternalDetailModal = (record: SplitOrder) => {
    setInternalDetailOrder(record);
    setDetailModalItemType("external");
    setIsInternalDetailModalVisible(true);
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
      render: (items: ProductionItem[] | string, record: SplitOrder) => {
        if (!items) return "-";

        let productionItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          productionItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
              cycle_days: parts[2] || "",
            };
          });
        }
        if (!productionItems || productionItems.length === 0) return null;

        return (
          <div>
            {productionItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;
              const cycleDays = item.cycle_days;

              if (actualDate) {
                const cycleNumber = parseInt(cycleDays || "0") || 0;
                const isOverThreeDays = cycleNumber >= 3;
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}:{" "}
                    <span
                      style={{ color: isOverThreeDays ? "red" : "inherit" }}
                    >
                      {cycleDays}
                    </span>
                  </div>
                );
              } else {
                return <div key={index}>{name}:-</div>;
              }
            })}
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <Button
                type="link"
                size="small"
                onClick={() => showInternalDetailModal(record)}
                style={{ padding: 0, marginTop: "4px" }}
              >
                详情
              </Button>
            </div>
          </div>
        );
      },
    },
    {
      title: "外购项",
      dataIndex: "external_purchase_items",
      key: "external_purchase_items",
      render: (items: ProductionItem[] | string, record: SplitOrder) => {
        if (!items) return "-";
        let purchaseItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          purchaseItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
              cycle_days: parts[2] || "",
            };
          });
        }
        if (!purchaseItems || purchaseItems.length === 0) return null;

        return (
          <div>
            {purchaseItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;
              const cycleDays = item.cycle_days;

              if (actualDate) {
                const cycleNumber = parseInt(cycleDays || "0") || 0;
                const isOverThreeDays = cycleNumber >= 3;
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}:{" "}
                    <span
                      style={{ color: isOverThreeDays ? "red" : "inherit" }}
                    >
                      {cycleDays}
                    </span>
                  </div>
                );
              } else {
                return <div key={index}>{name}: -</div>;
              }
            })}
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <Button
                type="link"
                size="small"
                onClick={() => showExternalDetailModal(record)}
                style={{ padding: 0, marginTop: "4px" }}
              >
                详情
              </Button>
            </div>
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
        if (status === "已下单") {
          color = "green";
        } else if (status === "拆单中") {
          color = "blue";
        } else if (status === "撤销中") {
          color = "red";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 145,
      render: (_: unknown, record: SplitOrder) => {
        const isRevoked = record.order_status === "撤销中";
        const isNotStarted = record.order_status === "未开始";
        const isOrdered = record.order_status === "已下单";
        const canPlaceOrder =
          checkAllInternalItemsHaveSplitDate(record) &&
          record.quote_status === "已打款" &&
          !isOrdered;

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
              disabled={isRevoked || isOrdered}
              onClick={() => showEditModal(record)}
            >
              编辑订单
            </Button>
            <Button
              type="link"
              size="small"
              disabled={isRevoked || isNotStarted}
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
              disabled={isRevoked || !canPlaceOrder}
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
              <Form.Item name="customerName" label="客户名称" className="mb-0">
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
              <Form.Item name="splitter" label="拆单员" className="mb-0">
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
              <Form.Item name="quoteStatus" label="报价状态" className="mb-0">
                <Select
                  mode="multiple"
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
              <Form.Item name="orderStatus" label="订单状态" className="mb-0">
                <Select
                  mode="multiple"
                  placeholder="全部状态"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="未开始">未开始</Option>
                  <Option value="拆单中">拆单中</Option>
                  <Option value="撤销中">撤销中</Option>
                  <Option value="未审核">未审核</Option>
                  <Option value="已审核">已审核</Option>
                  <Option value="已下单">已下单</Option>
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
                name="splitDateRange"
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

      {/* 订单信息补充Modal */}
      <Modal
        title="补充订单信息并下单"
        open={isOrderInfoModalVisible}
        onOk={handleOrderInfoSubmit}
        onCancel={handleOrderInfoCancel}
        okText="确认并下单"
        cancelText="取消"
        width={500}
        confirmLoading={loading}
      >
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>订单号：</strong>
            {orderInfoEditingRecord?.order_number}
          </div>
          <div style={{ marginBottom: "16px" }}>
            <strong>客户名称：</strong>
            {orderInfoEditingRecord?.customer_name}
          </div>
          <Form
            form={orderInfoForm}
            layout="vertical"
            style={{ marginTop: "20px" }}
          >
            <Form.Item
              label="柜体面积（平方米）"
              name="cabinet_area"
              rules={[
                {
                  pattern: /^\d+(\.\d+)?$/,
                  message: "请输入有效的数字",
                },
              ]}
            >
              <Input placeholder="请输入柜体面积" suffix="㎡" />
            </Form.Item>
            <Form.Item
              label="墙板面积（平方米）"
              name="wall_panel_area"
              rules={[
                {
                  pattern: /^\d+(\.\d+)?$/,
                  message: "请输入有效的数字",
                },
              ]}
            >
              <Input placeholder="请输入墙板面积" suffix="㎡" />
            </Form.Item>
            <Form.Item
              label="订单金额（元）"
              name="order_amount"
              rules={[
                { required: true, message: "请输入订单金额" },
                {
                  pattern: /^\d+(\.\d+)?$/,
                  message: "请输入有效的金额",
                },
              ]}
            >
              <Input placeholder="请输入订单金额" suffix="元" />
            </Form.Item>
          </Form>
          <div
            style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "6px",
              padding: "12px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                color: "#52c41a",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              💡 提示
            </div>
            <div style={{ color: "#389e0d", fontSize: "14px" }}>
              补充完订单信息后，系统将自动为您进行下单操作。
            </div>
          </div>
        </div>
      </Modal>

      {/* 厂内生产项详情Modal */}
      <InternalProductionDetailModal
        visible={isInternalDetailModalVisible}
        order={internalDetailOrder}
        onCancel={handleInternalDetailCancel}
        itemType={detailModalItemType}
      />
    </div>
  );
};

export default DesignPage;
