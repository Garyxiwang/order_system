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
    // 确保所有值都转换为字符串，处理 undefined 和 null
    const projectName = String(item.project_name || "");
    const level1Id = String(item.level1_category_id ?? "");
    const level2Id = String(item.level2_category_id ?? "");
    return `${projectName}-${level1Id}-${level2Id}`;
  };

  // 确保所有数据都有 project_name
  const allCurrentData = currentData.map(d => ({ ...d }));
  const allSubmittedData = submittedTableData.map(d => ({ ...d }));
  const allRevisionData = revisionTableData.map(d => ({ ...d }));

  // 收集所有唯一键
  // 确保所有数据都被包含，即使某些字段缺失
  const allKeys = new Set<string>();
  
  // 首先收集所有 currentData 的键（确保所有当前数据都被包含）
  allCurrentData.forEach((d, index) => {
    const key = getMatchKey(d);
    // 如果匹配键有效，使用匹配键
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    } else {
      // 如果匹配键无效，使用索引作为唯一标识（确保数据不被丢失）
      allKeys.add(`current-index-${index}`);
    }
  });
  
  // 然后添加 submitted 和 revision 的键（用于匹配）
  allSubmittedData.forEach((d) => {
    const key = getMatchKey(d);
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    }
  });
  allRevisionData.forEach((d) => {
    const key = getMatchKey(d);
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    }
  });

  const compareData = Array.from(allKeys).map((key, index) => {
    let current: TableRowData | undefined;
    let submitted: TableRowData | undefined;
    let revision: TableRowData | undefined;
    
    // 如果键是备用键（current-index-xxx），直接用索引查找
    if (key.startsWith("current-index-")) {
      const idx = parseInt(key.replace("current-index-", ""));
      current = allCurrentData[idx];
      // 尝试用匹配键查找对应的 submitted 和 revision
      if (current) {
        const matchKey = getMatchKey(current);
        if (matchKey && matchKey.trim() !== "" && matchKey !== "--") {
          submitted = allSubmittedData.find((d) => getMatchKey(d) === matchKey);
          revision = allRevisionData.find((d) => getMatchKey(d) === matchKey);
        }
      }
    } else {
      // 使用匹配键查找
      current = allCurrentData.find((d) => getMatchKey(d) === key);
      submitted = allSubmittedData.find((d) => getMatchKey(d) === key);
      revision = allRevisionData.find((d) => getMatchKey(d) === key);
    }
    
    // 使用唯一索引作为 rowKey，避免 id 冲突
    const id = current?.id || submitted?.id || revision?.id || index;
    // 判断是否被删除：在旧版本中存在，但在当前版本中不存在
    const isDeleted = (submitted || revision) && !current;
    return { current, submitted, revision, id, isDeleted };
  });

  // 判断字段值是否相等
  const isEqual = (val1: any, val2: any): boolean => {
    return String(val1 || "") === String(val2 || "");
  };

  // 判断字段变化来源（对于录入员：关注提报版和当前版的差异）
  const getChangeSource = (
    submitted: TableRowData | undefined,
    revision: TableRowData | undefined,
    current: TableRowData | undefined,
    field: keyof TableRowData
  ): { isCurrentModified: boolean; isSubmittedModified: boolean } => {
    const submittedVal = submitted?.[field];
    const revisionVal = revision?.[field];
    const currentVal = current?.[field];

    // 判断提报时值是否和修订前值不同（提报版差异）
    // 包括：1. 如果整个项目在修订前不存在，但提报时存在（录入员在修订时新增的项目）→ 显示绿色
    //      2. 如果修订前存在，提报时存在，但值不同 → 显示绿色
    //      3. 如果修订前存在，但提报时不存在 → 显示绿色
    let isSubmittedModified = false;
    
    if (submitted) {
      // 如果整个项目在修订前不存在，但提报时存在（录入员在修订时新增的项目）
      if (!revision) {
        isSubmittedModified = true;
      } else {
        // 修订前存在，判断值是否不同
        if (!isEqual(submittedVal, revisionVal)) {
          isSubmittedModified = true;
        }
      }
    } else if (revision) {
      // 修订前存在，但提报时不存在（这种情况理论上不应该发生，但也要考虑）
      isSubmittedModified = true;
    }

    // 判断当前值是否被录入员修改了
    // "当前修改"只针对录入员最新的改动，即当前值和提报时值不同的情况
    // 1. 如果是新增（当前存在，但提报时和修订前都不存在）→ 算当前修改
    // 2. 如果有修订前版本：
    //    - 如果提报版和修订前不同（提报时有修改）：当前值和提报时值不同才算当前修改
    //    - 如果提报版和修订前相同（提报时没有修改）：当前值和修订前值不同才算当前修改
    // 3. 如果第一次提报（没有修订前版本）：当前值和提报时值不同才算当前修改
    let isCurrentModified = false;
    
    if (current) {
      // 判断是否是新增（当前存在，但提报时和修订前都不存在）
      const isNewItem = !submitted && !revision && currentVal !== undefined && currentVal !== null && currentVal !== "";
      
      // 判断是否是录入员新增（当前存在，提报时不存在，但修订前也不存在）
      // 或者当前存在，提报时不存在，但修订前存在（说明是录入员在修订时新增的，现在录入员又修改了）
      const isClerkNewItem = currentVal !== undefined && currentVal !== null && currentVal !== "" && 
        (!submitted || submittedVal === undefined || submittedVal === null || submittedVal === "");
      
      if (isNewItem || (isClerkNewItem && !revision)) {
        // 新增的算当前修改（录入员新增的）
        isCurrentModified = true;
      } else if (revision && submitted) {
        // 有修订前版本和提报时版本
        if (isSubmittedModified) {
          // 提报版和修订前不同（提报时有修改）：判断当前值和提报时值是否不同
          isCurrentModified = !isEqual(submittedVal, currentVal);
        } else {
          // 提报版和修订前相同（提报时没有修改）：判断当前值和修订前值是否不同
          isCurrentModified = !isEqual(revisionVal, currentVal);
        }
      } else if (submitted) {
        // 第一次提报（没有修订前版本）：判断当前值和提报时值是否不同
        isCurrentModified = !isEqual(submittedVal, currentVal);
      } else if (revision) {
        // 只有修订前版本，没有提报时版本（录入员新增的，在修订时新增的）
        // 如果当前值和修订前值不同，说明录入员修改了
        // 如果当前值和修订前值相同，也算当前修改（因为是录入员新增的）
        isCurrentModified = true;
      }
    }

    return { isCurrentModified, isSubmittedModified };
  };

  // 渲染字段对比（区分修改来源）- 录入员视图
  // 显示顺序：当前版本（最新） -> 提报时版本（最新） -> 修订前版本（旧值）
  const renderFieldCompare = (
    submitted: TableRowData | undefined,
    revision: TableRowData | undefined,
    current: TableRowData | undefined,
    field: keyof TableRowData,
    currentValue: any,
    isDeleted: boolean = false
  ) => {
    const { isCurrentModified, isSubmittedModified } = getChangeSource(submitted, revision, current, field);
    const revisionVal = revision?.[field];

    return (
      <div>
        {/* 第一行：当前版本（最新）- 如果和修订前不同，标红 */}
        {current && (
          <div
            style={{
              backgroundColor: isCurrentModified ? "#fff1f0" : "transparent",
              padding: "4px",
              position: "relative",
            }}
          >
            {field === "unit_price" || field === "total_price" ? formatCurrency(currentValue) : (currentValue || "-")}
            {isCurrentModified && (
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
        {/* 如果被删除，显示删除标记 */}
        {isDeleted && !current && (
          <div
            style={{
              backgroundColor: "#fff7e6",
              padding: "4px",
              color: "#fa8c16",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            [已删除]
          </div>
        )}
        {/* 第二行：提报时版本（最新）- 如果和修订前不同，标绿 */}
        {/* 如果修订前存在但提报时不存在（录入员在修订时新增的项目），也要显示提报版 */}
        {(submitted || (revision && !submitted && revisionVal !== undefined && revisionVal !== null && String(revisionVal) !== "")) && (
          <div
            style={{
              backgroundColor: isSubmittedModified ? "#f6ffed" : (isDeleted ? "#fff7e6" : "transparent"),
              padding: "4px",
              marginTop: current ? "4px" : 0,
              color: isDeleted ? "#fa8c16" : "#666",
              fontSize: "12px",
            }}
          >
            提报版: {field === "unit_price" || field === "total_price" ? formatCurrency(submitted?.[field]) : (submitted?.[field] || "-")}
            {isSubmittedModified && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#52c41a",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                (提报版)
              </span>
            )}
          </div>
        )}
        {/* 第三行：修订前版本（旧值）- 不显示颜色，仅作为参考，如果第一次提报没有修订前则不显示 */}
        {revision && (
          <div
            style={{
              backgroundColor: isDeleted ? "#fff7e6" : "transparent",
              padding: "4px",
              marginTop: (current || submitted) ? "4px" : 0,
              color: isDeleted ? "#fa8c16" : "#999",
              fontSize: "11px",
            }}
          >
            修订前: {field === "unit_price" || field === "total_price" ? formatCurrency(revision[field]) : (revision[field] || "-")}
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
    isDeleted?: boolean;
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
          record.current?.project_name,
          record.isDeleted
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
          record.current?.level1_category_name,
          record.isDeleted
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
          record.current?.level2_category_name,
          record.isDeleted
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
          record.current?.height,
          record.isDeleted
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
          record.current?.width,
          record.isDeleted
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
          record.current?.quantity,
          record.isDeleted
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
          record.current?.unit,
          record.isDeleted
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
          record.current?.material_name,
          record.isDeleted
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
          record.current?.color_name,
          record.isDeleted
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
          record.current?.remark,
          record.isDeleted
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
                红色背景 = 当前修改，橙色背景 = 已删除
              </div>
            </div>
          </Col>
          {submittedData && (
            <Col span={8}>
              <div>
                <strong>提报版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  设计师提报的版本
                </div>
              </div>
            </Col>
          )}
          {revisionData && (
            <Col span={8}>
              <div>
                <strong>修订前版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  绿色背景 = 修订版
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

  // 使用项目名称 + 一级类目名称 + 二级类目名称作为唯一键来匹配
  const getMatchKey = (item: any) => {
    const projectName = String(item?.project_name || "");
    const level1Name = String(item?.level1_category_name || "");
    const level2Name = String(item?.level2_category_name || "");
    return `${projectName}-${level1Name}-${level2Name}`;
  };

  // 收集所有唯一键
  const allKeys = new Set<string>();
  currentTableData.forEach((d) => {
    const key = getMatchKey(d);
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    }
  });
  submittedTableData.forEach((d) => {
    const key = getMatchKey(d);
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    }
  });
  revisionTableData.forEach((d) => {
    const key = getMatchKey(d);
    if (key && key.trim() !== "" && key !== "--") {
      allKeys.add(key);
    }
  });

  const compareData = Array.from(allKeys).map((key, index) => {
    const current = currentTableData.find((d) => getMatchKey(d) === key);
    const submitted = submittedTableData.find((d) => getMatchKey(d) === key);
    const revision = revisionTableData.find((d) => getMatchKey(d) === key);
    // 判断是否被删除：在旧版本中存在，但在当前版本中不存在
    const isDeleted = (submitted || revision) && !current;
    return { current, submitted, revision, id: current?.id || submitted?.id || revision?.id || index, isDeleted };
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
    currentValue: any,
    isDeleted: boolean = false
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
        {/* 如果被删除，显示删除标记 */}
        {isDeleted && !current && (
          <div
            style={{
              backgroundColor: "#fff7e6",
              padding: "4px",
              color: "#fa8c16",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            [已删除]
          </div>
        )}
        {/* 第二行：提报时版本（最新） */}
        {submitted && (
          <div
            style={{
              backgroundColor: isDeleted ? "#fff7e6" : "transparent",
              padding: "4px",
              marginTop: current ? "4px" : 0,
              color: isDeleted ? "#fa8c16" : "#666",
              fontSize: "12px",
            }}
          >
            提报版: {submitted[field] || "-"}
          </div>
        )}
        {/* 第三行：修订后版本（旧值） */}
        {revision && (
          <div
            style={{
              backgroundColor: (changeSource === "revision" || changeSource === "both") ? "#f6ffed" : (isDeleted ? "#fff7e6" : "transparent"),
              padding: "4px",
              marginTop: (current || submitted) ? "4px" : 0,
              color: isDeleted ? "#fa8c16" : "#999",
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
    isDeleted?: boolean;
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
          record.current?.project_name,
          record.isDeleted
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
          record.current?.level1_category_name,
          record.isDeleted
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
          record.current?.level2_category_name,
          record.isDeleted
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
          record.current?.height,
          record.isDeleted
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
          record.current?.width,
          record.isDeleted
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
          record.current?.quantity,
          record.isDeleted
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
          record.current?.unit,
          record.isDeleted
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
          record.current?.material_name,
          record.isDeleted
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
          record.current?.color_name,
          record.isDeleted
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
          record.current?.remark,
          record.isDeleted
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
                红色背景 = 当前修改，橙色背景 = 已删除
              </div>
            </div>
          </Col>
          {submittedData && (
            <Col span={8}>
              <div>
                <strong>提报版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  设计师提报的版本
                </div>
              </div>
            </Col>
          )}
          {revisionData && (
            <Col span={8}>
              <div>
                <strong>修订后版本</strong>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  绿色背景 = 修订版
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
