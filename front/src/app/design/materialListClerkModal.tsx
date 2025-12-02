"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  InputNumber,
  Spin,
  Table,
  DatePicker,
  Card,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExportOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import type { DesignOrder } from "../../services/designApi";
import MaterialListService, {
  MaterialListItem,
  QuotationCategory,
  QuotationProject,
} from "../../services/materialListService";
import { ClerkCompareView, type TableRowData } from "./CompareView";
import {
  QuotationConfigService,
  QuotationCategoryTree,
  MaterialData,
  ColorData,
} from "../../services/quotationConfigService";

const { Option } = Select;

interface MaterialListClerkModalProps {
  visible: boolean;
  onCancel: () => void;
  order: DesignOrder | null;
  onSuccess?: () => void;
}

// TableRowData 已从 CompareView.tsx 导入

const MaterialListClerkModal: React.FC<MaterialListClerkModalProps> = ({
  visible,
  onCancel,
  order,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [materialList, setMaterialList] = useState<MaterialListItem | null>(
    null
  );
  const [tableData, setTableData] = useState<TableRowData[]>([]);
  const [categoryTree, setCategoryTree] = useState<QuotationCategoryTree[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [colors, setColors] = useState<ColorData[]>([]);
  const [quotationType, setQuotationType] = useState<"dealer" | "owner">(
    "owner"
  );
  const [editingKey, setEditingKey] = useState<React.Key | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [quotationDate, setQuotationDate] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isCompareVisible, setIsCompareVisible] = useState(false);
  const [isDiscountPriceVisible, setIsDiscountPriceVisible] = useState(false);
  const [discountPrices, setDiscountPrices] = useState<Map<number, number>>(
    new Map()
  );
  const [revisionSnapshot, setRevisionSnapshot] = useState<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
  } | null>(null);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
  } | null>(null);

  // 货币格式化函数
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "-";
    }
    return `¥${amount.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 加载物料清单数据
  useEffect(() => {
    if (visible && order) {
      const loadData = async () => {
        await loadMaterialListData();
        await loadConfigData();
      };
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, order]);

  const loadMaterialListData = async () => {
    if (!order) return;
    try {
      setLoading(true);
      const materialListData = await MaterialListService.getMaterialListByOrder(
        order.order_number
      );
      if (materialListData) {
        setMaterialList(materialListData);
        setQuotationType(materialListData.quotation_type || "owner");

        const detail = await MaterialListService.getMaterialListDetail(
          materialListData.id
        );

        // 转换为表格数据格式
        const data: TableRowData[] = [];
        detail.projects.forEach((project) => {
          detail.categories
            .filter((c) => c.project_id === project.id)
            .forEach((category) => {
              data.push({
                ...category,
                key: category.id,
                project_name: project.name,
                editing: false,
              });
            });
        });
        setTableData(data);

        // 录入员在submitted状态时，加载提报时快照和修订前快照用于对比
        if (materialListData.status === "submitted") {
          // 加载提报时快照
          const submittedSnap = await MaterialListService.getSubmittedSnapshot(
            materialListData.id
          );
          if (submittedSnap) {
            setSubmittedSnapshot({
              projects: submittedSnap.projects,
              categories: submittedSnap.categories,
            });
          } else {
            setSubmittedSnapshot(null);
          }

          // 加载修订前快照（用于对比）
          const revisionSnap = await MaterialListService.getRevisionSnapshot(
            materialListData.id
          );
          if (revisionSnap) {
            setRevisionSnapshot({
              projects: revisionSnap.projects,
              categories: revisionSnap.categories,
            });
          } else {
            setRevisionSnapshot(null);
          }
        } else {
          setRevisionSnapshot(null);
          setSubmittedSnapshot(null);
        }
      } else {
        setMaterialList(null);
        setTableData([]);
        setRevisionSnapshot(null);
      }
    } catch (error) {
      console.error("加载物料清单失败:", error);
      message.error("加载物料清单失败");
    } finally {
      setLoading(false);
    }
  };

  const loadConfigData = async () => {
    try {
      const [treeData, materialData, colorData] = await Promise.all([
        QuotationConfigService.getCategoryTree(),
        QuotationConfigService.getMaterialList(),
        QuotationConfigService.getColorList(),
      ]);
      setCategoryTree(treeData);
      setMaterials(materialData);
      setColors(colorData);
    } catch (error) {
      console.error("加载配置数据失败:", error);
    }
  };

  // 选择报价类型后自动填充单价
  const handleQuotationTypeChange = async (type: "dealer" | "owner") => {
    if (!materialList) return;
    setQuotationType(type);

    try {
      setLoading(true);
      // 使用服务方法计算报价
      const calculatedCategories = await MaterialListService.calculateQuotation(
        materialList.id,
        type
      );

      // 更新表格数据
      setTableData((prev) =>
        prev.map((row) => {
          const calculated = calculatedCategories.find((c) => c.id === row.id);
          if (calculated) {
            return {
              ...row,
              unit_price: calculated.unit_price,
              total_price: calculated.total_price,
            };
          }
          return row;
        })
      );

      // 保存到服务器
      await saveTableData(type);

      message.success("单价已自动填充并保存");
    } catch (error) {
      console.error("计算报价失败:", error);
      message.error("计算报价失败");
    } finally {
      setLoading(false);
    }
  };

  // 保存表格数据到服务器
  const saveTableData = async (type?: "dealer" | "owner") => {
    if (!materialList) return;

    // 按项目分组
    const projectMap = new Map<string, TableRowData[]>();
    tableData.forEach((row) => {
      if (!projectMap.has(row.project_name)) {
        projectMap.set(row.project_name, []);
      }
      projectMap.get(row.project_name)!.push(row);
    });

    // 构建项目数据
    const projectData = Array.from(projectMap.keys()).map((name, index) => ({
      name,
      sort_order: index,
    }));

    const categoryData = tableData.map((row) => {
      const projectIndex = Array.from(projectMap.keys()).indexOf(
        row.project_name
      );
      return {
        name: row.project_name,
        sort_order: projectIndex,
        level1_category_id: row.level1_category_id,
        level1_category_name: row.level1_category_name,
        level2_category_id: row.level2_category_id,
        level2_category_name: row.level2_category_name,
        height: row.height,
        width: row.width,
        quantity: row.quantity,
        unit: row.unit,
        material_id: row.material_id,
        material_name: row.material_name,
        color_id: row.color_id,
        color_name: row.color_name,
        remark: row.remark,
        unit_price: row.unit_price,
        total_price: row.total_price,
      };
    });

    await MaterialListService.updateMaterialList(materialList.id, {
      quotation_type: type || quotationType,
      projects: projectData,
      categories: categoryData,
    });
  };

  // 开始编辑
  const handleStartEdit = (key: React.Key) => {
    setEditingKey(key);
  };

  // 取消编辑
  const handleCancelEdit = async () => {
    if (!materialList) return;
    try {
      // 重新加载数据以恢复原始值
      await loadMaterialListData();
      setEditingKey(null);
    } catch (error) {
      console.error("取消编辑失败:", error);
      message.error("取消编辑失败");
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!materialList || !editingKey) return;
    try {
      setLoading(true);
      await saveTableData();
      setEditingKey(null);
      message.success("保存成功");
    } catch (error) {
      console.error("保存失败:", error);
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除行
  const handleDelete = async (key: React.Key) => {
    if (!materialList) return;
    try {
      setLoading(true);
      const newData = tableData.filter((row) => row.key !== key);
      setTableData(newData);
      await saveTableData();
      message.success("删除成功");
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败");
    } finally {
      setLoading(false);
    }
  };

  // 根据基材和报价类型自动填充单价（用于新增类目时）
  const autoFillUnitPrice = (materialId: number | undefined) => {
    if (!materialId || !materialList) return undefined;
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      const price =
        quotationType === "dealer"
          ? material.dealer_price
          : material.owner_price;
      return price;
    }
    return undefined;
  };

  // 添加新行
  const handleAdd = () => {
    const newRow: TableRowData = {
      id: Date.now(), // 临时ID
      key: Date.now(),
      project_id: 0,
      project_name: "",
      level1_category_id: 0,
      level1_category_name: "",
      level2_category_id: 0,
      level2_category_name: "",
      quantity: 0,
      unit: "",
      editing: true,
    };
    setTableData([...tableData, newRow]);
    setEditingKey(newRow.key);
  };

  // 更新行数据
  const updateRowData = (
    key: React.Key,
    field: string,
    value: string | number | undefined
  ) => {
    setTableData((prev) =>
      prev.map((row) => {
        if (row.key === key) {
          const updated = { ...row, [field]: value };
          // 自动计算合计
          if (field === "quantity" || field === "unit_price") {
            const quantity =
              field === "quantity"
                ? typeof value === "number"
                  ? value
                  : 0
                : updated.quantity || 0;
            const unitPrice =
              field === "unit_price"
                ? typeof value === "number"
                  ? value
                  : 0
                : updated.unit_price || 0;
            updated.total_price = quantity * unitPrice;
          }
          // 选择二级类目时自动带出计价单位和单价
          if (field === "level2_category_id") {
            const level1 = categoryTree.find(
              (t) => t.level1.id === updated.level1_category_id
            );
            const level2 = level1?.level2.find((l2) => l2.id === value);
            if (level2) {
              updated.level2_category_name = level2.name;
              updated.unit = level2.pricing_unit || "";

              // 自动填充单价（根据报价类型和基材）
              if (updated.material_id && materialList) {
                const unitPrice = autoFillUnitPrice(updated.material_id);
                if (unitPrice !== undefined) {
                  updated.unit_price = unitPrice;
                  // 计算合计
                  const quantity = updated.quantity || 0;
                  updated.total_price = quantity * unitPrice;
                }
              }
            }
          }
          // 选择基材时，如果已有二级类目，自动填充单价，并清空颜色
          if (field === "material_id") {
            const material = materials.find((m) => m.id === value);
            if (material) {
              updated.material_name = material.name;
              updated.color_id = undefined; // 清空颜色
              updated.color_name = undefined;
              // 如果已有二级类目，自动填充单价
              if (updated.level2_category_id && materialList) {
                const unitPrice = autoFillUnitPrice(value as number);
                if (unitPrice !== undefined) {
                  updated.unit_price = unitPrice;
                  // 计算合计
                  const quantity = updated.quantity || 0;
                  updated.total_price = quantity * unitPrice;
                }
              }
            }
          }
          // 选择一级类目时清空二级类目、基材和颜色
          if (field === "level1_category_id") {
            const level1 = categoryTree.find((t) => t.level1.id === value);
            if (level1) {
              updated.level1_category_name = level1.level1.name;
              updated.level2_category_id = 0;
              updated.level2_category_name = "";
              updated.unit = "";
              updated.material_id = undefined;
              updated.material_name = undefined;
              updated.color_id = undefined;
              updated.color_name = undefined;
            }
          }
          // 选择颜色时更新名称
          if (field === "color_id") {
            const color = colors.find((c) => c.id === value);
            if (color) {
              updated.color_name = color.name;
            }
          }
          return updated;
        }
        return row;
      })
    );
  };

  // 保存（不提交修订）
  const handleSave = async () => {
    if (!materialList) return;
    try {
      setLoading(true);
      await saveTableData();
      message.success("保存成功");
      onSuccess?.();
    } catch (error) {
      console.error("保存失败:", error);
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  // 修订
  const handleRevise = async () => {
    if (!materialList) return;
    try {
      setLoading(true);
      await saveTableData();
      await MaterialListService.reviseMaterialList(materialList.id);
      message.success("已提交修订");
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error("修订失败:", error);
      message.error("修订失败");
    } finally {
      setLoading(false);
    }
  };

  // 报价完成
  const handleComplete = async () => {
    if (!materialList) return;
    try {
      setLoading(true);
      await saveTableData();
      await MaterialListService.completeQuotation(materialList.id);
      message.success("报价完成");
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error("报价完成失败:", error);
      message.error("报价完成失败");
    } finally {
      setLoading(false);
    }
  };

  // 计算合计金额
  const calculateTotalAmount = () => {
    return tableData.reduce((sum, row) => {
      return sum + (row.total_price || 0);
    }, 0);
  };

  // 计算优惠后总金额
  const calculateFinalAmount = () => {
    const total = calculateTotalAmount();
    return total - discountAmount;
  };

  // 按类型计算面积（仅统计单位为平方的数量）
  const calculateAreaByType = (
    rows: TableRowData[],
    type: "cabinet" | "wall"
  ): number => {
    const keyword = type === "cabinet" ? "柜体" : "墙板";
    return rows.reduce((sum, row) => {
      const level1Name = row.level1_category_name || "";
      // 仅统计对应一级类目，且单位为平方
      if (
        level1Name.startsWith(keyword) &&
        row.unit === "平方" &&
        typeof row.quantity === "number"
      ) {
        return sum + (row.quantity || 0);
      }
      return sum;
    }, 0);
  };

  // 预览行数据类型
  type PreviewRow = TableRowData & {
    isSummary?: boolean;
    cabinetArea?: number;
    wallArea?: number;
    projectTotal?: number;
  };

  // 构建预览数据源：在每个项目的最后一行后插入小计行
  const buildPreviewData = (): PreviewRow[] => {
    const projectMap = new Map<string, TableRowData[]>();
    tableData.forEach((row) => {
      const name = row.project_name || "未命名项目";
      if (!projectMap.has(name)) {
        projectMap.set(name, []);
      }
      projectMap.get(name)!.push(row);
    });

    const result: PreviewRow[] = [];

    projectMap.forEach((rows, projectName) => {
      // 先推入当前项目的明细行
      rows.forEach((r) => result.push(r));

      // 计算当前项目的柜体/墙板面积和总价
      const cabinetArea = calculateAreaByType(rows, "cabinet");
      const wallArea = calculateAreaByType(rows, "wall");
      const projectTotal = rows.reduce(
        (sum, row) => sum + (row.total_price || 0),
        0
      );

      // 再追加一行小计
      if (rows.length > 0) {
        const first = rows[0];
        result.push({
          ...first,
          key: `summary-${projectName}`,
          project_name: projectName,
          level1_category_name: "",
          level2_category_name: "",
          height: undefined,
          width: undefined,
          quantity: 0,
          unit: "",
          unit_price: undefined,
          total_price: projectTotal,
          material_name: "",
          color_name: "",
          remark: "",
          isSummary: true,
          cabinetArea,
          wallArea,
          projectTotal,
        });
      }
    });

    return result;
  };

  // 预览数据源
  const previewData = buildPreviewData();
  const overallCabinetArea = calculateAreaByType(tableData, "cabinet");
  const overallWallArea = calculateAreaByType(tableData, "wall");

  // 移除优惠
  const handleRemoveDiscount = () => {
    setDiscountAmount(0);
  };

  // 表格列定义
  const columns: ColumnsType<TableRowData> = [
    {
      title: "项目名称",
      dataIndex: "project_name",
      key: "project_name",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) =>
                updateRowData(record.key, "project_name", e.target.value)
              }
              placeholder="项目名称"
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "一级类目",
      dataIndex: "level1_category_name",
      key: "level1_category_name",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Select
              value={record.level1_category_id || undefined}
              onChange={(value) =>
                updateRowData(record.key, "level1_category_id", value)
              }
              placeholder="一级类目"
              style={{ width: "100%" }}
            >
              {categoryTree.map((tree) => (
                <Option key={tree.level1.id} value={tree.level1.id}>
                  {tree.level1.name}
                </Option>
              ))}
            </Select>
          );
        }
        return text || "-";
      },
    },
    {
      title: "二级类目",
      dataIndex: "level2_category_name",
      key: "level2_category_name",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          const level1 = categoryTree.find(
            (t) => t.level1.id === record.level1_category_id
          );
          return (
            <Select
              value={record.level2_category_id || undefined}
              onChange={(value) =>
                updateRowData(record.key, "level2_category_id", value)
              }
              placeholder="二级类目"
              style={{ width: "100%" }}
            >
              {level1?.level2.map((l2) => (
                <Option key={l2.id} value={l2.id}>
                  {l2.name}
                </Option>
              )) || []}
            </Select>
          );
        }
        return text || "-";
      },
    },
    {
      title: "高(mm)",
      dataIndex: "height",
      key: "height",
      width: 100,
      render: (text: number | undefined, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <InputNumber
              value={text}
              onChange={(value) =>
                updateRowData(record.key, "height", value ?? undefined)
              }
              placeholder="高"
              style={{ width: "100%" }}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "宽(mm)",
      dataIndex: "width",
      key: "width",
      width: 100,
      render: (text: number | undefined, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <InputNumber
              value={text}
              onChange={(value) =>
                updateRowData(record.key, "width", value ?? undefined)
              }
              placeholder="宽"
              style={{ width: "100%" }}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: (text: number, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <InputNumber
              value={text}
              onChange={(value) =>
                updateRowData(record.key, "quantity", value ?? 0)
              }
              placeholder="数量"
              style={{ width: "100%" }}
              min={0}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "单位",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              disabled
              style={{ backgroundColor: "#f5f5f5" }}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "基材",
      dataIndex: "material_name",
      key: "material_name",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Select
              value={record.material_id || undefined}
              onChange={(value) =>
                updateRowData(record.key, "material_id", value)
              }
              placeholder="基材"
              style={{ width: "100%" }}
              allowClear
            >
              {(() => {
                // 根据一级类目过滤基材
                const level1 = categoryTree.find(
                  (t) => t.level1.id === record.level1_category_id
                );
                const allowedMaterialIds = level1?.level1.material_ids || [];

                // 如果一级类目有关联的基材，只显示关联的基材；否则显示所有基材
                const filteredMaterials =
                  allowedMaterialIds.length > 0
                    ? materials.filter((m) => allowedMaterialIds.includes(m.id))
                    : materials;

                return filteredMaterials.map((material) => (
                  <Option key={material.id} value={material.id}>
                    {material.name}
                  </Option>
                ));
              })()}
            </Select>
          );
        }
        return text || "-";
      },
    },
    {
      title: "颜色",
      dataIndex: "color_name",
      key: "color_name",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Select
              value={record.color_id || undefined}
              onChange={(value) => updateRowData(record.key, "color_id", value)}
              placeholder="颜色"
              style={{ width: "100%" }}
              allowClear
            >
              {(() => {
                // 根据基材过滤颜色
                const material = materials.find(
                  (m) => m.id === record.material_id
                );
                const allowedColorIds = material?.color_ids || [];

                // 如果基材有关联的颜色，只显示关联的颜色；否则显示所有颜色
                const filteredColors =
                  allowedColorIds.length > 0
                    ? colors.filter((c) => allowedColorIds.includes(c.id))
                    : colors;

                return filteredColors.map((color) => (
                  <Option key={color.id} value={color.id}>
                    {color.name}
                  </Option>
                ));
              })()}
            </Select>
          );
        }
        return text || "-";
      },
    },
    {
      title: "单价",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 120,
      render: (text: number | undefined, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <InputNumber
              value={text}
              onChange={(value) =>
                updateRowData(record.key, "unit_price", value ?? undefined)
              }
              placeholder="单价"
              style={{ width: "100%" }}
              precision={2}
              min={0}
              formatter={(value) =>
                `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => {
                const parsed = value!.replace(/¥\s?|(,*)/g, "");
                return parsed ? parseFloat(parsed) : 0;
              }}
            />
          );
        }
        return formatCurrency(text);
      },
    },
    {
      title: "合计",
      dataIndex: "total_price",
      key: "total_price",
      width: 120,
      render: (text: number | undefined) => {
        return formatCurrency(text);
      },
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      width: 120,
      render: (text: string, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) =>
                updateRowData(record.key, "remark", e.target.value)
              }
              placeholder="备注"
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_: unknown, record: TableRowData) => {
        if (editingKey === record.key) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleSaveEdit}
                loading={loading}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
              >
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleStartEdit(record.key)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.key)}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Modal
      title={`物料清单报价`}
      open={visible}
      onCancel={onCancel}
      width={1800}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* 基本信息展示区域 */}
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  订单编号：
                </span>
                <span>{order?.order_number || "-"}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  客户名称：
                </span>
                <span>{order?.customer_name || "-"}</span>
              </div>
            </Col>

            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  客户地址：
                </span>
                <span>{order?.address || "-"}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>销售员：</span>
                <span>{order?.salesperson || "-"}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>设计师：</span>
                <span>{order?.designer || "-"}</span>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  客户电话：
                </span>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="请输入客户电话"
                  style={{ width: 200 }}
                />
              </div>
            </Col>
            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  报价日期：
                </span>
                <DatePicker
                  value={quotationDate ? dayjs(quotationDate) : null}
                  onChange={(date) =>
                    setQuotationDate(date ? date.format("YYYY-MM-DD") : "")
                  }
                  placeholder="请选择报价日期"
                  style={{ width: 200 }}
                  format="YYYY-MM-DD"
                />
              </div>
            </Col>

            <Col span={6}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#666", marginRight: 8 }}>
                  报价类型：
                </span>
                <Select
                  value={quotationType}
                  onChange={handleQuotationTypeChange}
                  style={{ width: 200 }}
                >
                  <Option value="dealer">经销商</Option>
                  <Option value="owner">业主</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>

        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加类目
          </Button>
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setIsPreviewVisible(true)}
            >
              预览
            </Button>
            <Button
              onClick={() => {
                // 收集所有基材和单价
                const materialPriceMap = new Map<
                  number,
                  { name: string; price: number }
                >();
                tableData.forEach((row) => {
                  if (row.material_id && row.unit_price !== undefined) {
                    const material = materials.find(
                      (m) => m.id === row.material_id
                    );
                    if (material && !materialPriceMap.has(row.material_id)) {
                      materialPriceMap.set(row.material_id, {
                        name: material.name,
                        price: row.unit_price,
                      });
                    }
                  }
                });

                // 初始化折扣价格（默认为原价）
                const initialDiscountPrices = new Map<number, number>();
                materialPriceMap.forEach((value, key) => {
                  initialDiscountPrices.set(key, value.price);
                });
                setDiscountPrices(initialDiscountPrices);
                setIsDiscountPriceVisible(true);
              }}
            >
              折扣价
            </Button>
            {(submittedSnapshot || revisionSnapshot) && (
              <Button
                icon={<DiffOutlined />}
                onClick={() => setIsCompareVisible(true)}
              >
                对比
              </Button>
            )}
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                message.info("导出功能开发中");
              }}
            >
              导出
            </Button>
          </Space>
        </div>

        <Divider />

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: "max-content" }}
          rowKey="key"
        />

        <Divider />

        {/* 优惠金额和总金额展示区域 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={24} align="middle" justify="space-between">
            <Col>
              <div>
                <span style={{ marginRight: 8 }}>优惠金额：</span>
                <InputNumber
                  value={discountAmount}
                  onChange={(value) => setDiscountAmount(value || 0)}
                  precision={2}
                  min={0}
                  max={calculateTotalAmount()}
                  style={{ width: 200 }}
                  formatter={(value) =>
                    `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => {
                    const parsed = value!.replace(/¥\s?|(,*)/g, "");
                    return parsed ? parseFloat(parsed) : 0;
                  }}
                />
                {discountAmount > 0 && (
                  <Button
                    danger
                    type="link"
                    onClick={handleRemoveDiscount}
                    style={{ marginLeft: 8 }}
                  >
                    移除优惠
                  </Button>
                )}
              </div>
            </Col>
            <Col>
              <Row gutter={24} style={{ textAlign: "right" }}>
                {discountAmount > 0 ? (
                  <>
                    <Col>
                      <div>
                        <div style={{ color: "#666", marginBottom: 4 }}>
                          合计金额
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>
                          {formatCurrency(calculateTotalAmount())}
                        </div>
                      </div>
                    </Col>
                    <Col>
                      <div>
                        <div style={{ color: "#666", marginBottom: 4 }}>
                          优惠金额
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>
                          {formatCurrency(discountAmount)}
                        </div>
                      </div>
                    </Col>
                    <Col>
                      <div>
                        <div style={{ color: "#666", marginBottom: 4 }}>
                          优惠后总金额
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#ff4d4f",
                          }}
                        >
                          {formatCurrency(calculateFinalAmount())}
                        </div>
                      </div>
                    </Col>
                  </>
                ) : (
                  <Col>
                    <div>
                      <div style={{ color: "#666", marginBottom: 4 }}>
                        合计金额
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#ff4d4f",
                        }}
                      >
                        {formatCurrency(calculateTotalAmount())}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </Card>

        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              保存
            </Button>
            <Button danger onClick={handleRevise} loading={loading}>
              修订
            </Button>
            <Button type="primary" onClick={handleComplete} loading={loading}>
              报价完成
            </Button>
          </Space>
        </div>
      </Spin>

      {/* 预览模态框 */}
      <Modal
        title="报价单预览"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={null}
        width={1400}
        destroyOnClose
      >
        <div style={{ padding: "20px 0" }}>
          {/* 报价单信息 */}
          <div style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>订单编号：</span>
                  <span>{order?.order_number || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>客户名称：</span>
                  <span>{order?.customer_name || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>客户电话：</span>
                  <span>{customerPhone || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>客户地址：</span>
                  <span>{order?.address || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>销售员：</span>
                  <span>{order?.salesperson || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>报价日期：</span>
                  <span>{quotationDate || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>设计师：</span>
                  <span>{order?.designer || "-"}</span>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#666" }}>报价类型：</span>
                  <span>{quotationType === "dealer" ? "经销商" : "业主"}</span>
                </div>
              </Col>
            </Row>
          </div>

          {/* 报价项目 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>报价项目</h3>
            <Table
              columns={[
                {
                  title: "项目",
                  dataIndex: "project_name",
                  key: "project_name",
                  width: 100,
                  render: (text: string, record: PreviewRow) => {
                    if (record.isSummary) {
                      const cabinetArea =
                        typeof record.cabinetArea === "number"
                          ? record.cabinetArea
                          : 0;
                      const wallArea =
                        typeof record.wallArea === "number"
                          ? record.wallArea
                          : 0;
                      const projectTotal =
                        record.projectTotal !== undefined
                          ? record.projectTotal
                          : 0;
                      return {
                        children: (
                          <div style={{ textAlign: "right", paddingRight: 16 }}>
                            <span style={{ fontWeight: 600 }}>
                              {record.project_name} 小计：
                            </span>
                            <span style={{ marginLeft: 8, fontSize: "12px", color: "#666" }}>
                              柜体：{cabinetArea.toFixed(2)} ㎡，墙板：{wallArea.toFixed(2)} ㎡，
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#ff4d4f",
                                marginLeft: 8,
                              }}
                            >
                              合计：{formatCurrency(projectTotal)}
                            </span>
                          </div>
                        ),
                        props: {
                          colSpan: 12, // 合并前8列（项目、柜名/规格、高、宽、数量、单位、单价、合计之前的列）
                        },
                      };
                    }
                    return {
                      children: text || "-",
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "柜名/规格",
                  key: "category",
                  width: 150,
                  render: (_: unknown, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0, // 隐藏此列（已被项目列合并）
                        },
                      };
                    }
                    return {
                      children: `${record.level1_category_name}-${record.level2_category_name}`,
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "高(mm)",
                  dataIndex: "height",
                  key: "height",
                  width: 100,
                  render: (text: number | undefined, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: text || "-",
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "宽(mm)",
                  dataIndex: "width",
                  key: "width",
                  width: 100,
                  render: (text: number | undefined, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: text || "-",
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "数量",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 100,
                  render: (text: number, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: text,
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "单位",
                  dataIndex: "unit",
                  key: "unit",
                  width: 80,
                  render: (text: string, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: text,
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "单价",
                  dataIndex: "unit_price",
                  key: "unit_price",
                  width: 100,
                  render: (text: number | undefined, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: formatCurrency(text),
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },

                {
                  title: "柜体颜色材质",
                  key: "cabinet_material",
                  width: 150,
                  render: (_: unknown, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    const content = record.material_name && record.color_name
                      ? `${record.material_name}-${record.color_name}`
                      : record.material_name || "-";
                    return {
                      children: content,
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "门板颜色材质",
                  key: "door_material",
                  width: 150,
                  render: (_: unknown, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    const content = record.material_name && record.color_name
                      ? `${record.material_name}-${record.color_name}`
                      : "-";
                    return {
                      children: content,
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "背板材质",
                  key: "back_material",
                  width: 120,
                  render: (_: unknown, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: record.material_name || "-",
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "备注",
                  dataIndex: "remark",
                  key: "remark",
                  width: 120,
                  render: (text: string, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0,
                        },
                      };
                    }
                    return {
                      children: text || "-",
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
                {
                  title: "合计",
                  dataIndex: "total_price",
                  key: "total_price",
                  width: 120,
                  render: (text: number | undefined, record: PreviewRow) => {
                    if (record.isSummary) {
                      return {
                        children: "",
                        props: {
                          colSpan: 0, // 隐藏此列（已被项目列合并）
                        },
                      };
                    }
                    return {
                      children: formatCurrency(text),
                      props: {
                        colSpan: 1,
                      },
                    };
                  },
                },
              ]}
              dataSource={previewData}
              pagination={false}
              rowKey="key"
              size="small"
              components={{
                body: {
                  row: (props: {
                    children?: React.ReactNode[];
                    style?: React.CSSProperties;
                    [key: string]: unknown;
                  }) => {
                    const record = (
                      props.children?.[0] as { props?: { record?: PreviewRow } }
                    )?.props?.record;
                    if (record?.isSummary) {
                      return (
                        <tr
                          {...props}
                          style={{
                            backgroundColor: "#f5f5f5",
                            ...props.style,
                          }}
                        />
                      );
                    }
                    return <tr {...props} />;
                  },
                },
              }}
            />
          </div>

          {/* 合计金额 */}
          <div style={{ textAlign: "right", marginTop: 24 }}>
            {/* 全局柜体 / 墙板面积统计 */}
            <div style={{ marginTop: 8,marginBottom: 8 }}>
              <span style={{ color: "#666", marginRight: 16 }}>
                总柜体面积：
              </span>
              <span style={{ fontWeight: 600 }}>
                {overallCabinetArea.toFixed(2)} ㎡
              </span>
              <span style={{ marginLeft: 32, color: "#666", marginRight: 16 }}>
                总墙板面积：
              </span>
              <span style={{ fontWeight: 600 }}>
                {overallWallArea.toFixed(2)} ㎡
              </span>
            </div>
            <Row gutter={24} justify="end">
              {discountAmount > 0 ? (
                <>
                  <Col>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: "#666", marginRight: 16 }}>
                        合计金额：
                      </span>
                      <span style={{ fontSize: 16 }}>
                        {formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>
                  </Col>
                  <Col>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: "#666", marginRight: 16 }}>
                        优惠金额：
                      </span>
                      <span style={{ fontSize: 16 }}>
                        {formatCurrency(discountAmount)}
                      </span>
                    </div>
                  </Col>
                  <Col>
                    <div>
                      <span style={{ color: "#666", marginRight: 16 }}>
                        优惠后总金额：
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#ff4d4f",
                        }}
                      >
                        {formatCurrency(calculateFinalAmount())}
                      </span>
                    </div>
                  </Col>
                </>
              ) : (
                <Col>
                  <div>
                    <span style={{ color: "#666", marginRight: 16 }}>
                      合计金额：
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#ff4d4f",
                      }}
                    >
                      {formatCurrency(calculateTotalAmount())}
                    </span>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        </div>
      </Modal>

      {/* 对比模态框 - 录入员对比快照和当前数据 */}
      <Modal
        title="版本对比（当前 / 提报时 / 修订前 ）"
        open={isCompareVisible}
        onCancel={() => setIsCompareVisible(false)}
        footer={null}
        width={1800}
        destroyOnClose
      >
        <ClerkCompareView
          currentData={tableData}
          submittedData={submittedSnapshot || undefined}
          revisionData={revisionSnapshot || undefined}
          formatCurrency={formatCurrency}
        />
      </Modal>

      {/* 折扣价格暗九编辑模态框 */}
      <Modal
        title="折扣价格暗九"
        open={isDiscountPriceVisible}
        onCancel={() => setIsDiscountPriceVisible(false)}
        onOk={async () => {
          try {
            setLoading(true);
            // 应用折扣价格到报价单
            const updatedTableData = tableData.map((row) => {
              if (row.material_id && discountPrices.has(row.material_id)) {
                const newPrice = discountPrices.get(row.material_id)!;
                return {
                  ...row,
                  unit_price: newPrice,
                  total_price: (row.quantity || 0) * newPrice,
                };
              }
              return row;
            });
            setTableData(updatedTableData);
            await saveTableData();
            setIsDiscountPriceVisible(false);
            message.success("折扣价格已应用");
          } catch (error) {
            console.error("应用折扣价格失败:", error);
            message.error("应用折扣价格失败");
          } finally {
            setLoading(false);
          }
        }}
        width={800}
        okText="应用"
        cancelText="取消"
      >
        <Table
          columns={[
            {
              title: "基材名称",
              dataIndex: "name",
              key: "name",
              width: 200,
            },
            {
              title: "原单价",
              dataIndex: "price",
              key: "price",
              width: 150,
              render: (price: number) => formatCurrency(price),
            },
            {
              title: "折扣价",
              dataIndex: "materialId",
              key: "discountPrice",
              width: 200,
              render: (
                _: unknown,
                record: { materialId: number; price: number }
              ) => (
                <InputNumber
                  value={discountPrices.get(record.materialId) || record.price}
                  onChange={(value) => {
                    const newDiscountPrices = new Map(discountPrices);
                    newDiscountPrices.set(
                      record.materialId,
                      value || record.price
                    );
                    setDiscountPrices(newDiscountPrices);
                  }}
                  precision={2}
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => {
                    const parsed = value!.replace(/¥\s?|(,*)/g, "");
                    return parsed ? parseFloat(parsed) : 0;
                  }}
                />
              ),
            },
            {
              title: "折扣率",
              key: "discountRate",
              width: 120,
              render: (
                _: unknown,
                record: { materialId: number; price: number }
              ) => {
                const discountPrice =
                  discountPrices.get(record.materialId) || record.price;
                const rate =
                  record.price > 0
                    ? (
                        ((record.price - discountPrice) / record.price) *
                        100
                      ).toFixed(2)
                    : "0.00";
                return `${rate}%`;
              },
            },
          ]}
          dataSource={Array.from(
            (() => {
              const materialPriceMap = new Map<
                number,
                { name: string; price: number }
              >();
              tableData.forEach((row) => {
                if (row.material_id && row.unit_price !== undefined) {
                  const material = materials.find(
                    (m) => m.id === row.material_id
                  );
                  if (material && !materialPriceMap.has(row.material_id)) {
                    materialPriceMap.set(row.material_id, {
                      name: material.name,
                      price: row.unit_price,
                    });
                  }
                }
              });
              return materialPriceMap;
            })()
          ).map(([materialId, { name, price }]) => ({
            key: materialId,
            materialId,
            name,
            price,
          }))}
          pagination={false}
          rowKey="materialId"
        />
      </Modal>
    </Modal>
  );
};

export default MaterialListClerkModal;
