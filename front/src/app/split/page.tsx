"use client";

import React, { useState, useEffect } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule } from "@/utils/permissions";
import PermissionService from "@/utils/permissions";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
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
  CloseOutlined,
} from "@ant-design/icons";
import {
  getSplitOrders,
  updateSplitStatus,
  updateSplitOrder,
  placeSplitOrder,
  type SplitOrder,
  type ProductionItem,
  type SplitListParams,
} from "../../services/splitApi";
import { updateDesignOrder } from "../../services/designApi";
import { formatDateTime } from "../../utils/dateUtils";
import EditOrderModal from "./editOrderModal";
import type { EditFormValues } from "./editOrderModal";
import SplitOrderModal from "./splitOrderModal";
import type { SplitFormValues } from "./splitOrderModal";
import type { Dayjs } from "dayjs";
import { UserService, UserData, UserRole } from "../../services/userService";
import { CategoryService, CategoryData } from "../../services/categoryService";
import InternalProductionDetailModal from "./progressDetailModal";
import PreviewModal from "./previewModal";

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

  // 预览功能相关状态
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<SplitOrder[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
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

  // 统一的获取搜索参数方法
  const buildSearchParams = (options?: {
    no_pagination?: boolean;
  }): SplitListParams => {
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
      orderCategory:
        formValues.orderCategory && formValues.orderCategory.length > 0
          ? formValues.orderCategory
          : undefined,
      startDate: formValues.splitDateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: formValues.splitDateRange?.[1]?.format("YYYY-MM-DD"),
      orderDateStart: formValues.orderDateRange?.[0]?.format("YYYY-MM-DD"),
      orderDateEnd: formValues.orderDateRange?.[1]?.format("YYYY-MM-DD"),
    };

    // 如果需要获取全量数据，添加no_pagination参数
    if (options?.no_pagination) {
      searchParams.no_pagination = true;
    }

    return searchParams;
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
        searchParams = buildSearchParams();
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

  // 显示预览弹窗
  const showPreviewModal = async () => {
    try {
      setPreviewLoading(true);
      setIsPreviewModalVisible(true);

      // 获取当前搜索条件
      const searchParams = buildSearchParams({ no_pagination: true });

      // 过滤掉空值
      const filteredParams = Object.fromEntries(
        Object.entries(searchParams).filter(
          ([_, value]) => value !== undefined && value !== "" && value !== null
        )
      );

      // 调用接口获取数据
      const response = await getSplitOrders(filteredParams);
      setPreviewData(response.items || []);
    } catch (error) {
      message.error("获取预览数据失败，请稍后重试");
      console.error("获取预览数据失败:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 关闭预览弹窗
  const handlePreviewModalCancel = () => {
    setIsPreviewModalVisible(false);
    setPreviewData([]);
  };

  // 处理导出Excel功能
  const handleExportExcel = async () => {
    try {
      setLoading(true);

      // 获取当前搜索条件
      const searchParams = buildSearchParams({ no_pagination: true });

      // 过滤掉空值
      const filteredParams = Object.fromEntries(
        Object.entries(searchParams).filter(
          ([_, value]) => value !== undefined && value !== "" && value !== null
        )
      );

      // 调用接口获取全量数据
      const response = await getSplitOrders(filteredParams);
      const exportData = response.items || [];
      if (exportData.length === 0) {
        message.destroy();
        message.warning("没有数据可导出");
        return;
      }

      // 解析生产项目，分离项目名、实际时间和消耗时间（格式："类目:实际时间:消耗时间"）
      const parseProductionItem = (item: string) => {
        if (item.includes(":")) {
          const parts = item.split(":");
          if (parts.length >= 3) {
            return {
              name: parts[0].trim(),
              date: parts[1].trim(),
              cycle: parts[2].trim(),
            };
          } else if (parts.length >= 2) {
            return {
              name: parts[0].trim(),
              date: parts[1].trim(),
              cycle: null,
            };
          }
        }
        return { name: item, date: null, cycle: null };
      };

      // 分别循环处理厂内生产项和外购项，各自去重
      const allInternalItems = new Set<string>();
      const allExternalItems = new Set<string>();

      exportData.forEach((item: SplitOrder) => {
        // 处理厂内生产项
        if (item.internal_production_items) {
          let internalItems: string[] = [];
          if (typeof item.internal_production_items === "string") {
            internalItems = item.internal_production_items
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else if (Array.isArray(item.internal_production_items)) {
            internalItems = item.internal_production_items
              .map((prod) => prod.category_name)
              .filter((name) => name);
          }

          internalItems.forEach((internalItem) => {
            const parsed = parseProductionItem(internalItem);
            if (parsed.name) {
              allInternalItems.add(parsed.name);
            }
          });
        }

        // 处理外购项
        if (item.external_purchase_items) {
          let externalItems: string[] = [];
          if (typeof item.external_purchase_items === "string") {
            externalItems = item.external_purchase_items
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else if (Array.isArray(item.external_purchase_items)) {
            externalItems = item.external_purchase_items
              .map((prod) => prod.category_name)
              .filter((name) => name);
          }

          externalItems.forEach((externalItem) => {
            const parsed = parseProductionItem(externalItem);
            if (parsed.name) {
              allExternalItems.add(parsed.name);
            }
          });
        }
      });

      // 转换为数组，保持厂内和外购项目的独立性
      const sortedInternalItems = Array.from(allInternalItems);
      const sortedExternalItems = Array.from(allExternalItems);
      console.log("sortedInternalItems", sortedInternalItems);
      console.log("sortedExternalItems", sortedExternalItems);

      // 处理导出数据格式
      const excelData = exportData.map((item: SplitOrder, index: number) => {
        // 解析厂内生产项
        const internalMap = new Map<string, string>();
        if (item.internal_production_items) {
          let internalItems: string[] = [];
          if (typeof item.internal_production_items === "string") {
            internalItems = item.internal_production_items
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else if (Array.isArray(item.internal_production_items)) {
            internalItems = item.internal_production_items.map((prod) =>
              prod.planned_date
                ? `${prod.category_name}:${prod.planned_date}:`
                : prod.category_name
            );
          }

          internalItems.forEach((internalItem) => {
            const parsed = parseProductionItem(internalItem);
            if (parsed.name) {
              // 存储完整的时间信息：实际时间:消耗时间
              const timeInfo =
                parsed.date && parsed.cycle
                  ? `${parsed.date}:${parsed.cycle}`
                  : parsed.date || "";
              internalMap.set(parsed.name, timeInfo);
            }
          });
        }

        // 解析外购项
        const externalMap = new Map<string, string>();
        if (item.external_purchase_items) {
          let externalItems: string[] = [];
          if (typeof item.external_purchase_items === "string") {
            externalItems = item.external_purchase_items
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else if (Array.isArray(item.external_purchase_items)) {
            externalItems = item.external_purchase_items.map((prod) =>
              prod.planned_date
                ? `${prod.category_name}:${prod.planned_date}:`
                : prod.category_name
            );
          }

          externalItems.forEach((externalItem) => {
            const parsed = parseProductionItem(externalItem);
            if (parsed.name) {
              // 存储完整的时间信息：实际时间:消耗时间
              const timeInfo =
                parsed.date && parsed.cycle
                  ? `${parsed.date}:${parsed.cycle}`
                  : parsed.date || "";
              externalMap.set(parsed.name, timeInfo);
            }
          });
        }

        // 构建基础数据
        const baseData: Record<string, string | number> = {
          序号: index + 1,
          订单编号: item.order_number || "",
          客户名称: item.customer_name || "",
          地址: item.address || "",
          下单日期: item.order_date || "",
          拆单员: item.splitter || "",
          设计师: item.designer || "",
          销售员: item.salesperson || "",
        };

        // 添加厂内生产项的各个类型
        sortedInternalItems.forEach((itemName) => {
          baseData[`厂内-${itemName}`] = internalMap.get(itemName) || "";
        });

        // 添加外购项的各个类型
        sortedExternalItems.forEach((itemName) => {
          baseData[`外购-${itemName}`] = externalMap.get(itemName) || "";
        });

        // 添加其他字段
        Object.assign(baseData, {
          报价状态: item.quote_status || "",
          完成日期: item.completion_date || "",
          柜体面积: `${item.cabinet_area || 0}㎡`,
          墙板面积: `${item.wall_panel_area || 0}㎡`,
          订单金额: item.order_amount
            ? `${Number(item.order_amount).toLocaleString("zh-CN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : "",
          订单状态: item.order_status || "",
          备注: item.remarks || "",
        });

        return baseData;
      });
      console.log("excelData", excelData);

      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      let ws: XLSX.WorkSheet;

      // 创建合并单元格的表头结构
      if (sortedInternalItems.length > 0 || sortedExternalItems.length > 0) {
        // 计算厂内生产项和外购项列的起始位置
        const internalStartCol = 8; // 从第9列开始（0-based index）
        const internalEndCol =
          internalStartCol + sortedInternalItems.length - 1;
        const externalStartCol = internalEndCol + 1;
        const externalEndCol =
          externalStartCol + sortedExternalItems.length - 1;

        // 构建表头
        const header1 = [
          "序号",
          "订单编号",
          "客户名称",
          "地址",
          "下单日期",
          "设计师",
          "销售员",
          "拆单员",
        ];

        // 添加厂内生产项表头
        if (sortedInternalItems.length > 0) {
          header1.push("厂内生产项");
          header1.push(...Array(sortedInternalItems.length - 1).fill(""));
        }

        // 添加外购项表头
        if (sortedExternalItems.length > 0) {
          header1.push("外购项");
          header1.push(...Array(sortedExternalItems.length - 1).fill(""));
        }

        // 添加其他列表头
        header1.push(
          "报价状态",
          "完成日期",
          "柜体面积",
          "墙板面积",
          "订单金额",
          "订单状态",
          "备注"
        );

        // 构建第二行表头
        const header2 = ["", "", "", "", "", "", "", ""];

        // 添加厂内生产项子表头
        sortedInternalItems.forEach((itemName) => {
          header2.push(itemName);
        });

        // 添加外购项子表头
        sortedExternalItems.forEach((itemName) => {
          header2.push(itemName);
        });

        // 添加其他列的空占位
        header2.push("", "", "", "", "", "", "");

        // 计算总列数
        const totalCols = header1.length;

        // 创建工作表
        ws = XLSX.utils.aoa_to_sheet([header1, header2]);

        // 在第3行开始添加数据
        XLSX.utils.sheet_add_json(ws, excelData, {
          origin: "A3",
          skipHeader: true,
        });

        // 设置合并单元格
        if (!ws["!merges"]) ws["!merges"] = [];

        // 合并厂内生产项主表头
        if (sortedInternalItems.length > 0) {
          ws["!merges"].push({
            s: { r: 0, c: internalStartCol },
            e: { r: 0, c: internalEndCol },
          });
        }

        // 合并外购项主表头
        if (sortedExternalItems.length > 0) {
          ws["!merges"].push({
            s: { r: 0, c: externalStartCol },
            e: { r: 0, c: externalEndCol },
          });
        }

        // 合并其他非生产项的列（前8列：序号到拆单员）
        const beforeProductionCols = [
          { col: 0, name: "序号" },
          { col: 1, name: "订单编号" },
          { col: 2, name: "客户名称" },
          { col: 3, name: "地址" },
          { col: 4, name: "下单日期" },
          { col: 5, name: "设计师" },
          { col: 6, name: "销售员" },
          { col: 7, name: "拆单员" },
        ];

        beforeProductionCols.forEach(({ col }) => {
          if (ws["!merges"]) {
            ws["!merges"].push({
              s: { r: 0, c: col },
              e: { r: 1, c: col },
            });
          }
        });

        // 合并生产项后面的列（完成日期到订单状态）
        const afterProductionStartCol = externalEndCol + 1;
        const afterProductionCols = [
          { col: afterProductionStartCol, name: "完成日期" },
          { col: afterProductionStartCol + 1, name: "柜体面积" },
          { col: afterProductionStartCol + 2, name: "墙板面积" },
          { col: afterProductionStartCol + 3, name: "订单金额" },
          { col: afterProductionStartCol + 4, name: "备注" },
          { col: afterProductionStartCol + 5, name: "订单状态" },
        ];

        afterProductionCols.forEach(({ col }) => {
          if (ws["!merges"]) {
            ws["!merges"].push({
              s: { r: 0, c: col },
              e: { r: 1, c: col },
            });
          }
        });

        // 调整数据起始行
        ws["!ref"] = XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: totalCols - 1, r: excelData.length + 2 - 1 }, // 2行表头 + 数据行数 - 1
        });
      } else {
        // 如果没有生产项，直接创建简单表格
        ws = XLSX.utils.json_to_sheet(excelData);
      }

      // 设置列宽
      const colWidths = [
        { wch: 6 }, // 序号
        { wch: 15 }, // 订单编号
        { wch: 12 }, // 客户名称
        { wch: 20 }, // 地址
        { wch: 12 }, // 下单日期
        { wch: 10 }, // 设计师
        { wch: 10 }, // 销售员
        { wch: 10 }, // 拆单员
      ];

      // 为每个厂内生产项添加列宽
      sortedInternalItems.forEach(() => {
        colWidths.push({ wch: 12 });
      });

      // 为每个外购项添加列宽
      sortedExternalItems.forEach(() => {
        colWidths.push({ wch: 12 });
      });

      // 添加其他列的列宽（按照header1的顺序：报价状态、完成日期、柜体面积、墙板面积、订单金额、订单状态、备注）
      colWidths.push(
        { wch: 12 }, // 报价状态
        { wch: 12 }, // 完成日期
        { wch: 13 }, // 柜体面积
        { wch: 14 }, // 墙板面积
        { wch: 15 }, // 订单金额
        { wch: 16 }, // 订单状态
        { wch: 17 } // 备注
      );

      ws["!cols"] = colWidths;

      // 设置表头样式 - 居中对齐
      if (sortedInternalItems.length > 0 || sortedExternalItems.length > 0) {
        // 获取工作表的范围
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

        // 为表头行设置样式
        for (let row = 0; row <= 1; row++) {
          for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!ws[cellAddress]) continue;

            // 设置单元格样式
            if (!ws[cellAddress].s) ws[cellAddress].s = {};
            ws[cellAddress].s.alignment = {
              horizontal: "center",
              vertical: "center",
            };
          }
        }
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, "拆单管理");

      // 生成文件名
      const timestamp = dayjs().format("YYYY-MM-DD_HH-mm-ss");
      const fileName = `拆单管理_${timestamp}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, fileName);

      message.destroy();
      message.success("导出成功");
    } catch (error) {
      message.destroy();
      message.error("导出失败，请稍后重试");
      console.error("导出失败:", error);
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

      // 调用拆单更新API，后端会自动同步更新设计订单
      await updateSplitOrder(orderInfoEditingRecord.id, {
        // 传递需要更新的三个字段，后端会同步到设计订单
        cabinet_area: parseFloat(values.cabinet_area),
        wall_panel_area: parseFloat(values.wall_panel_area),
        order_amount: parseFloat(values.order_amount),
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
        cabinet_area: parseFloat(values.cabinet_area),
        wall_panel_area: parseFloat(values.wall_panel_area),
        order_amount: parseFloat(values.order_amount),
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
      width: "auto",
      minWidth: 120,
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
      title: "地址",
      dataIndex: "address",
      key: "address",
      width: 60,
    },

    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      render: (date: string) => formatDateTime(date),
      width: 120,
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      render: (text: string) => text || "-",
      width: 80,
    },
    {
      title: "厂内生产项",
      dataIndex: "internal_production_items",
      key: "internal_production_items",
      minWidth: 120,
      width: "auto",
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
                      {cycleDays}天
                    </span>
                  </div>
                );
              } else {
                const currentDate = new Date();
                const orderDate = record.order_date
                  ? new Date(record.order_date)
                  : null;
                const daysPassed = orderDate
                  ? Math.floor(
                      (currentDate.getTime() - orderDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div key={index}>
                    <CloseOutlined
                      style={{ color: "red", marginRight: "4px" }}
                    />
                    {name}: -{" "}
                    {daysPassed >= 1 && (
                      <span
                        style={{
                          color: daysPassed >= 3 ? "red" : "inherit",
                          marginLeft: "4px",
                        }}
                      >
                        逾期: {daysPassed}天
                      </span>
                    )}
                  </div>
                );
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
      minWidth: 120,
      width: "auto",
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
                      {cycleDays}天
                    </span>
                  </div>
                );
              } else {
                const currentDate = new Date();
                const orderDate = record.order_date
                  ? new Date(record.order_date)
                  : null;
                const daysPassed = orderDate
                  ? Math.floor(
                      (currentDate.getTime() - orderDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div key={index}>
                    <CloseOutlined
                      style={{ color: "red", marginRight: "4px" }}
                    />
                    {name}: -{" "}
                    {
                      daysPassed >= 1 && (
                        <span
                          style={{
                            color: daysPassed >= 3 ? "red" : "inherit",
                            marginLeft: "4px",
                          }}
                        >
                          逾期: {daysPassed}天
                        </span>
                      )
                    }
                  </div>
                );
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
      width: 90,
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
      width: 120,
    },
    {
      title: "订单类型",
      dataIndex: "order_type",
      key: "order_type",
      width: 90,
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
    ...(PermissionService.canViewSplitOrderAmount()
      ? [
          {
            title: "订单金额",
            dataIndex: "order_amount",
            key: "order_amount",
            width: 90,
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
        ]
      : []),
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
      width: "auto",
      minWidth: 80,
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
          record.order_status === "已审核" &&
          !isOrdered;

        return (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: "145px",
            }}
          >
            {PermissionService.canEditSplitOrder() && (
              <Button
                type="link"
                size="small"
                disabled={isRevoked || isOrdered}
                onClick={() => showEditModal(record)}
              >
                编辑订单
              </Button>
            )}
            {PermissionService.canUpdateSplitProgress() && (
              <Button
                type="link"
                size="small"
                disabled={isRevoked || isNotStarted}
                onClick={() => showSplitModal(record)}
              >
                更新进度
              </Button>
            )}
            {PermissionService.canUpdateOrderStatus() && (
              <Button
                type="link"
                size="small"
                disabled={isRevoked || isNotStarted}
                onClick={() => showOrderStatusModal(record)}
              >
                订单状态
              </Button>
            )}
            {PermissionService.canUpdateQuoteStatus() && (
              <Button
                type="link"
                size="small"
                disabled={isRevoked || record.quote_status === "已打款"}
                onClick={() => showPriceStatusModal(record)}
              >
                报价状态
              </Button>
            )}
            {PermissionService.canPlaceSplitOrder() && (
              <Button
                type="link"
                size="small"
                disabled={isRevoked || !canPlaceOrder}
                onClick={() => handlePlaceOrder(record)}
              >
                下单
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索Card */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Form
          form={searchForm}
          initialValues={{
            orderStatus: ["未开始", "拆单中", "撤销中", "未审核", "已审核"],
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
                  maxTagCount="responsive"
                  popupRender={(menu) => {
                    const allStatusOptions = [
                      "未开始",
                      "拆单中",
                      "撤销中",
                      "未审核",
                      "已审核",
                      "已下单",
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
        <div className="flex justify-end gap-2 items-center mb-4">
          <Button
            type="default"
            icon={<SearchOutlined />}
            size="small"
            className="border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
            onClick={showPreviewModal}
          >
            数据预览
          </Button>
          {PermissionService.canExportSplit() && (
            <Button
              icon={<ExportOutlined />}
              size="small"
              className="border-gray-300 hover:border-blue-500"
              onClick={handleExportExcel}
              loading={loading}
            >
              导出
            </Button>
          )}
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
          sticky={{ offsetHeader: -20 }}
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

      {/* 数据预览Modal */}
      <PreviewModal
        visible={isPreviewModalVisible}
        data={previewData}
        loading={previewLoading}
        onCancel={handlePreviewModalCancel}
      />
    </div>
  );
};

export default function SplitPageWithGuard() {
  return (
    <RouteGuard requiredModule={PageModule.SPLIT}>
      <DesignPage />
    </RouteGuard>
  );
}
