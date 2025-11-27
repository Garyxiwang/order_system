"use client";

import React, { useState, useEffect } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import { PageModule } from "@/utils/permissions";
import {
  Typography,
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  InputNumber,
  Tag,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  QuotationConfigService,
  QuotationCategoryTree,
  QuotationCategoryLevel1,
  QuotationCategoryLevel2,
  MaterialData,
  ColorData,
  ProjectData,
} from "../../services/quotationConfigService";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CategoryLevel1FormValues {
  name: string;
  remark?: string;
  material_ids?: number[];
}

interface CategoryLevel2FormValues {
  parent_id: number;
  name: string;
  pricing_unit?: string; // 计价单位：平方、米、个、套、项
  remark?: string;
}

interface MaterialFormValues {
  name: string;
  remark?: string;
  dealer_price?: number;
  owner_price?: number;
  color_ids?: number[];
}

interface ColorFormValues {
  name: string;
  remark?: string;
}

interface ProjectFormValues {
  name: string;
  remark?: string;
}

const QuotationConfigPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // 报价类目相关状态
  const [categoryTree, setCategoryTree] = useState<QuotationCategoryTree[]>([]);
  const [level1ModalVisible, setLevel1ModalVisible] = useState(false);
  const [level2ModalVisible, setLevel2ModalVisible] = useState(false);
  const [editingLevel1, setEditingLevel1] =
    useState<QuotationCategoryLevel1 | null>(null);
  const [editingLevel2, setEditingLevel2] =
    useState<QuotationCategoryLevel2 | null>(null);
  const [level1Form] = Form.useForm();
  const [level2Form] = Form.useForm();

  // 基材管理相关状态
  const [materialData, setMaterialData] = useState<MaterialData[]>([]);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialData | null>(
    null
  );
  const [materialForm] = Form.useForm();

  // 颜色管理相关状态
  const [colorData, setColorData] = useState<ColorData[]>([]);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorData | null>(null);
  const [colorForm] = Form.useForm();

  // 项目配置相关状态
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [projectForm] = Form.useForm();

  // 加载报价类目树
  const loadCategoryTree = async () => {
    try {
      setLoading(true);
      const data = await QuotationConfigService.getCategoryTree();
      setCategoryTree(data);
    } catch (error) {
      message.error("加载报价类目失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载基材列表
  const loadMaterialList = async () => {
    try {
      setLoading(true);
      const data = await QuotationConfigService.getMaterialList();
      setMaterialData(data);
    } catch (error) {
      message.error("加载基材列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载颜色列表
  const loadColorList = async () => {
    try {
      setLoading(true);
      const data = await QuotationConfigService.getColorList();
      setColorData(data);
    } catch (error) {
      message.error("加载颜色列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载项目列表
  const loadProjectList = async () => {
    try {
      setLoading(true);
      const data = await QuotationConfigService.getProjectList();
      setProjectData(data);
    } catch (error) {
      message.error("加载项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "1") {
      loadCategoryTree();
    } else if (activeTab === "2") {
      loadMaterialList();
    } else if (activeTab === "3") {
      loadColorList();
    } else if (activeTab === "4") {
      loadProjectList();
    }
  }, [activeTab]);

  // 当切换到基材或颜色tab时，也需要加载对应的数据（用于下拉选择）
  useEffect(() => {
    if (activeTab === "1" || activeTab === "2") {
      loadMaterialList();
    }
    if (activeTab === "2" || activeTab === "3") {
      loadColorList();
    }
  }, [activeTab]);

  // ========== 报价类目相关处理函数 ==========

  // 打开添加一级类目Modal
  const handleAddLevel1 = () => {
    setEditingLevel1(null);
    level1Form.resetFields();
    setLevel1ModalVisible(true);
  };

  // 打开添加二级类目Modal
  const handleAddLevel2 = () => {
    setEditingLevel2(null);
    level2Form.resetFields();
    setLevel2ModalVisible(true);
  };

  // 打开编辑一级类目Modal
  const handleEditLevel1 = (category: QuotationCategoryLevel1) => {
    setEditingLevel1(category);
    level1Form.setFieldsValue({
      name: category.name,
      remark: category.remark || "",
      material_ids: category.material_ids || [],
    });
    setLevel1ModalVisible(true);
  };

  // 打开编辑二级类目Modal
  const handleEditLevel2 = (category: QuotationCategoryLevel2) => {
    setEditingLevel2(category);
    level2Form.setFieldsValue({
      parent_id: category.parent_id,
      name: category.name,
      pricing_unit: category.pricing_unit || "",
      remark: category.remark || "",
    });
    setLevel2ModalVisible(true);
  };

  // 提交一级类目
  const handleSubmitLevel1 = async (values: CategoryLevel1FormValues) => {
    try {
      setLoading(true);
      if (editingLevel1) {
        await QuotationConfigService.updateCategoryLevel1(
          editingLevel1.id,
          values
        );
        message.success("更新成功");
      } else {
        await QuotationConfigService.createCategoryLevel1(values);
        message.success("添加成功");
      }
      setLevel1ModalVisible(false);
      level1Form.resetFields();
      loadCategoryTree();
    } catch (error) {
      message.error(editingLevel1 ? "更新失败" : "添加失败");
    } finally {
      setLoading(false);
    }
  };

  // 提交二级类目
  const handleSubmitLevel2 = async (values: CategoryLevel2FormValues) => {
    try {
      setLoading(true);
      if (editingLevel2) {
        await QuotationConfigService.updateCategoryLevel2(
          editingLevel2.id,
          values
        );
        message.success("更新成功");
      } else {
        await QuotationConfigService.createCategoryLevel2(values);
        message.success("添加成功");
      }
      setLevel2ModalVisible(false);
      level2Form.resetFields();
      loadCategoryTree();
    } catch (error) {
      message.error(editingLevel2 ? "更新失败" : "添加失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除一级类目
  const handleDeleteLevel1 = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此一级类目吗？删除后其下的所有二级类目也会被删除。",
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await QuotationConfigService.deleteCategoryLevel1(id);
          message.success("删除成功");
          loadCategoryTree();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 删除二级类目
  const handleDeleteLevel2 = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此二级类目吗？",
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await QuotationConfigService.deleteCategoryLevel2(id);
          message.success("删除成功");
          loadCategoryTree();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ========== 基材管理相关处理函数 ==========

  // 打开添加基材Modal
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    materialForm.resetFields();
    setMaterialModalVisible(true);
  };

  // 打开编辑基材Modal
  const handleEditMaterial = (material: MaterialData) => {
    setEditingMaterial(material);
    materialForm.setFieldsValue({
      name: material.name,
      remark: material.remark || "",
      dealer_price: material.dealer_price,
      owner_price: material.owner_price,
      color_ids: material.color_ids || [],
    });
    setMaterialModalVisible(true);
  };

  // 提交基材
  const handleSubmitMaterial = async (values: MaterialFormValues) => {
    try {
      setLoading(true);
      if (editingMaterial) {
        await QuotationConfigService.updateMaterial(editingMaterial.id, values);
        message.success("更新成功");
      } else {
        await QuotationConfigService.createMaterial(values);
        message.success("添加成功");
      }
      setMaterialModalVisible(false);
      materialForm.resetFields();
      loadMaterialList();
    } catch (error) {
      message.error(editingMaterial ? "更新失败" : "添加失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除基材
  const handleDeleteMaterial = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此基材吗？",
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await QuotationConfigService.deleteMaterial(id);
          message.success("删除成功");
          loadMaterialList();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 过滤基材列表（暂时不使用搜索，直接返回全部数据）
  const filteredMaterialData = materialData;

  // ========== 颜色管理相关处理函数 ==========

  // 打开添加颜色Modal
  const handleAddColor = () => {
    setEditingColor(null);
    colorForm.resetFields();
    setColorModalVisible(true);
  };

  // 打开编辑颜色Modal
  const handleEditColor = (color: ColorData) => {
    setEditingColor(color);
    colorForm.setFieldsValue({
      name: color.name,
      remark: color.remark || "",
    });
    setColorModalVisible(true);
  };

  // 提交颜色
  const handleSubmitColor = async (values: ColorFormValues) => {
    try {
      setLoading(true);
      if (editingColor) {
        await QuotationConfigService.updateColor(editingColor.id, values);
        message.success("更新成功");
      } else {
        await QuotationConfigService.createColor(values);
        message.success("添加成功");
      }
      setColorModalVisible(false);
      colorForm.resetFields();
      loadColorList();
    } catch (error) {
      message.error(editingColor ? "更新失败" : "添加失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除颜色
  const handleDeleteColor = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此颜色吗？",
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await QuotationConfigService.deleteColor(id);
          message.success("删除成功");
          loadColorList();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 过滤颜色列表（暂时不使用搜索，直接返回全部数据）
  const filteredColorData = colorData;

  // ========== 项目配置相关处理函数 ==========

  // 打开添加项目Modal
  const handleAddProject = () => {
    setEditingProject(null);
    projectForm.resetFields();
    setProjectModalVisible(true);
  };

  // 打开编辑项目Modal
  const handleEditProject = (project: ProjectData) => {
    setEditingProject(project);
    projectForm.setFieldsValue({
      name: project.name,
      remark: project.remark || "",
    });
    setProjectModalVisible(true);
  };

  // 提交项目
  const handleSubmitProject = async (values: ProjectFormValues) => {
    try {
      setLoading(true);
      if (editingProject) {
        await QuotationConfigService.updateProject(editingProject.id, values);
        message.success("更新成功");
      } else {
        await QuotationConfigService.createProject(values);
        message.success("添加成功");
      }
      setProjectModalVisible(false);
      projectForm.resetFields();
      loadProjectList();
    } catch (error) {
      message.error(editingProject ? "更新失败" : "添加失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除项目
  const handleDeleteProject = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此项目吗？",
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await QuotationConfigService.deleteProject(id);
          message.success("删除成功");
          loadProjectList();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ========== 基材管理表格列 ==========
  const materialColumns = [
    {
      title: "基材名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "经销商价格",
      dataIndex: "dealer_price",
      key: "dealer_price",
      render: (price: number) => (price ? `¥${price.toFixed(2)}` : "-"),
    },
    {
      title: "业主价格",
      dataIndex: "owner_price",
      key: "owner_price",
      render: (price: number) => (price ? `¥${price.toFixed(2)}` : "-"),
    },
    {
      title: "关联颜色",
      dataIndex: "color_ids",
      key: "color_ids",
      render: (colorIds: number[]) => {
        if (!colorIds || colorIds.length === 0) return "-";
        const colors = colorData.filter(c => colorIds.includes(c.id));
        return (
          <Space wrap>
            {colors.map(color => (
              <Tag key={color.id}>
                {color.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text: string) => text || "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: MaterialData) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditMaterial(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMaterial(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // ========== 颜色管理表格列 ==========
  const colorColumns = [
    {
      title: "颜色名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text: string) => text || "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: ColorData) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditColor(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteColor(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>报价配置管理</Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "1",
              label: "报价类目",
              children: (
                <div>
                  <div className="mb-4">
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddLevel1}
                      >
                        添加一级类目
                      </Button>
                      <Button icon={<PlusOutlined />} onClick={handleAddLevel2}>
                        添加二级类目
                      </Button>
                    </Space>
                  </div>
                  <Spin spinning={loading}>
                    <div className="border border-gray-200 rounded p-4 bg-gray-50">
                      {categoryTree.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          暂无数据，请添加一级类目
                        </div>
                      ) : (
                        categoryTree.map((treeItem) => (
                          <div
                            key={treeItem.level1.id}
                            className="mb-4 border border-blue-200 rounded p-3 bg-blue-50"
                          >
                            <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-blue-200">
                              <div className="flex-1">
                                <span className="font-semibold text-blue-600 text-base">
                                  {treeItem.level1.name}
                                </span>
                                {treeItem.level1.material_ids && treeItem.level1.material_ids.length > 0 && (
                                  <div className="mt-1">
                                    <Space wrap size="small">
                                      {materialData
                                        .filter(m => treeItem.level1.material_ids?.includes(m.id))
                                        .map(material => (
                                          <Tag key={material.id} color="blue">
                                            {material.name}
                                          </Tag>
                                        ))}
                                    </Space>
                                  </div>
                                )}
                              </div>
                              <Space>
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() =>
                                    handleEditLevel1(treeItem.level1)
                                  }
                                >
                                  编辑
                                </Button>
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleDeleteLevel1(treeItem.level1.id)
                                  }
                                >
                                  删除
                                </Button>
                              </Space>
                            </div>
                            <div className="ml-5 mt-2">
                              {treeItem.level2.length === 0 ? (
                                <div className="text-gray-400 text-sm py-2">
                                  暂无二级类目
                                </div>
                              ) : (
                                treeItem.level2.map((level2) => (
                                  <div
                                    key={level2.id}
                                    className="mb-2 p-2 bg-white rounded border border-gray-200 flex justify-between items-center"
                                  >
                                    <span className="flex-1">
                                      {level2.name}
                                      {level2.pricing_unit && (
                                        <span className="ml-2 text-gray-500 text-sm">
                                          ({level2.pricing_unit})
                                        </span>
                                      )}
                                    </span>
                                    <Space>
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEditLevel2(level2)}
                                      >
                                        编辑
                                      </Button>
                                      <Button
                                        type="link"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          handleDeleteLevel2(level2.id)
                                        }
                                      >
                                        删除
                                      </Button>
                                    </Space>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Spin>
                </div>
              ),
            },
            {
              key: "2",
              label: "基材管理",
              children: (
                <div>
                  <div className="mb-4 flex justify-between">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddMaterial}
                    >
                      添加基材
                    </Button>
                  </div>
                  <Spin spinning={loading}>
                    <Table
                      columns={materialColumns}
                      dataSource={filteredMaterialData}
                      rowKey="id"
                      pagination={false}
                    />
                  </Spin>
                </div>
              ),
            },
            {
              key: "3",
              label: "颜色管理",
              children: (
                <div>
                  <div className="mb-4 flex justify-between">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddColor}
                    >
                      添加颜色
                    </Button>
                  </div>
                  <Spin spinning={loading}>
                    <Table
                      columns={colorColumns}
                      dataSource={filteredColorData}
                      rowKey="id"
                      pagination={false}
                    />
                  </Spin>
                </div>
              ),
            },
            {
              key: "4",
              label: "项目配置",
              children: (
                <div>
                  <div className="mb-4 flex justify-between">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddProject}
                    >
                      添加项目
                    </Button>
                  </div>
                  <Spin spinning={loading}>
                    <Table
                      columns={[
                        {
                          title: "项目名称",
                          dataIndex: "name",
                          key: "name",
                        },
                        {
                          title: "备注",
                          dataIndex: "remark",
                          key: "remark",
                          render: (text: string) => text || "-",
                        },
                        {
                          title: "操作",
                          key: "action",
                          render: (_: unknown, record: ProjectData) => (
                            <Space>
                              <Button
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => handleEditProject(record)}
                              >
                                编辑
                              </Button>
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteProject(record.id)}
                              >
                                删除
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                      dataSource={projectData}
                      rowKey="id"
                      pagination={false}
                    />
                  </Spin>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 添加/编辑一级类目Modal */}
      <Modal
        title={editingLevel1 ? "编辑一级类目" : "添加一级类目"}
        open={level1ModalVisible}
        onCancel={() => {
          setLevel1ModalVisible(false);
          level1Form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={level1Form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleSubmitLevel1}
        >
          <Form.Item
            name="name"
            label="类目名称"
            rules={[{ required: true, message: "请输入类目名称" }]}
          >
            <Input placeholder="请输入一级类目名称，如：柜体、墙板" />
          </Form.Item>
          <Form.Item
            name="material_ids"
            label="关联基材"
            tooltip="可选择多个基材，基材来源于基材管理"
          >
            <Select
              mode="multiple"
              placeholder="请选择基材（可多选）"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || option?.value || "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {materialData.map((material) => (
                <Option key={material.id} value={material.id}>
                  {material.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setLevel1ModalVisible(false);
                    level1Form.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑二级类目Modal */}
      <Modal
        title={editingLevel2 ? "编辑二级类目" : "添加二级类目"}
        open={level2ModalVisible}
        onCancel={() => {
          setLevel2ModalVisible(false);
          level2Form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={level2Form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleSubmitLevel2}
        >
          <Form.Item
            name="parent_id"
            label="所属一级类目"
            rules={[{ required: true, message: "请选择一级类目" }]}
          >
            <Select placeholder="请选择一级类目">
              {categoryTree.map((treeItem) => (
                <Option key={treeItem.level1.id} value={treeItem.level1.id}>
                  {treeItem.level1.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="类目名称"
            rules={[{ required: true, message: "请输入类目名称" }]}
          >
            <Input placeholder="请输入二级类目名称，如：高柜、吊柜" />
          </Form.Item>
          <Form.Item
            name="pricing_unit"
            label="计价单位"
            rules={[{ required: true, message: "请选择计价单位" }]}
          >
            <Select placeholder="请选择计价单位">
              <Option value="平方">平方</Option>
              <Option value="平米">平米</Option>
              <Option value="米">米</Option>
              <Option value="个">个</Option>
              <Option value="套">套</Option>
              <Option value="根">根</Option>
              <Option value="付">付</Option>
              <Option value="扇">扇</Option>
              <Option value="樘">樘</Option>
              <Option value="块">块</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setLevel2ModalVisible(false);
                    level2Form.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑基材Modal */}
      <Modal
        title={editingMaterial ? "编辑基材" : "添加基材"}
        open={materialModalVisible}
        onCancel={() => {
          setMaterialModalVisible(false);
          materialForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={materialForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleSubmitMaterial}
        >
          <Form.Item
            name="name"
            label="基材名称"
            rules={[{ required: true, message: "请输入基材名称" }]}
          >
            <Input placeholder="请输入基材名称" />
          </Form.Item>

          <Form.Item
            name="dealer_price"
            label="经销商单价"
            rules={[{ required: true, message: "请输入经销商价格" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入经销商价格"
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="owner_price"
            label="业主单价"
            rules={[{ required: true, message: "请输入业主价格" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="请输入业主价格"
              min={0}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="color_ids"
            label="关联颜色"
            tooltip="可选择多个颜色，颜色来源于颜色管理"
          >
            <Select
              mode="multiple"
              placeholder="请选择颜色（可多选）"
              showSearch
              filterOption={(input, option) => {
                const color = colorData.find(c => c.id === option?.value);
                return color?.name.toLowerCase().includes(input.toLowerCase()) || false;
              }}
            >
              {colorData.map((color) => (
                <Option key={color.id} value={color.id}>
                  {color.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setMaterialModalVisible(false);
                    materialForm.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑颜色Modal */}
      <Modal
        title={editingColor ? "编辑颜色" : "添加颜色"}
        open={colorModalVisible}
        onCancel={() => {
          setColorModalVisible(false);
          colorForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={colorForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleSubmitColor}
        >
          <Form.Item
            name="name"
            label="颜色名称"
            rules={[{ required: true, message: "请输入颜色名称" }]}
          >
            <Input placeholder="请输入颜色名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setColorModalVisible(false);
                    colorForm.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑项目Modal */}
      <Modal
        title={editingProject ? "编辑项目" : "添加项目"}
        open={projectModalVisible}
        onCancel={() => {
          setProjectModalVisible(false);
          projectForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={projectForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleSubmitProject}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}
          >
            <Input placeholder="请输入项目名称，如：主卧、次卧、客厅" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setProjectModalVisible(false);
                    projectForm.resetFields();
                  }}
                >
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default function QuotationConfigPageWithGuard() {
  return (
    <RouteGuard requiredModule={PageModule.CONFIG}>
      <QuotationConfigPage />
    </RouteGuard>
  );
}
