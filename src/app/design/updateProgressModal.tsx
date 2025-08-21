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
import "dayjs/locale/zh-cn";

// 确保客户端也设置中文语言
dayjs.locale("zh-cn");

const { Option } = Select;
const { TextArea } = Input;

interface ProgressItem {
  id: string;
  item: string;
  plannedDate: string;
  actualDate: string;
  note: string;
}

interface ProgressFormValues {
  progressType: string;
  customContent?: string;
  plannedDate: dayjs.Dayjs;
  actualDate?: dayjs.Dayjs;
  note?: string;
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
  const progressTypes = ["量尺", "初稿", "报价", "打款", "下单","延期","暂停","等硬装","客户待打款","待客户确认", "其他"];
 
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
          note: "这是个备注1这是个备注1这是个备注1这是个备注1",
        },
        {
          id: "2",
          item: "初稿",
          plannedDate: "2025-06-02",
          actualDate: "2025-06-02",
          note: "这是个备注2",
        },
        {
          id: "3",
          item: "下单",
          plannedDate: "2025-06-03",
          actualDate: "2025-06-05",
          note: "",
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
        item:
          values.progressType === "其他"
            ? values.customContent || ""
            : values.progressType,
        plannedDate: values.plannedDate.format("YYYY-MM-DD"),
        actualDate: values.actualDate
          ? values.actualDate.format("YYYY-MM-DD")
          : "",
        note: values.note || "",
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

  // 编辑状态管理
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<dayjs.Dayjs | null>(null);
  const [tempNote, setTempNote] = useState<string>("");

  // 处理编辑实际日期
  const handleEditActualDate = (record: ProgressItem) => {
    setEditingId(record.id);
    setTempDate(record.actualDate ? dayjs(record.actualDate) : null);
    setTempNote(record.note || "");
  };

  // 保存实际日期
  const handleSaveActualDate = () => {
    if (editingId) {
      setProgressList((prevList) =>
        prevList.map((item) =>
          item.id === editingId
            ? {
                ...item,
                actualDate: tempDate ? tempDate.format("YYYY-MM-DD") : "",
                note: tempNote,
              }
            : item
        )
      );
      setEditingId(null);
      setTempDate(null);
      setTempNote("");
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setTempDate(null);
    setTempNote("");
  };

  // 表格列定义
  const columns: ColumnsType<ProgressItem> = [
    {
      title: "过程",
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
      width: 150,
      render: (text: string, record: ProgressItem) => {
        if (editingId === record.id) {
          return (
            <DatePicker
              value={tempDate}
              onChange={setTempDate}
              format="YYYY-MM-DD"
              size="small"
              placeholder="选择日期"
              style={{ width: "100%" }}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "备注",
      dataIndex: "note",
      key: "note",
      width: 120,
      render: (text: string, record: ProgressItem) => {
        if (editingId === record.id) {
          return (
            <Input.TextArea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              size="small"
              placeholder="请输入备注"
              style={{ width: "100%" }}
              rows={2}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (text: string, record: ProgressItem) => {
        if (editingId === record.id) {
          return (
            <div style={{ display: "flex", gap: "4px" }}>
              <Button
                type="primary"
                size="small"
                onClick={handleSaveActualDate}
              >
                保存
              </Button>
              <Button size="small" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          );
        }
        return (
          <Button
            type="link"
            size="small"
            disabled={record.item === "下单"}
            onClick={() => handleEditActualDate(record)}
          >
            编辑
          </Button>
        );
      },
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
      title="设计进度"
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
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddProgress}
        >
          <Form.Item
            label="进度事项"
            name="progressType"
            rules={[{ required: true, message: "请选择进度事项" }]}
          >
            <Select
              placeholder="请选择进度事项"
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
              <TextArea placeholder="请填写具体的进度内容" rows={3} />
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

          <Form.Item label="实际日期" name="actualDate">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="请选择实际日期"
            />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea
              style={{ width: "100%" }}
              placeholder="请输入备注"
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={handleCancel}>取消</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default UpdateProgressModal;
