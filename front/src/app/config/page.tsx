"use client";

import React, { useState, useEffect } from "react";
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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { StaffService, StaffData } from "../../services/staffService";

const { Title } = Typography;
const { Option } = Select;

interface CategoryData {
  id: number;
  name: string;
  category: string;
}

interface StaffFormValues {
  username: string;
  role: string;
}

interface CategoryFormValues {
  name: string;
  category: string;
}

const ConfigPage: React.FC = () => {
  const [staffForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [staffData, setStaffData] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([
    { id: 1, name: "木门", category: "场内生成项" },
    { id: 2, name: "柜体", category: "场内生成项" },
    { id: 3, name: "石材", category: "外购项" },
    { id: 4, name: "铝合金门", category: "外购项" },
    { id: 5, name: "板材", category: "外购项" },
  ]);

  // 加载人员数据
  const loadStaffData = async () => {
    try {
      setLoading(true);
      const data = await StaffService.getStaffList();
      // 确保数据是数组格式
      if (Array.isArray(data)) {
        setStaffData(data);
      } else {
        console.error("API返回的数据不是数组格式:", data);
        setStaffData([]);
        message.error("数据格式错误");
      }
    } catch (error) {
      console.error("加载人员数据失败:", error);
      setStaffData([]);
      message.error("加载人员数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  // 人员配置表格列
  const staffColumns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const roleMap: { [key: string]: string } = {
          superAdmin: "超级管理员",
          admin: "管理员",
          designer: "设计师",
          splitting: "拆单员",
          salesperson: "销售",
          procurement: "采购",
          workshop: "车间",
          manager: "主管",
          clerk: "录入员",
          finance: "财务",
          shipper: "发货员",
        };
        return roleMap[role] || role;
      },
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => {
        if (!text) return "-";
        return new Date(text).toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: StaffData) => {
        // 超管和管理员不可删除
        if (record.role === "superAdmin") {
          return (
            <Button
              type="link"
              danger
              disabled
              icon={<DeleteOutlined />}
              title={"超级管理员不可删除"}
            >
              删除
            </Button>
          );
        }
        return (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteStaff(record.username)}
          >
            删除
          </Button>
        );
      },
    },
  ];

  // 类目配置表格列
  const categoryColumns = [
    {
      title: "编号",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "类目名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类目分类",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: CategoryData) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteCategory(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  // 删除人员
  const handleDeleteStaff = async (username: string) => {
    try {
      setLoading(true);
      await StaffService.deleteStaff(username);
      setStaffData(staffData.filter((item) => item.username !== username));
      message.success("删除成功");
    } catch (error) {
      message.error("删除失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除类目
  const handleDeleteCategory = (id: number) => {
    setCategoryData(categoryData.filter((item) => item.id !== id));
    message.success("删除成功");
  };

  // 添加人员
  const handleAddStaff = async (values: StaffFormValues) => {
    // 检查用户名是否重复
    const existingUser = staffData.find(
      (staff) => staff.username === values.username
    );
    if (existingUser) {
      message.error("用户名已存在，请使用其他用户名");
      return;
    }

    try {
      setLoading(true);
      const newStaff = await StaffService.createStaff(values);
      setStaffData([...staffData, newStaff]);
      setStaffModalVisible(false);
      staffForm.resetFields();
      message.success("添加成功");
    } catch (error) {
      message.error(`添加失败,${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 添加类目
  const handleAddCategory = (values: CategoryFormValues) => {
    const newId = Math.max(...categoryData.map((item) => item.id)) + 1;
    setCategoryData([...categoryData, { id: newId, ...values }]);
    setCategoryModalVisible(false);
    categoryForm.resetFields();
    message.success("添加成功");
  };

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>系统配置</Title>

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "人员配置",
              children: (
                <div>
                  <div className="mb-4">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setStaffModalVisible(true)}
                    >
                      新增人员
                    </Button>
                  </div>
                  <Spin spinning={loading}>
                    <Table
                      columns={staffColumns}
                      dataSource={staffData}
                      rowKey="username"
                      pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条`,
                        pageSizeOptions: ["10", "20", "50", "100"],
                        onChange: (page, size) => {
                          setCurrentPage(page);
                          if (size !== pageSize) {
                            setPageSize(size);
                          }
                        },
                      }}
                    />
                  </Spin>
                </div>
              ),
            },
            {
              key: "2",
              label: "下单类目配置",
              children: (
                <div>
                  <div className="mb-4">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCategoryModalVisible(true)}
                    >
                      新增类目
                    </Button>
                  </div>
                  <Table
                    columns={categoryColumns}
                    dataSource={categoryData}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 新增人员Modal */}
      <Modal
        title="新增人员"
        open={staffModalVisible}
        onCancel={() => setStaffModalVisible(false)}
        footer={null}
      >
        <Form
          form={staffForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddStaff}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="designer">设计师</Option>
              <Option value="clerk">录入员</Option>
              <Option value="splitting">拆单员</Option>
              <Option value="salesperson">销售</Option>
              <Option value="procurement">采购</Option>
              <Option value="workshop">车间</Option>
              <Option value="manager">主管</Option>
              <Option value="finance">财务</Option>
              <Option value="shipper">发货员</Option>
            </Select>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setStaffModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增类目Modal */}
      <Modal
        title="新增类目"
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        footer={null}
      >
        <Form
          form={categoryForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddCategory}
        >
          <Form.Item
            name="name"
            label="类目名称"
            rules={[{ required: true, message: "请输入类目名称" }]}
          >
            <Input placeholder="请输入类目名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="类目分类"
            rules={[{ required: true, message: "请选择类目分类" }]}
          >
            <Select placeholder="请选择类目分类">
              <Option value="场内生成项">场内生成项</Option>
              <Option value="外购项">外购项</Option>
            </Select>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setCategoryModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
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

export default ConfigPage;
