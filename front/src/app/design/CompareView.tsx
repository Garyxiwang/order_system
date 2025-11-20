"use client";

import React from "react";
import { Table, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { QuotationCategory, QuotationProject } from "../../services/materialListService";

// 表格行数据类型（用于录入员对比）
export interface TableRowData extends QuotationCategory {
  key: React.Key;
  project_name: string;
  editing?: boolean;
}

// 表单数据类型（用于设计师对比）
export interface ProjectFormData {
  name: string;
  categories: CategoryFormData[];
}

export interface CategoryFormData {
  level1_category_id: number;
  level1_category_name: string;
  level2_category_id: number;
  level2_category_name: string;
  height?: number | string;
  width?: number | string;
  quantity: number | string;
  unit: string;
  material_id?: number;
  material_name?: string;
  color_id?: number;
  color_name?: string;
  remark?: string;
}

// 录入员对比视图组件 - 支持三版本对比
interface ClerkCompareViewProps {
  currentData: TableRowData[];
  submittedData?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
  };
  revisionData?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
  };
  formatCurrency: (amount: number | undefined | null) => string;
}

export const ClerkCompareView: React.FC<ClerkCompareViewProps> = ({
  currentData,
  submittedData,
  revisionData,
  formatCurrency,
}) => {
  // 将提报时数据转换为表格格式
  const submittedTableData: TableRowData[] = [];
  submittedData?.projects.forEach((project) => {
    submittedData.categories
      .filter((c) => c.project_id === project.id)
      .forEach((category) => {
        submittedTableData.push({
          ...category,
          key: `submitted-${category.id}`,
          project_name: project.name,
        });
      });
  });

  // 将修订前数据转换为表格格式
  const revisionTableData: TableRowData[] = [];
  revisionData?.projects.forEach((project) => {
    revisionData.categories
      .filter((c) => c.project_id === project.id)
      .forEach((category) => {
        revisionTableData.push({
          ...category,
          key: `revision-${category.id}`,
          project_name: project.name,
        });
      });
  });

  // 合并数据，用于对比显示
  // 使用项目名称 + level1_category_id + level2_category_id 作为唯一键
  // 因为快照中的 project_id 可能和当前数据不一致
  const getMatchKey = (item: TableRowData) => {
    return `${item.project_name}-${item.level1_category_id}-${item.level2_category_id}`;
  };

  // 确保所有数据都有 project_name
  const allCurrentData = currentData.map(d => ({ ...d }));
  const allSubmittedData = submittedTableData.map(d => ({ ...d }));
  const allRevisionData = revisionTableData.map(d => ({ ...d }));

  const allKeys = new Set([
    ...allCurrentData.map((d) => getMatchKey(d)),
    ...allSubmittedData.map((d) => getMatchKey(d)),
    ...allRevisionData.map((d) => getMatchKey(d)),
  ]);

  const compareData = Array.from(allKeys).map((key, index) => {
    const current = allCurrentData.find((d) => getMatchKey(d) === key);
    const submitted = allSubmittedData.find((d) => getMatchKey(d) === key);
    const revision = allRevisionData.find((d) => getMatchKey(d) === key);
    // 使用唯一索引作为 rowKey，避免 id 冲突
    const id = current?.id || submitted?.id || revision?.id || index;
    return { current, submitted, revision, id };
  });

  // 判断字段值是否相等
  const isEqual = (val1: any, val2: any): boolean => {
    return String(val1 || "") === String(val2 || "");
  };

  // 判断字段变化来源（对于录入员：和设计师一样的逻辑）
  const getChangeSource = (
    submitted: TableRowData | undefined,
    revision: TableRowData | undefined,
    current: TableRowData | undefined,
    field: keyof TableRowData
  ): "none" | "revision" | "current" | "both" => {
    const submittedVal = submitted?.[field];
    const revisionVal = revision?.[field];
    const currentVal = current?.[field];

    // 判断是否在修订时新增（提报时不存在，修订前存在）
    const isRevisionAdded = !submitted && revision && revisionVal !== undefined && revisionVal !== null && revisionVal !== "";
    // 判断是否在修订时修改（提报时存在，修订前存在，但值不同）
    const isRevisionChanged = submitted && revision && !isEqual(submittedVal, revisionVal);
    // 判断是否在当前新增（修订前不存在，当前存在）
    const isCurrentAdded = !revision && current && currentVal !== undefined && currentVal !== null && currentVal !== "";
    // 判断是否在当前修改（修订前存在，当前存在，但值不同）
    const isCurrentChanged = revision && current && !isEqual(revisionVal, currentVal);

    // 修订时新增或修改都算作 revision（设计师的修改）
    const isRevisionModified = isRevisionAdded || isRevisionChanged;
    // 当前新增或修改都算作 current（录入员的修改）
    const isCurrentModified = isCurrentAdded || isCurrentChanged;

    if (isRevisionModified && isCurrentModified) {
      return "both";
    } else if (isRevisionModified) {
      return "revision";
    } else if (isCurrentModified) {
      return "current";
    }
    return "none";
  };

  // 渲染字段对比（区分修改来源）- 和设计师一样的展示方式
  // 显示顺序：当前版本（最新） -> 提报时版本（最新） -> 修订前版本（旧值）
  const renderFieldCompare = (
    submitted: TableRowData | undefined,
    revision: TableRowData | undefined,
    current: TableRowData | undefined,
    field: keyof TableRowData,
    currentValue: any
  ) => {
    const changeSource = getChangeSource(submitted, revision, current, field);

    return (
      <div>
        {/* 第一行：当前版本（最新） */}
        {current && (
          <div
            style={{
              backgroundColor: changeSource === "current" || changeSource === "both" ? "#fff1f0" : "transparent",
              padding: "4px",
              position: "relative",
            }}
          >
            {field === "unit_price" || field === "total_price" ? formatCurrency(currentValue) : (currentValue || "-")}
            {changeSource === "current" && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#ff4d4f",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                (当前修改)
              </span>
            )}
            {changeSource === "both" && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#ff4d4f",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                (当前修改)
              </span>
            )}
          </div>
        )}
        {/* 第二行：提报时版本（最新） */}
        {submitted && (
          <div
            style={{
              backgroundColor: "transparent",
              padding: "4px",
              marginTop: current ? "4px" : 0,
              color: "#666",
              fontSize: "12px",
            }}
          >
            提报时: {field === "unit_price" || field === "total_price" ? formatCurrency(submitted[field]) : (submitted[field] || "-")}
          </div>
        )}
        {/* 第三行：修订前版本（旧值）- 如果和提报时不同，标绿 */}
        {revision && (
          <div
            style={{
              backgroundColor: changeSource === "revision" || changeSource === "both" ? "#f6ffed" : "transparent",
              padding: "4px",
              marginTop: (current || submitted) ? "4px" : 0,
              color: "#999",
              fontSize: "11px",
            }}
          >
            修订前: {field === "unit_price" || field === "total_price" ? formatCurrency(revision[field]) : (revision[field] || "-")}
            {(changeSource === "revision" || changeSource === "both") && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#52c41a",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                (修订版)
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  interface CompareRecord {
    current?: TableRowData;
    submitted?: TableRowData;
    revision?: TableRowData;
    id: number;
  }

  const columns: ColumnsType<CompareRecord> = [
    {
      title: "项目名称",
      key: "project_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "project_name",
          record.current?.project_name
        );
      },
    },
    {
      title: "一级类目",
      key: "level1_category_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "level1_category_name",
          record.current?.level1_category_name
        );
      },
    },
    {
      title: "二级类目",
      key: "level2_category_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "level2_category_name",
          record.current?.level2_category_name
        );
      },
    },
    {
      title: "高(mm)",
      key: "height",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "height",
          record.current?.height
        );
      },
    },
    {
      title: "宽(mm)",
      key: "width",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "width",
          record.current?.width
        );
      },
    },
    {
      title: "数量",
      key: "quantity",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "quantity",
          record.current?.quantity
        );
      },
    },
    {
      title: "单位",
      key: "unit",
      width: 80,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "unit",
          record.current?.unit
        );
      },
    },
    {
      title: "基材",
      key: "material_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "material_name",
          record.current?.material_name
        );
      },
    },
    {
      title: "颜色",
      key: "color_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "color_name",
          record.current?.color_name
        );
      },
    },
    {
      title: "备注",
      key: "remark",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "remark",
          record.current?.remark
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#f5f5f5" }}>
        <Row gutter={24}>
          <Col span={8}>
            <div>
              <strong>当前版本</strong>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                红色背景 = 当前修改
              </div>
            </div>
          </Col>
          {submittedData && (
            <Col span={8}>
              <div>
                <strong>提报时版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  设计师提报的版本（最新）
                </div>
              </div>
            </Col>
          )}
          {revisionData && (
            <Col span={8}>
              <div>
                <strong>修订前版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  绿色背景 = 修订版（旧值）
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>
      <Table
        columns={columns}
        dataSource={compareData}
        pagination={false}
        scroll={{ x: "max-content" }}
        rowKey="id"
      />
    </div>
  );
};

// 设计师对比视图组件 - 支持三版本对比
interface DesignerCompareViewProps {
  formData: { projects: ProjectFormData[] };
  submittedData?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
  };
  revisionData?: {
    projects: QuotationProject[];
    categories: QuotationCategory[];
  };
}

export const DesignerCompareView: React.FC<DesignerCompareViewProps> = ({
  formData,
  submittedData,
  revisionData,
}) => {
  // 将表单数据转换为表格格式（当前版本）
  const currentTableData: Array<{
    id: number;
    project_name: string;
    level1_category_name: string;
    level2_category_name: string;
    height?: number | string;
    width?: number | string;
    quantity: number | string;
    unit: string;
    material_name?: string;
    color_name?: string;
    remark?: string;
  }> = [];

  formData.projects?.forEach((project, projectIndex) => {
    project.categories?.forEach((category, categoryIndex) => {
      currentTableData.push({
        id: projectIndex * 1000 + categoryIndex,
        project_name: project.name,
        level1_category_name: category.level1_category_name,
        level2_category_name: category.level2_category_name,
        height: category.height,
        width: category.width,
        quantity: category.quantity,
        unit: category.unit,
        material_name: category.material_name,
        color_name: category.color_name,
        remark: category.remark,
      });
    });
  });

  // 将提报时数据转换为表格格式
  const submittedTableData: Array<{
    id: number;
    project_name: string;
    level1_category_name: string;
    level2_category_name: string;
    height?: number;
    width?: number;
    quantity: number;
    unit: string;
    material_name?: string;
    color_name?: string;
    remark?: string;
  }> = [];

  submittedData?.projects.forEach((project, projectIndex) => {
    submittedData.categories
      .filter((c) => c.project_id === project.id)
      .forEach((category, categoryIndex) => {
        submittedTableData.push({
          id: projectIndex * 1000 + categoryIndex,
          project_name: project.name,
          level1_category_name: category.level1_category_name,
          level2_category_name: category.level2_category_name,
          height: category.height,
          width: category.width,
          quantity: category.quantity,
          unit: category.unit,
          material_name: category.material_name,
          color_name: category.color_name,
          remark: category.remark,
        });
      });
  });

  // 将修订后数据转换为表格格式
  const revisionTableData: Array<{
    id: number;
    project_name: string;
    level1_category_name: string;
    level2_category_name: string;
    height?: number;
    width?: number;
    quantity: number;
    unit: string;
    material_name?: string;
    color_name?: string;
    remark?: string;
  }> = [];

  revisionData?.projects.forEach((project, projectIndex) => {
    revisionData.categories
      .filter((c) => c.project_id === project.id)
      .forEach((category, categoryIndex) => {
        revisionTableData.push({
          id: projectIndex * 1000 + categoryIndex,
          project_name: project.name,
          level1_category_name: category.level1_category_name,
          level2_category_name: category.level2_category_name,
          height: category.height,
          width: category.width,
          quantity: category.quantity,
          unit: category.unit,
          material_name: category.material_name,
          color_name: category.color_name,
          remark: category.remark,
        });
      });
  });

  // 合并数据用于对比
  const allKeys = new Set([
    ...currentTableData.map((d) => d.id),
    ...submittedTableData.map((d) => d.id),
    ...revisionTableData.map((d) => d.id),
  ]);

  const compareData = Array.from(allKeys).map((id) => {
    const current = currentTableData.find((d) => d.id === id);
    const submitted = submittedTableData.find((d) => d.id === id);
    const revision = revisionTableData.find((d) => d.id === id);
    return { current, submitted, revision, id };
  });

  // 判断字段值是否相等
  const isEqual = (val1: any, val2: any): boolean => {
    return String(val1 || "") === String(val2 || "");
  };

  // 判断字段变化来源
  const getChangeSource = (
    submitted: any,
    revision: any,
    current: any,
    field: string
  ): "none" | "revision" | "current" | "both" => {
    const submittedVal = submitted?.[field];
    const revisionVal = revision?.[field];
    const currentVal = current?.[field];

    // 判断是否在修订时新增（提报时不存在，修订后存在）
    const isRevisionAdded = !submitted && revision && revisionVal !== undefined && revisionVal !== null && revisionVal !== "";
    // 判断是否在修订时修改（提报时存在，修订后存在，但值不同）
    const isRevisionChanged = submitted && revision && !isEqual(submittedVal, revisionVal);
    // 判断是否在当前新增（修订后不存在，当前存在）
    const isCurrentAdded = !revision && current && currentVal !== undefined && currentVal !== null && currentVal !== "";
    // 判断是否在当前修改（修订后存在，当前存在，但值不同）
    const isCurrentChanged = revision && current && !isEqual(revisionVal, currentVal);

    // 修订时新增或修改都算作 revision
    const isRevisionModified = isRevisionAdded || isRevisionChanged;
    // 当前新增或修改都算作 current
    const isCurrentModified = isCurrentAdded || isCurrentChanged;

    if (isRevisionModified && isCurrentModified) {
      return "both";
    } else if (isRevisionModified) {
      return "revision";
    } else if (isCurrentModified) {
      return "current";
    }
    return "none";
  };

  // 渲染字段对比（区分修改来源）
  // 显示顺序：当前版本（最新） -> 提报时版本（最新） -> 修订后版本（旧值）
  const renderFieldCompare = (
    submitted: any,
    revision: any,
    current: any,
    field: string,
    currentValue: any
  ) => {
    const changeSource = getChangeSource(submitted, revision, current, field);

    return (
      <div>
        {/* 第一行：当前版本（最新） */}
        {current && (
          <div
            style={{
              backgroundColor: changeSource === "current" || changeSource === "both" ? "#fff1f0" : "transparent",
              padding: "4px",
              position: "relative",
            }}
          >
            {currentValue || "-"}
            {changeSource === "current" && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#ff4d4f",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                (当前修改)
              </span>
            )}
            {changeSource === "both" && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#ff4d4f",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                (当前修改)
              </span>
            )}
          </div>
        )}
        {/* 第二行：提报时版本（最新） */}
        {submitted && (
          <div
            style={{
              backgroundColor: "transparent",
              padding: "4px",
              marginTop: current ? "4px" : 0,
              color: "#666",
              fontSize: "12px",
            }}
          >
            提报时: {submitted[field] || "-"}
          </div>
        )}
        {/* 第三行：修订后版本（旧值） */}
        {revision && (
          <div
            style={{
              backgroundColor: changeSource === "revision" || changeSource === "both" ? "#f6ffed" : "transparent",
              padding: "4px",
              marginTop: (current || submitted) ? "4px" : 0,
              color: "#999",
              fontSize: "11px",
            }}
          >
            修订版: {revision[field] || "-"}
            {(changeSource === "revision" || changeSource === "both") && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#52c41a",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                (修订版)
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  interface CompareRecord {
    current?: any;
    submitted?: any;
    revision?: any;
    id: number;
  }

  const columns: ColumnsType<CompareRecord> = [
    {
      title: "项目名称",
      key: "project_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "project_name",
          record.current?.project_name
        );
      },
    },
    {
      title: "一级类目",
      key: "level1_category_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "level1_category_name",
          record.current?.level1_category_name
        );
      },
    },
    {
      title: "二级类目",
      key: "level2_category_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "level2_category_name",
          record.current?.level2_category_name
        );
      },
    },
    {
      title: "高(mm)",
      key: "height",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "height",
          record.current?.height
        );
      },
    },
    {
      title: "宽(mm)",
      key: "width",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "width",
          record.current?.width
        );
      },
    },
    {
      title: "数量",
      key: "quantity",
      width: 100,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "quantity",
          record.current?.quantity
        );
      },
    },
    {
      title: "单位",
      key: "unit",
      width: 80,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "unit",
          record.current?.unit
        );
      },
    },
    {
      title: "基材",
      key: "material_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "material_name",
          record.current?.material_name
        );
      },
    },
    {
      title: "颜色",
      key: "color_name",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "color_name",
          record.current?.color_name
        );
      },
    },
    {
      title: "备注",
      key: "remark",
      width: 120,
      render: (_: unknown, record: CompareRecord) => {
        return renderFieldCompare(
          record.submitted,
          record.revision,
          record.current,
          "remark",
          record.current?.remark
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "12px", backgroundColor: "#f5f5f5" }}>
        <Row gutter={24}>
          <Col span={8}>
            <div>
              <strong>当前版本</strong>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                红色背景 = 当前修改
              </div>
            </div>
          </Col>
          {submittedData && (
            <Col span={8}>
              <div>
                <strong>提报时版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  设计师提报的版本（最新）
                </div>
              </div>
            </Col>
          )}
          {revisionData && (
            <Col span={8}>
              <div>
                <strong>修订后版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  绿色背景 = 修订版（旧值）
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>
      <Table
        columns={columns}
        dataSource={compareData}
        pagination={false}
        scroll={{ x: "max-content" }}
        rowKey="id"
      />
    </div>
  );
};
