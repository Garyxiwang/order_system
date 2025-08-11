"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Card,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface ProgressItem {
  id: string;
  item: string;
  plannedDate: string;
  actualDate: string;
}

interface ProgressFormValues {
  progressType: string;
  customContent?: string;
  plannedDate: dayjs.Dayjs;
  actualDate: dayjs.Dayjs;
}

interface UpdateProgressModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
}

const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  visible,
  onCancel,
  orderNumber,
}) => {
  const [form] = Form.useForm();
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomContent, setShowCustomContent] = useState(false);

  // 预定义的进度类型
  const progressTypes = [
    "量尺",
    "初稿",
    "下单",
    "生产",
    "发货",
    "安装",
    "验收",
    "其他",
  ];

  // 模拟获取进度数据
  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // 模拟数据
      const mockData: ProgressItem[] = [
        {
          id: "1",
          item: "量尺",
          plannedDate: "2025-06-01",
          actualDate: "2025-06-01",
        },
        {
          id: "2",
          item: "初稿",
          plannedDate: "2025-06-02",
          actualDate: "2025-06-02",
        },
        {
          id: "3",
          item: "下单",
          plannedDate: "2025-06-03",
          actualDate: "2025-06-05",
        },
      ];
      
      setProgressList(mockData);
    } catch (error) {
      message.error("获取进度数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加进度事项
  const handleAddProgress = async (values: ProgressFormValues) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newProgress: ProgressItem = {
        id: Date.now().toString(),
        item: values.progressType === "其他" ? (values.customContent || "") : values.progressType,
        plannedDate: values.plannedDate.format("YYYY-MM-DD"),
        actualDate: values.actualDate.format("YYYY-MM-DD"),
      };
      
      setProgressList([...progressList, newProgress]);
      form.resetFields();
      setShowCustomContent(false);
      message.success("进度事项添加成功");
    } catch (error) {
      message.error("添加进度事项失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理进度类型变化
  const handleProgressTypeChange = (value: string) => {
    setShowCustomContent(value === "其他");
    if (value !== "其他") {
      form.setFieldsValue({ customContent: undefined });
    }
  };

  // 表格列定义
  const columns: ColumnsType<ProgressItem> = [
    {
      title: "事项",
      dataIndex: "item",
      key: "item",
      width: 120,
    },
    {
      title: "计划日期",
      dataIndex: "plannedDate",
      key: "plannedDate",
      width: 120,
    },
    {
      title: "实际日期",
      dataIndex: "actualDate",
      key: "actualDate",
      width: 120,
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    if (visible) {
      fetchProgressData();
    }
  }, [visible]);

  // 关闭弹窗时重置表单
  const handleCancel = () => {
    form.resetFields();
    setShowCustomContent(false);
    onCancel();
  };

  return (
    <Modal
      title="进度过程"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 24 }}>
        <Card title="进度详情" size="small">
          <Table
            columns={columns}
            dataSource={progressList}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      <Card title="添加进度" size="small">
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddProgress}
        >
          <Form.Item
            label="进度类型"
            name="progressType"
            rules={[{ required: true, message: "请选择进度类型" }]}
          >
            <Select
              placeholder="请选择进度类型"
              onChange={handleProgressTypeChange}
            >
              {progressTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {showCustomContent && (
            <Form.Item
              label="进度内容"
              name="customContent"
              rules={[{ required: true, message: "请填写进度内容" }]}
            >
              <TextArea
                placeholder="请填写具体的进度内容"
                rows={3}
              />
            </Form.Item>
          )}

          <Form.Item
            label="计划日期"
            name="plannedDate"
            rules={[{ required: true, message: "请选择计划日期" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="请选择计划日期"
            />
          </Form.Item>

          <Form.Item
            label="实际日期"
            name="actualDate"
            rules={[{ required: true, message: "请选择实际日期" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="请选择实际日期"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认
              </Button>
              <Button onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default UpdateProgressModal;