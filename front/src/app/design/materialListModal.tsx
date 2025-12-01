"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Card,
  Row,
  Col,
  Divider,
  AutoComplete,
} from "antd";
import { DesignerCompareView } from "./CompareView";
import { PlusOutlined, DeleteOutlined, DiffOutlined } from "@ant-design/icons";
import type { DesignOrder } from "../../services/designApi";
import MaterialListService, {
  MaterialListItem,
  QuotationCategory,
  QuotationProject,
} from "../../services/materialListService";
import {
  QuotationConfigService,
  QuotationCategoryTree,
  MaterialData,
  ColorData,
  ProjectData,
} from "../../services/quotationConfigService";

const { Option } = Select;

interface MaterialListModalProps {
  visible: boolean;
  onCancel: () => void;
  order: DesignOrder | null;
  onSuccess?: () => void;
}

interface ProjectFormData {
  name: string;
  categories: CategoryFormData[];
}

interface CategoryFormData {
  level1_category_id: number;
  level1_category_name: string;
  level2_category_id: number;
  level2_category_name: string;
  height?: number | string; // 可能是字符串（Input）或数字（InputNumber）
  width?: number | string; // 可能是字符串（Input）或数字（InputNumber）
  quantity: number | string; // 可能是字符串（Input）或数字（InputNumber）
  unit: string;
  material_id?: number;
  material_name?: string;
  color_id?: number;
  color_name?: string;
  remark?: string;
}

const MaterialListModal: React.FC<MaterialListModalProps> = ({
  visible,
  onCancel,
  order,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [materialList, setMaterialList] = useState<MaterialListItem | null>(
    null
  );
  const [categoryTree, setCategoryTree] = useState<QuotationCategoryTree[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [colors, setColors] = useState<ColorData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isCompareVisible, setIsCompareVisible] = useState(false);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
  } | null>(null);
  const [revisionSnapshot, setRevisionSnapshot] = useState<{
    projects: QuotationProject[];
    categories: QuotationCategory[];
  } | null>(null);

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
      const materialListData = await MaterialListService.getMaterialListByOrder(
        order.order_number
      );
      if (materialListData) {
        setMaterialList(materialListData);
        const detail = await MaterialListService.getMaterialListDetail(
          materialListData.id
        );

        // 填充表单
        const projectFormData: ProjectFormData[] = detail.projects.map(
          (project) => ({
            name: project.name,
            categories: detail.categories
              .filter((c) => c.project_id === project.id)
              .map((c) => ({
                level1_category_id: c.level1_category_id,
                level1_category_name: c.level1_category_name,
                level2_category_id: c.level2_category_id,
                level2_category_name: c.level2_category_name,
                height: c.height,
                width: c.width,
                quantity: c.quantity,
                unit: c.unit,
                material_id: c.material_id,
                material_name: c.material_name,
                color_id: c.color_id,
                color_name: c.color_name,
                remark: c.remark,
              })),
          })
        );
        form.setFieldsValue({ projects: projectFormData });

        // 加载提报时快照，用于对比（无论状态如何）
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

        // 如果是修订状态，加载修订后快照（录入员修订后的版本）
        if (materialListData.status === 'revision') {
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
        }
      } else {
        // 新建
        setMaterialList(null);
        form.resetFields();
        form.setFieldsValue({ projects: [] });
      }
    } catch (error) {
      console.error("加载物料清单失败:", error);
    }
  };

  const loadConfigData = async () => {
    try {
      const [treeData, materialData, colorData, projectData] = await Promise.all([
        QuotationConfigService.getCategoryTree(),
        QuotationConfigService.getMaterialList(),
        QuotationConfigService.getColorList(),
        QuotationConfigService.getProjectList(),
      ]);
      setCategoryTree(treeData);
      setMaterials(materialData);
      setColors(colorData);
      setProjects(projectData);
    } catch (error) {
      console.error("加载配置数据失败:", error);
    }
  };

  const handleSubmit = async (values: { projects: ProjectFormData[] }) => {
    if (!order) return;

    try {
      setLoading(true);
      const projectData = values.projects
        .filter((p) => p.name)
        .map((p, index) => ({
          name: p.name,
          sort_order: index,
        }));

      const categoryData: Array<{
        name?: string; // 项目名称，用于匹配项目
        sort_order?: number; // 项目索引，用于匹配项目
        level1_category_id: number;
        level1_category_name: string;
        level2_category_id: number;
        level2_category_name: string;
        height?: number;
        width?: number;
        quantity: number;
        unit: string;
        material_id?: number;
        material_name?: string;
        color_id?: number;
        color_name?: string;
        remark?: string;
      }> = [];
      values.projects.forEach((project, projectIndex) => {
        if (!project.name) return;
        project.categories?.forEach((category) => {
          if (category.level1_category_id && category.level2_category_id) {
            // 转换数据类型：height, width, quantity 从字符串转为数字
            const height = category.height 
              ? (typeof category.height === 'string' ? parseFloat(category.height) || undefined : category.height)
              : undefined;
            const width = category.width 
              ? (typeof category.width === 'string' ? parseFloat(category.width) || undefined : category.width)
              : undefined;
            const quantity = category.quantity 
              ? (typeof category.quantity === 'string' ? parseFloat(category.quantity) || 0 : category.quantity)
              : 0;
            
            categoryData.push({
              name: project.name, // 添加项目名称用于匹配
              sort_order: projectIndex, // 添加项目索引用于匹配
              level1_category_id: category.level1_category_id,
              level1_category_name: category.level1_category_name,
              level2_category_id: category.level2_category_id,
              level2_category_name: category.level2_category_name,
              height: height,
              width: width,
              quantity: quantity,
              unit: category.unit || "平方",
              material_id: category.material_id,
              material_name: category.material_name,
              color_id: category.color_id,
              color_name: category.color_name,
              remark: category.remark,
            });
          }
        });
      });

      if (materialList) {
        // 更新
        await MaterialListService.updateMaterialList(materialList.id, {
          projects: projectData,
          categories: categoryData,
        });
        message.success("保存成功");
      } else {
        // 创建
        await MaterialListService.createMaterialList({
          order_number: order.order_number,
          projects: projectData,
          categories: categoryData,
        });
        message.success("创建成功");
      }

      onSuccess?.();
      onCancel();
    } catch {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (!materialList) {
        // 新建时，先创建，然后保存（状态变为进行中）
        await handleSubmit(values);
        // 重新加载数据以获取ID
        await loadMaterialListData();
        const updatedMaterialList =
          await MaterialListService.getMaterialListByOrder(order!.order_number);
        if (updatedMaterialList) {
          await MaterialListService.saveMaterialList(
            updatedMaterialList.id,
            {}
          );
          message.success("保存成功，状态已更新为进行中");
        }
      } else {
        // 更新时，先保存数据，然后更新状态为进行中
        await handleSubmit(values);
        await MaterialListService.saveMaterialList(materialList.id, {});
        message.success("保存成功，状态已更新为进行中");
      }
      onSuccess?.();
    } catch (error) {
      console.error("保存失败:", error);
      message.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMaterial = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (!materialList) {
        // 新建时，先创建，然后提报
        await handleSubmit(values);
        await loadMaterialListData();
        const updatedMaterialList =
          await MaterialListService.getMaterialListByOrder(order!.order_number);
        if (updatedMaterialList) {
          await MaterialListService.submitMaterialList(updatedMaterialList.id);
          message.success("提报成功");
        }
      } else {
        // 更新时，先保存数据，然后提报
        await handleSubmit(values);
        await MaterialListService.submitMaterialList(materialList.id);
        message.success("提报成功");
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error("提报失败:", error);
      message.error("提报失败");
    } finally {
      setLoading(false);
    }
  };

  // 已提报后不可编辑（设计师视角）
  // 修订中状态时，设计师可以编辑（修订中状态表示被打回，需要修改）
  // 未开始和进行中状态时，设计师可以编辑
  const isReadOnly = materialList?.status === "submitted";

  return (
    <Modal
      title={`物料清单 - ${order?.order_number || ""}`}
      open={visible}
      onCancel={onCancel}
      width={1600}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.List name="projects">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, projectIndex) => (
                <Card
                  key={field.key}
                  title={
                    <Form.Item
                      name={[field.name, "name"]}
                      rules={[{ required: true, message: "请输入项目名称" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <AutoComplete
                        placeholder="请输入或选择项目名称，如：主卧、厨房"
                        disabled={isReadOnly}
                        style={{ fontWeight: 600 }}
                        options={projects.map((p) => ({
                          value: p.name,
                          label: p.name,
                        }))}
                        filterOption={(inputValue, option) =>
                          option?.value?.toUpperCase().includes(inputValue.toUpperCase()) || false
                        }
                      />
                    </Form.Item>
                  }
                  style={{ marginBottom: 16 }}
                  extra={
                    !isReadOnly && (
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        删除项目
                      </Button>
                    )
                  }
                >
                  <Form.List name={[field.name, "categories"]}>
                    {(
                      categoryFields,
                      { add: addCategory, remove: removeCategory }
                    ) => (
                      <>
                        {categoryFields.map((categoryField, categoryIndex) => (
                          <div
                            key={categoryField.key}
                            style={{
                              marginBottom: 12,
                              padding: 12,
                              backgroundColor: "#fafafa",
                              borderRadius: 4,
                              border: "1px solid #e8e8e8",
                            }}
                          >
                            <Row
                              gutter={8}
                              align="middle"
                              justify="space-between"
                            >
                              <Col flex="auto">
                                <Row gutter={8} align="middle">
                                  <Col span={2}>
                                    <span style={{ color: "#666" }}>
                                      类目 {categoryIndex + 1}
                                    </span>
                                  </Col>
                                  <Col span={3}>
                                    <Form.Item
                                      name={[
                                        categoryField.name,
                                        "level1_category_id",
                                      ]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "请选择一级类目",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        placeholder="一级类目"
                                        disabled={isReadOnly}
                                        onChange={(value) => {
                                          const level1 = categoryTree.find(
                                            (t) => t.level1.id === value
                                          );
                                          if (level1) {
                                            form.setFieldsValue({
                                              projects: form
                                                .getFieldValue("projects")
                                                .map(
                                                  (
                                                    p: ProjectFormData,
                                                    pIdx: number
                                                  ) => {
                                                    if (pIdx === projectIndex) {
                                                      return {
                                                        ...p,
                                                        categories:
                                                          p.categories?.map(
                                                            (c, cIdx) => {
                                                              if (
                                                                cIdx ===
                                                                categoryIndex
                                                              ) {
                                                                return {
                                                                  ...c,
                                                                  level1_category_id:
                                                                    value,
                                                                  level1_category_name:
                                                                    level1
                                                                      .level1
                                                                      .name,
                                                                  level2_category_id:
                                                                    undefined,
                                                                  level2_category_name:
                                                                    undefined,
                                                                  unit: undefined, // 清空单位
                                                                  material_id: undefined, // 清空基材
                                                                  material_name: undefined,
                                                                  color_id: undefined, // 清空颜色
                                                                  color_name: undefined,
                                                                };
                                                              }
                                                              return c;
                                                            }
                                                          ) || [],
                                                      };
                                                    }
                                                    return p;
                                                  }
                                                ),
                                            });
                                          }
                                        }}
                                      >
                                        {categoryTree.map((tree) => (
                                          <Option
                                            key={tree.level1.id}
                                            value={tree.level1.id}
                                          >
                                            {tree.level1.name}
                                          </Option>
                                        ))}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={3}>
                                    <Form.Item
                                      name={[
                                        categoryField.name,
                                        "level2_category_id",
                                      ]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "请选择二级类目",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        placeholder="二级类目"
                                        disabled={isReadOnly}
                                        onChange={(value) => {
                                          const level1Id = form.getFieldValue([
                                            "projects",
                                            projectIndex,
                                            "categories",
                                            categoryIndex,
                                            "level1_category_id",
                                          ]);
                                          const level1 = categoryTree.find(
                                            (t) => t.level1.id === level1Id
                                          );
                                          const level2 = level1?.level2.find(
                                            (l2) => l2.id === value
                                          );
                                          if (level2) {
                                            // 自动设置计价单位
                                            form.setFieldsValue({
                                              projects: form
                                                .getFieldValue("projects")
                                                .map(
                                                  (
                                                    p: ProjectFormData,
                                                    pIdx: number
                                                  ) => {
                                                    if (pIdx === projectIndex) {
                                                      return {
                                                        ...p,
                                                        categories:
                                                          p.categories?.map(
                                                            (c, cIdx) => {
                                                              if (
                                                                cIdx ===
                                                                categoryIndex
                                                              ) {
                                                                return {
                                                                  ...c,
                                                                  level2_category_id:
                                                                    value,
                                                                  level2_category_name:
                                                                    level2.name,
                                                                  unit:
                                                                    level2.pricing_unit ||
                                                                    "",
                                                                };
                                                              }
                                                              return c;
                                                            }
                                                          ) || [],
                                                      };
                                                    }
                                                    return p;
                                                  }
                                                ),
                                            });
                                          }
                                        }}
                                      >
                                        {(() => {
                                          const level1Id = form.getFieldValue([
                                            "projects",
                                            projectIndex,
                                            "categories",
                                            categoryIndex,
                                            "level1_category_id",
                                          ]);
                                          const level1 = categoryTree.find(
                                            (t) => t.level1.id === level1Id
                                          );
                                          return (
                                            level1?.level2.map((l2) => (
                                              <Option key={l2.id} value={l2.id}>
                                                {l2.name}
                                              </Option>
                                            )) || []
                                          );
                                        })()}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={2}>
                                    <Form.Item
                                      name={[categoryField.name, "height"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input
                                        style={{ width: "100%" }}
                                        placeholder="高(mm)"
                                        disabled={isReadOnly}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={2}>
                                    <Form.Item
                                      name={[categoryField.name, "width"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input
                                        style={{ width: "100%" }}
                                        placeholder="宽(mm)"
                                        disabled={isReadOnly}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={2}>
                                    <Form.Item
                                      name={[categoryField.name, "quantity"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "请输入数量",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input
                                        style={{ width: "100%" }}
                                        placeholder="数量"
                                        disabled={isReadOnly}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={2}>
                                    <Form.Item
                                      name={[categoryField.name, "unit"]}
                                      rules={[
                                        {
                                          required: true,
                                          message: "请选择单位",
                                        },
                                      ]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input
                                        placeholder="单位"
                                        disabled={true}
                                        style={{ backgroundColor: "#f5f5f5" }}
                                      ></Input>
                                    </Form.Item>
                                  </Col>
                                  <Col span={3}>
                                    <Form.Item
                                      name={[categoryField.name, "material_id"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        placeholder="基材"
                                        disabled={isReadOnly}
                                        onChange={(value) => {
                                          const material = materials.find(
                                            (m) => m.id === value
                                          );
                                          if (material) {
                                            form.setFieldsValue({
                                              projects: form
                                                .getFieldValue("projects")
                                                .map(
                                                  (
                                                    p: ProjectFormData,
                                                    pIdx: number
                                                  ) => {
                                                    if (pIdx === projectIndex) {
                                                      return {
                                                        ...p,
                                                        categories:
                                                          p.categories?.map(
                                                            (c, cIdx) => {
                                                              if (
                                                                cIdx ===
                                                                categoryIndex
                                                              ) {
                                                                return {
                                                                  ...c,
                                                                  material_id:
                                                                    value,
                                                                  material_name:
                                                                    material.name,
                                                                  color_id: undefined, // 清空颜色
                                                                  color_name: undefined,
                                                                };
                                                              }
                                                              return c;
                                                            }
                                                          ) || [],
                                                      };
                                                    }
                                                    return p;
                                                  }
                                                ),
                                            });
                                          }
                                        }}
                                      >
                                        {(() => {
                                          // 根据一级类目过滤基材
                                          const level1Id = form.getFieldValue([
                                            "projects",
                                            projectIndex,
                                            "categories",
                                            categoryIndex,
                                            "level1_category_id",
                                          ]);
                                          const level1 = categoryTree.find(
                                            (t) => t.level1.id === level1Id
                                          );
                                          const allowedMaterialIds = level1?.level1.material_ids || [];
                                          
                                          // 如果一级类目有关联的基材，只显示关联的基材；否则显示所有基材
                                          const filteredMaterials = allowedMaterialIds.length > 0
                                            ? materials.filter((m) => allowedMaterialIds.includes(m.id))
                                            : materials;
                                          
                                          return filteredMaterials.map((material) => (
                                            <Option
                                              key={material.id}
                                              value={material.id}
                                            >
                                              {material.name}
                                            </Option>
                                          ));
                                        })()}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={3}>
                                    <Form.Item
                                      name={[categoryField.name, "color_id"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        placeholder="颜色"
                                        disabled={isReadOnly}
                                        onChange={(value) => {
                                          const color = colors.find(
                                            (c) => c.id === value
                                          );
                                          if (color) {
                                            form.setFieldsValue({
                                              projects: form
                                                .getFieldValue("projects")
                                                .map(
                                                  (
                                                    p: ProjectFormData,
                                                    pIdx: number
                                                  ) => {
                                                    if (pIdx === projectIndex) {
                                                      return {
                                                        ...p,
                                                        categories:
                                                          p.categories?.map(
                                                            (c, cIdx) => {
                                                              if (
                                                                cIdx ===
                                                                categoryIndex
                                                              ) {
                                                                return {
                                                                  ...c,
                                                                  color_id:
                                                                    value,
                                                                  color_name:
                                                                    color.name,
                                                                };
                                                              }
                                                              return c;
                                                            }
                                                          ) || [],
                                                      };
                                                    }
                                                    return p;
                                                  }
                                                ),
                                            });
                                          }
                                        }}
                                      >
                                        {(() => {
                                          // 根据基材过滤颜色
                                          const materialId = form.getFieldValue([
                                            "projects",
                                            projectIndex,
                                            "categories",
                                            categoryIndex,
                                            "material_id",
                                          ]);
                                          const material = materials.find(
                                            (m) => m.id === materialId
                                          );
                                          const allowedColorIds = material?.color_ids || [];
                                          
                                          // 如果基材有关联的颜色，只显示关联的颜色；否则显示所有颜色
                                          const filteredColors = allowedColorIds.length > 0
                                            ? colors.filter((c) => allowedColorIds.includes(c.id))
                                            : colors;
                                          
                                          return filteredColors.map((color) => (
                                            <Option
                                              key={color.id}
                                              value={color.id}
                                            >
                                              {color.name}
                                            </Option>
                                          ));
                                        })()}
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                  <Col span={2}>
                                    <Form.Item
                                      name={[categoryField.name, "remark"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input
                                        placeholder="备注"
                                        disabled={isReadOnly}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Col>
                              <Col flex="none">
                                {!isReadOnly && (
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      removeCategory(categoryField.name)
                                    }
                                  >
                                    删除
                                  </Button>
                                )}
                              </Col>
                            </Row>
                          </div>
                        ))}
                        {!isReadOnly && (
                          <Button
                            type="dashed"
                            onClick={() => addCategory()}
                            block
                            icon={<PlusOutlined />}
                            style={{ marginTop: 8 }}
                          >
                            添加类目
                          </Button>
                        )}
                      </>
                    )}
                  </Form.List>
                </Card>
              ))}
              {!isReadOnly && (
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  添加项目
                </Button>
              )}
            </>
          )}
        </Form.List>

        <Divider />

        <Form.Item>
          <div style={{ textAlign: "right" }}>
            <Space>
              {/* 只有存在修订快照时才显示对比按钮（说明已经修订过，不是第一次提报） */}
              {revisionSnapshot && (
                <Button
                  icon={<DiffOutlined />}
                  onClick={() => setIsCompareVisible(true)}
                >
                  对比
                </Button>
              )}
              <Button onClick={onCancel}>取消</Button>
              {!isReadOnly && (
                <>
                  <Button type="primary" onClick={handleSave} loading={loading}>
                    保存
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSubmitMaterial}
                    loading={loading}
                  >
                    提报
                  </Button>
                </>
              )}
            </Space>
          </div>
        </Form.Item>
      </Form>

      {/* 对比模态框 - 设计师对比快照和当前数据 */}
      <Modal
        title="版本对比（提报时 / 修订后 / 当前）"
        open={isCompareVisible}
        onCancel={() => setIsCompareVisible(false)}
        footer={null}
        width={1800}
        destroyOnClose
      >
        <DesignerCompareView
          formData={form.getFieldsValue()}
          submittedData={submittedSnapshot || undefined}
          revisionData={revisionSnapshot || undefined}
        />
      </Modal>
    </Modal>
  );
};

export default MaterialListModal;
