"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Form,
  Input,
  DatePicker,
  Button,
  Space,
  message,
  Card,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import styles from "./afterSalesModal.module.css";

const { TextArea } = Input;

interface FollowUpItem {
  id: string;
  follow_up_date: string;
  content: string;
  created_at?: string;
}

interface FollowUpFormValues {
  follow_up_date: dayjs.Dayjs;
  content: string;
}

interface FollowUpModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  onSuccess?: () => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [followUpList, setFollowUpList] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState<string>("");
  const [tempDate, setTempDate] = useState<dayjs.Dayjs | null>(null);

  // 获取回访情况数据（模拟数据）
  const fetchFollowUpData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟数据
      const mockData: FollowUpItem[] = [
        {
          id: "1",
          follow_up_date: "2024-01-25",
          content: "客户满意，无问题",
          created_at: "2024-01-25 10:00:00",
        },
      ];

      setFollowUpList(mockData);
    } catch (error) {
      message.error("获取回访情况失败");
      setFollowUpList([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加回访情况
  const handleAddFollowUp = async (values: FollowUpFormValues) => {
    if (!orderNumber) {
      message.error("订单编号不能为空");
      return;
    }

    setLoading(true);
    try {
      const followUpData = {
        order_number: orderNumber,
        follow_up_date: values.follow_up_date.format("YYYY-MM-DD"),
        content: values.content,
      };

      const newFollowUp: FollowUpItem = {
        id: Date.now().toString(),
        follow_up_date: followUpData.follow_up_date,
        content: followUpData.content,
        created_at: new Date().toISOString(),
      };

      setFollowUpList([newFollowUp, ...followUpList]);
      message.success("回访情况添加成功");
      form.resetFields();
    } catch (error) {
      console.error("添加回访情况失败:", error);
      message.error("添加回访情况失败");
    } finally {
      setLoading(false);
    }
  };

  // 编辑回访情况
  const handleEditFollowUp = (record: FollowUpItem) => {
    setEditingId(record.id);
    setTempContent(record.content);
    if (record.follow_up_date) {
      const date = dayjs(record.follow_up_date);
      setTempDate(date.isValid() ? date : null);
    } else {
      setTempDate(null);
    }
  };

  // 保存回访情况更新
  const handleSaveFollowUp = async () => {
    if (!editingId || !orderNumber) return;

    setLoading(true);
    try {
      const currentItem = followUpList.find((item) => item.id === editingId);
      if (!currentItem) return;

      const updateData = {
        follow_up_date: tempDate
          ? tempDate.format("YYYY-MM-DD")
          : currentItem.follow_up_date,
        content: tempContent,
      };

      setFollowUpList(
        followUpList.map((item) =>
          item.id === editingId ? { ...item, ...updateData } : item
        )
      );
      message.success("回访情况更新成功");
      setEditingId(null);
      setTempContent("");
      setTempDate(null);
    } catch (error) {
      console.error("保存回访情况失败:", error);
      message.error("保存回访情况失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除回访情况
  const handleDeleteFollowUp = async (record: FollowUpItem) => {
    Modal.confirm({
      title: "确认删除该回访情况？",
      content: `日期：${record.follow_up_date}`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        setLoading(true);
        try {
          setFollowUpList(
            followUpList.filter((item) => item.id !== record.id)
          );
          message.success("删除成功");
        } catch (error) {
          console.error("删除回访情况失败:", error);
          message.error("删除回访情况失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setTempContent("");
    setTempDate(null);
  };

  // 表格列定义
  const columns: ColumnsType<FollowUpItem> = [
    {
      title: "日期",
      dataIndex: "follow_up_date",
      key: "follow_up_date",
      width: 150,
      render: (text: string, record: FollowUpItem) => {
        if (editingId === record.id) {
          return (
            <DatePicker
              value={tempDate}
              onChange={setTempDate}
              format="YYYY-MM-DD"
              size="small"
              placeholder="选择日期"
              className={styles.fullWidth}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "回访内容",
      dataIndex: "content",
      key: "content",
      render: (text: string, record: FollowUpItem) => {
        if (editingId === record.id) {
          return (
            <TextArea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              size="small"
              placeholder="请输入回访内容"
              className={styles.fullWidth}
              rows={3}
            />
          );
        }
        return (
          <div
            style={{
              maxWidth: "400px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {text || "-"}
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: unknown, record: FollowUpItem) => {
        if (editingId === record.id) {
          return (
            <div className={styles.buttonContainer}>
              <Button type="primary" size="small" onClick={handleSaveFollowUp}>
                保存
              </Button>
              <Button size="small" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          );
        }
        return (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => handleEditFollowUp(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleDeleteFollowUp(record)}
              danger
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    if (visible && orderNumber) {
      fetchFollowUpData();
    }
  }, [visible, orderNumber]);

  // 关闭弹窗时重置表单
  const handleCancel = () => {
    form.resetFields();
    setEditingId(null);
    setTempContent("");
    setTempDate(null);
    onCancel();
  };

  return (
    <Modal
      title="回访情况"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <div className={styles.bottomMargin}>
        <Card title="回访详情" size="small">
          <Table
            columns={columns}
            dataSource={followUpList}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      <Card title="添加回访" size="small">
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddFollowUp}
        >
          <Form.Item
            label="日期"
            name="follow_up_date"
            rules={[{ required: true, message: "请选择日期" }]}
          >
            <DatePicker
              className={styles.fullWidth}
              placeholder="请选择日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="回访内容"
            name="content"
            rules={[{ required: true, message: "请输入回访内容" }]}
          >
            <TextArea
              className={styles.fullWidth}
              placeholder="请输入回访情况内容"
              rows={4}
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4, span: 18 }}>
            <div className={styles.rightAlign}>
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

export default FollowUpModal;

