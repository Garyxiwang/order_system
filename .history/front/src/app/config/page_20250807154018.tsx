"use client";

import React, { useState } from "react";
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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

interface StaffData {
  id: number;
  name: string;
  type: string;
}

interface CategoryData {
  id: number;
  name: string;
  category: string;
}

interface StaffFormValues {
  name: string;
  type: string;
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
  const [staffData, setStaffData] = useState<StaffData[]>([
    { id: 1, name: "张三", type: "设计师" },
    { id: 2, name: "李四", type: "拆单员" },
    { id: 3, name: "王五", type: "销售员" },
  ]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([
    { id: 1, name: "木门", category: "场内生成项" },
    { id: 2, name: "柜体", category: "场内生成项" },
    { id: 3, name: "石材", category: "外购项" },
    { id: 4, name: "铝合金门", category: "外购项" },
    { id: 5, name: "板材", category: "外购项" },
  ]);

  // 人员配置表格列
  const staffColumns = [
    {
      title: "编号",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "人员名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "人员类别",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: StaffData) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteStaff(record.id)}
        >
          删除
        </Button>
      ),
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
  const handleDeleteStaff = (id: number) => {
    setStaffData(staffData.filter((item) => item.id !== id));
    message.success("删除成功");
  };

  // 删除类目
  const handleDeleteCategory = (id: number) => {
    setCategoryData(categoryData.filter((item) => item.id !== id));
    message.success("删除成功");
  };

  // 添加人员
  const handleAddStaff = (values: StaffFormValues) => {
    const newId = Math.max(...staffData.map((item) => item.id)) + 1;
    setStaffData([...staffData, { id: newId, ...values }]);
    setStaffModalVisible(false);
    staffForm.resetFields();
    message.success("添加成功");
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
                  <Table
                    columns={staffColumns}
                    dataSource={staffData}
                    rowKey="id"
                    pagination={false}
                  />
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
            name="name"
            label="人员名称"
            rules={[{ required: true, message: "请输入人员名称" }]}
          >
            <Input placeholder="请输入人员名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="人员类别"
            rules={[{ required: true, message: "请选择人员类别" }]}
          >
            <Select placeholder="请选择人员类别">
              <Option value="设计师">设计师</Option>
              <Option value="管理员">拆单员</Option>
              <Option value="销售员">销售员</Option>
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
