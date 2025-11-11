"use client";

import React, { useState, useEffect } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule, PermissionService } from "@/utils/permissions";
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
  CloseOutlined,
} from "@ant-design/icons";
const { Option } = Select;
const { RangePicker } = DatePicker;
import {
  getProductionOrders,
  updateProductionOrder,
  type ProductionOrder,
} from "../../services/productionApi";
import EditProductionModal from "./editProductionModal";
import PurchaseStatusModal from "./purchaseStatusModal";
import ProductionProgressModal from "./productionProgressModal";
import PurchaseDetailModal from "./purchaseDetailModal";
import FinishedGoodsDetailModal from "./finishedGoodsDetailModal";
import PreviewModal from "./previewModal";
import { CategoryService, CategoryData } from "../../services/categoryService";

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
  const [
    isFinishedGoodsDetailModalVisible,
    setIsFinishedGoodsDetailModalVisible,
  ] = useState(false);
  useState<ProductionOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null
  );
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // 预览功能相关状态
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<ProductionOrder[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [searchForm] = Form.useForm();

  // 组件挂载时加载数据
  useEffect(() => {
    searchForm.setFieldsValue({
      splitStatus: ["未齐料", "已齐料", "已下料", "已入库", "已发货"],
    });
    handleSearch();
    loadCategories();
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
        // 重新加载数据，保持当前查询条件和分页状态
        const searchParams = getSearchParams();
        await handleSearch(searchParams, currentPage, pageSize);
      } else {
        message.error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("更新生产订单失败:", error);
      message.error("更新失败，请稍后重试");
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

  // 显示成品入库详情模态框
  const showFinishedGoodsDetailModal = (record: ProductionOrder) => {
    setSelectedOrder(record);
    setIsFinishedGoodsDetailModalVisible(true);
  };

  // 处理详情模态框取消
  const handleDetailModalCancel = () => {
    setIsDetailModalVisible(false);
    setSelectedOrder(null);
  };

  // 处理成品入库详情模态框取消
  const handleFinishedGoodsDetailModalCancel = () => {
    setIsFinishedGoodsDetailModalVisible(false);
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
    // 重新加载数据，保持当前查询条件和分页状态
    const searchParams = getSearchParams();
    await handleSearch(searchParams, currentPage, pageSize);
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
    // 重新加载数据，保持当前查询条件和分页状态
    const searchParams = getSearchParams();
    await handleSearch(searchParams, currentPage, pageSize);
  };

  // 通用的获取查询条件方法
  const getSearchParams = (
    customParams?: Record<string, string | string[]>,
    options?: {
      noPagination?: boolean;
    }
  ) => {
    const values = customParams || searchForm.getFieldsValue();
    const { noPagination = false } = options || {};

    // 标准的API字段名映射（统一使用snake_case）
    const searchParams: Record<string, string | string[] | boolean> = {
      order_number: values.orderNumber,
      customer_name: values.orderName,
      order_status: values.splitStatus,
      sort: values.sort, // 添加排序字段
      sort_order: values.sortOrder, // 添加排序规则（asc/desc）
      order_category: values.orderCategory, // 添加下单类目
      completion_status: values.completionStatus || undefined, // 添加完成状态
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

    // 如果需要获取全量数据，添加 no_pagination 参数
    if (noPagination) {
      searchParams.no_pagination = true;
    }

    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null
      )
    );

    return filteredParams;
  };

  // 处理搜索
  const handleSearch = async (
    customParams?: Record<string, string | string[] | boolean>,
    page?: number,
    size?: number
  ) => {
    setLoading(true);
    try {
      console.log("搜索条件:", customParams || searchForm.getFieldsValue());

      // 如果传入了customParams，直接使用；否则调用getSearchParams获取
      const filteredParams = customParams || getSearchParams();

      // 如果是用户主动查询（没有传入customParams和page），重置到第一页
      const targetPage = page !== undefined ? page : (!customParams ? 1 : currentPage);
      const targetPageSize = size || pageSize;

      const params = {
        ...filteredParams,
        page: targetPage,
        page_size: targetPageSize,
      };

      console.log("searchParams", filteredParams);
      const response = await getProductionOrders(params);
      if (response.code === 200) {
        // 后端返回的数据结构：{code, message, data: ProductionOrder[], total, page, page_size, total_pages}
        setProductionData(response.data || []);
        setTotal(response.total || 0);
        setCurrentPage(response.page || targetPage);
        setPageSize(response.page_size || targetPageSize);
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

  // 显示预览弹窗
  const showPreviewModal = async () => {
    try {
      setPreviewLoading(true);
      setIsPreviewModalVisible(true);

      const filteredParams = getSearchParams(undefined, { noPagination: true });

      const response = await getProductionOrders(filteredParams);
      if (response.code === 200) {
        setPreviewData(response.data || []);
      } else {
        message.error(response.message || "获取预览数据失败");
      }
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

      const filteredParams = getSearchParams(undefined, { noPagination: true });

      const response = await getProductionOrders(filteredParams);
      if (response.code !== 200) {
        message.error(response.message || "获取导出数据失败");
        return;
      }

      const exportData = response.data || [];
      if (exportData.length === 0) {
        message.warning("没有数据可导出");
        return;
      }

      // 解析所有采购状态，提取材料类别
      const allPurchaseCategories = new Set<string>();
      exportData.forEach((item: ProductionOrder) => {
        if (item.purchase_status) {
          // 解析采购状态字符串，格式：材料名称:日期; 材料名称:日期
          const statusParts = item.purchase_status.split(";");
          statusParts.forEach((part) => {
            const trimmedPart = part.trim();
            if (trimmedPart && trimmedPart !== "暂无进度信息") {
              const colonIndex = trimmedPart.indexOf(":");
              if (colonIndex > 0) {
                const categoryName = trimmedPart
                  .substring(0, colonIndex)
                  .trim();
                allPurchaseCategories.add(categoryName);
              }
            }
          });
        }
      });

      const sortedCategories = Array.from(allPurchaseCategories).sort();

      // 处理导出数据格式
      const excelData = exportData.map(
        (item: ProductionOrder, index: number) => {
          const baseData: Record<string, string | number | boolean> = {
            序号: index + 1,
            订单编号: item.order_number || "",
            客户名称: item.customer_name || "",
            地址: item.address || "",
            拆单员: item.splitter || "",
            是否安装: item.is_installation ? "是" : "否",
            客户打款日期: item.customer_payment_date || "",
            拆单下单日期: item.split_order_date || "",
            下单天数: item.order_days || "",
            预计交货日期: item.expected_delivery_date || "",
          };

          // 解析采购状态并填充到对应的材料列
          const purchaseData: { [key: string]: string } = {};
          if (item.purchase_status && item.purchase_status !== "暂无进度信息") {
            const statusParts = item.purchase_status.split(";");
            statusParts.forEach((part) => {
              const trimmedPart = part.trim();
              if (trimmedPart) {
                const colonIndex = trimmedPart.indexOf(":");
                if (colonIndex > 0) {
                  const categoryName = trimmedPart
                    .substring(0, colonIndex)
                    .trim();
                  const dateValue = trimmedPart
                    .substring(colonIndex + 1)
                    .trim();
                  purchaseData[categoryName] = dateValue || "";
                }
              }
            });
          }

          // 为每个材料类别添加列
          sortedCategories.forEach((category) => {
            baseData[category] = purchaseData[category] || "";
          });

          // 添加其余列
          const remainingData = {
            "18板": item.board_18 || "",
            "09板": item.board_09 || "",
            下料日期: item.cutting_date || "",
            预计出货日期: item.expected_shipping_date || "",
            实际出货日期: item.actual_delivery_date || "",
            订单状态: item.order_status || "",
            备注: item.remarks || "",
          };

          return { ...baseData, ...remainingData };
        }
      );

      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      let ws: XLSX.WorkSheet;

      if (sortedCategories.length > 0) {
        // 计算采购状态列的起始位置（从第11列开始，即K列）
        const purchaseStartCol = 10; // 0-based index, K列
        const purchaseEndCol = purchaseStartCol + sortedCategories.length - 1;

        // 先创建表头
        ws = XLSX.utils.aoa_to_sheet([
          [
            "序号",
            "订单编号",
            "客户名称",
            "地址",
            "拆单员",
            "是否安装",
            "客户打款日期",
            "拆单下单日期",
            "下单天数",
            "预计交货日期",
            "采购状态",
            ...Array(sortedCategories.length - 1).fill(""),
            "18板",
            "09板",
            "下料日期",
            "预计出货日期",
            "实际出货日期",
            "订单状态",
            "备注",
          ],
          [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ...sortedCategories,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ]);

        // 然后在第3行开始添加数据
        XLSX.utils.sheet_add_json(ws, excelData, {
          origin: "A3",
          skipHeader: true,
        });

        // 设置合并单元格
        if (!ws["!merges"]) ws["!merges"] = [];

        // 合并采购状态主表头
        ws["!merges"].push({
          s: { r: 0, c: purchaseStartCol }, // 采购状态开始列
          e: { r: 0, c: purchaseEndCol }, // 采购状态结束列
        });

        // 合并其他非采购状态的列
        const nonPurchaseCols = [
          { col: 0, name: "序号" },
          { col: 1, name: "订单编号" },
          { col: 2, name: "客户名称" },
          { col: 3, name: "地址" },
          { col: 4, name: "拆单员" },
          { col: 5, name: "是否安装" },
          { col: 6, name: "客户打款日期" },
          { col: 7, name: "拆单下单日期" },
          { col: 8, name: "下单天数" },
          { col: 9, name: "预计交货日期" },
        ];

        nonPurchaseCols.forEach(({ col }) => {
          if (!ws["!merges"]) ws["!merges"] = [];
          ws["!merges"].push({
            s: { r: 0, c: col },
            e: { r: 1, c: col },
          });
        });

        // 合并后续列
        const afterPurchaseCols = purchaseEndCol + 1;
        const totalCols =
          excelData.length > 0 ? Object.keys(excelData[0]).length : 0;
        for (let col = afterPurchaseCols; col < totalCols; col++) {
          ws["!merges"].push({
            s: { r: 0, c: col },
            e: { r: 1, c: col },
          });
        }

        // 调整数据起始行
        ws["!ref"] = XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: totalCols - 1, r: excelData.length + 1 },
        });
      } else {
        // 如果没有采购状态数据，直接创建简单表格
        ws = XLSX.utils.json_to_sheet(excelData);
      }

      // 设置列宽
      const colWidths = [
        { wch: 6 }, // 序号
        { wch: 15 }, // 订单编号
        { wch: 12 }, // 客户名称
        { wch: 20 }, // 地址
        { wch: 10 }, // 拆单员
        { wch: 8 }, // 是否安装
        { wch: 12 }, // 客户打款日期
        { wch: 12 }, // 拆单下单日期
        { wch: 10 }, // 下单天数
        { wch: 12 }, // 预计交货日期
        { wch: 25 }, // 采购状态
        { wch: 10 }, // 18板
        { wch: 10 }, // 09板
        { wch: 12 }, // 下料日期
        { wch: 12 }, // 实际出货日期
        { wch: 12 }, // 预计出货日期
        { wch: 10 }, // 订单状态
        { wch: 20 }, // 备注
      ];
      ws["!cols"] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, "生产管理");

      // 生成文件名
      const timestamp = dayjs().format("YYYY-MM-DD_HH-mm-ss");
      const fileName = `生产管理_${timestamp}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, fileName);

      message.success("导出成功");
    } catch (error) {
      message.error("导出失败，请稍后重试");
      console.error("导出失败:", error);
    } finally {
      setLoading(false);
    }
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

    // 获取当前搜索条件（统一使用标准API字段名映射）
    const filteredParams = getSearchParams();

    // 使用当前的筛选条件和新的分页参数重新搜索数据
    await handleSearch(filteredParams, newPage, newPageSize);
  };

  // 表格列定义
  const columns: ColumnsType<ProductionOrder> = [
    {
      title: "订单编号",
      dataIndex: "order_number",
      key: "order_number",
      width: "auto",
      minWidth: 90,
      fixed: "left",
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 150,
      fixed: "left",
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
      width: 90,
      render: (value: boolean) => <span>{value ? "是" : "否"}</span>,
    },
    {
      title: "客户打款日期",
      dataIndex: "customer_payment_date",
      key: "customer_payment_date",
      render: (text: string) => text || "-",
      width: 130,
    },
    {
      title: "拆单下单日期",
      dataIndex: "split_order_date",
      key: "split_order_date",
      render: (text: string) => text || "-",
      width: 130,
    },
    {
      title: "下单天数",
      dataIndex: "order_days",
      key: "order_days",
      width: 90,
      render: (value: string, record: ProductionOrder) => {
        if (record.split_order_date && record.customer_payment_date) {
          const splitDate = new Date(record.split_order_date);
          const paymentDate = new Date(record.customer_payment_date);
          // 计算逻辑：拆单下单日期 - 客户打款日期
          const diffTime = splitDate.getTime() - paymentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          // 确保最小值为1天
          const finalDays = Math.max(diffDays, 1);
          return `${finalDays}天`;
        }
        return value ? `${value}天` : "-";
      },
    },
    {
      title: "预计交货日期",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      render: (text: string) => text || "-",
      width: 130,
    },
    {
      title: "采购状态",
      dataIndex: "purchase_status",
      key: "purchase_status",
      render: (text: string, record: ProductionOrder) => {
        if (!text || text === "暂无进度信息") {
          return "-";
        }

        const items = text
          .split("; ")
          .map((item) => item.trim())
          .filter((item) => item);

        // 解析进度项目，分离事件名、计划时间和实际时间（兼容旧数据）
        const parseProgressItem = (item: string) => {
          const parts = item.split(":").map((p) => p.trim());
          if (parts.length >= 3) {
            return { status: parts[0], planned: parts[1], actual: parts[2] };
          }
          if (parts.length === 2) {
            // 兼容旧格式：状态:实际时间（无计划时间）
            return { status: parts[0], planned: "-", actual: parts[1] };
          }
          return { status: parts[0] || item.trim(), planned: "-", actual: "-" };
        };

        // 默认显示最近的3条记录
        // const displayItems = items.slice(0, 3);

        return (
          <div>
            {items.map((item, itemIndex) => {
              const { status, planned, actual } = parseProgressItem(item);
              const hasPlanned = planned && planned !== "-";
              const hasActual = actual && actual !== "-";
              const isCompleted = !!hasActual;
              return (
                <div key={itemIndex}>
                  <span>
                    {isCompleted ? (
                      <CheckOutlined
                        style={{ color: "green", marginRight: 4 }}
                      />
                    ) : (
                      <CloseOutlined style={{ color: "red", marginRight: 4 }} />
                    )}
                    {status}：
                    <Space size={4} wrap>
                      <Tag
                        color={hasPlanned ? "blue" : "default"}
                        style={{
                          margin: 0,
                          padding: "0 6px",
                          height: 20,
                          lineHeight: "20px",
                          fontSize: 12,
                        }}
                      >
                        计划：{planned || "-"}
                      </Tag>
                      <Tag
                        color={hasActual ? "green" : "default"}
                        style={{
                          margin: 0,
                          padding: "0 6px",
                          height: 20,
                          lineHeight: "20px",
                          fontSize: 12,
                        }}
                      >
                        实际：{actual || "-"}
                      </Tag>
                    </Space>
                  </span>
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
      title: "成品入库数量",
      dataIndex: "finished_goods_quantity",
      key: "finished_goods_quantity",
      render: (text: string, record: ProductionOrder) => {
        if (!text) return "-";

        const statusParts = text.split(";");
        return (
          <div>
            {statusParts.map((part, index) => {
              const [item, quantity] = part.split(":");

              return (
                <div key={index} style={{ marginBottom: 4 }}>
                  <span>{item.trim()}: </span>
                  <span>{quantity ? `${quantity.trim()}件` : "-"}</span>
                </div>
              );
            })}
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <Button
                type="link"
                size="small"
                onClick={() => showFinishedGoodsDetailModal(record)}
                style={{ padding: 0, height: "auto" }}
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
      minWidth: 90,
      width: "auto",
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
      width: 130,
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
              disabled={
                record.order_status === "已完成" ||
                record.order_status !== "已发货"
              }
              onClick={() => {
                Modal.confirm({
                  title: "确认完成订单",
                  content: `确定要将订单 ${record.order_number} 标记为已完成吗？`,
                  onOk: async () => {
                    try {
                      await updateProductionOrder(record.id.toString(), {
                        order_status: "已完成",
                      });
                      message.success("订单状态更新成功");
                      handleSearch();
                    } catch (error) {
                      console.error("更新订单状态失败:", error);
                      message.error("更新订单状态失败");
                    }
                  },
                });
              }}
            >
              完成订单
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
          initialValues={{
            sort: "expected_shipping_date",
            splitStatus: ["未齐料", "已齐料", "已下料", "已入库", "已发货"],
            sortOrder: "desc",
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
              <Form.Item name="completionStatus" label="类目是否完成" className="mb-0">
                <Select
                  placeholder="全部"
                  className="rounded-md"
                  size="middle"
                  allowClear
                >
                  <Option value="completed">已完成</Option>
                  <Option value="incomplete">未完成</Option>
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
                  maxTagCount="responsive"
                  popupRender={(menu) => {
                    const allStatusOptions = [
                      "未齐料",
                      "已齐料",
                      "已下料",
                      "已入库",
                      "已发货",
                      "已完成",
                    ];
                    const currentValues =
                      searchForm.getFieldValue("splitStatus") || [];
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
                                searchForm.setFieldsValue({ splitStatus: [] });
                              } else {
                                searchForm.setFieldsValue({
                                  splitStatus: allStatusOptions,
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
                  placeholder="选择排序方式"
                  className="rounded-md"
                  size="middle"
                >
                  <Option value="expected_shipping_date">预计出货日期</Option>
                  <Option value="expected_delivery_date">预计交货日期</Option>
                  <Option value="split_order_date">拆单下单日期</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} className="py-2">
              <Form.Item name="sortOrder" label="排序规则" className="mb-0">
                <Select
                  placeholder="选择排序规则"
                  className="rounded-md"
                  size="middle"
                >
                  <Option value="desc">降序(从近到远)</Option>
                  <Option value="asc">升序(从远倒近)</Option>
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
          {/* 导出按钮 - 财务、超管 */}
          {PermissionService.canExportProduction() && (
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
            pageSizeOptions: ["2", "20", "50", "100"],
          }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.id}
          scroll={{ x: "max-content" }}
          sticky={{ offsetHeader: -20 }}
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

      {/* 成品入库详情模态框 */}
      <FinishedGoodsDetailModal
        visible={isFinishedGoodsDetailModalVisible}
        order={selectedOrder}
        onCancel={handleFinishedGoodsDetailModalCancel}
      />

      {/* 预览模态框 */}
      <PreviewModal
        visible={isPreviewModalVisible}
        data={previewData}
        loading={previewLoading}
        onCancel={handlePreviewModalCancel}
        title="生产订单数据预览"
      />
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
