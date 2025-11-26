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

interface RemainingIssueItem {
  id: string;
  issue_date: string;
  content: string;
  status?: string;
  created_at?: string;
}

interface RemainingIssueFormValues {
  issue_date: dayjs.Dayjs;
  content: string;
  status?: string;
}

interface RemainingIssuesModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  onSuccess?: () => void;
}

const RemainingIssuesModal: React.FC<RemainingIssuesModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [issueList, setIssueList] = useState<RemainingIssueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState<string>("");
  const [tempDate, setTempDate] = useState<dayjs.Dayjs | null>(null);
  const [tempStatus, setTempStatus] = useState<string>("待处理");

  // 获取遗留问题数据（模拟数据）
  const fetchIssueData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟数据
      const mockData: RemainingIssueItem[] = [
        {
          id: "1",
          issue_date: "2024-01-15",
          content: "需要更换部分配件",
          status: "待处理",
          created_at: "2024-01-15 10:00:00",
        },
      ];

      setIssueList(mockData);
    } catch (error) {
      message.error("获取遗留问题失败");
      setIssueList([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加遗留问题
  const handleAddIssue = async (values: RemainingIssueFormValues) => {
    if (!orderNumber) {
      message.error("订单编号不能为空");
      return;
    }

    setLoading(true);
    try {
      const issueData = {
        order_number: orderNumber,
        issue_date: values.issue_date.format("YYYY-MM-DD"),
        content: values.content,
        status: values.status || "待处理",
      };

      const newIssue: RemainingIssueItem = {
        id: Date.now().toString(),
        issue_date: issueData.issue_date,
        content: issueData.content,
        status: issueData.status,
        created_at: new Date().toISOString(),
      };

      setIssueList([newIssue, ...issueList]);
      message.success("遗留问题添加成功");
      form.resetFields();
    } catch (error) {
      console.error("添加遗留问题失败:", error);
      message.error("添加遗留问题失败");
    } finally {
      setLoading(false);
    }
  };

  // 编辑问题
  const handleEditIssue = (record: RemainingIssueItem) => {
    setEditingId(record.id);
    setTempContent(record.content);
    setTempStatus(record.status || "待处理");
    if (record.issue_date) {
      const date = dayjs(record.issue_date);
      setTempDate(date.isValid() ? date : null);
    } else {
      setTempDate(null);
    }
  };

  // 保存问题更新
  const handleSaveIssue = async () => {
    if (!editingId || !orderNumber) return;

    setLoading(true);
    try {
      const currentItem = issueList.find((item) => item.id === editingId);
      if (!currentItem) return;

      const updateData = {
        issue_date: tempDate ? tempDate.format("YYYY-MM-DD") : currentItem.issue_date,
        content: tempContent,
        status: tempStatus,
      };

      setIssueList(
        issueList.map((item) =>
          item.id === editingId ? { ...item, ...updateData } : item
        )
      );
      message.success("遗留问题更新成功");
      setEditingId(null);
      setTempContent("");
      setTempDate(null);
      setTempStatus("待处理");
    } catch (error) {
      console.error("保存遗留问题失败:", error);
      message.error("保存遗留问题失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除问题
  const handleDeleteIssue = async (record: RemainingIssueItem) => {
    Modal.confirm({
      title: "确认删除该遗留问题？",
      content: `日期：${record.issue_date}`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        setLoading(true);
        try {
          setIssueList(issueList.filter((item) => item.id !== record.id));
          message.success("删除成功");
        } catch (error) {
          console.error("删除遗留问题失败:", error);
          message.error("删除遗留问题失败");
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
    setTempStatus("待处理");
  };

  // 表格列定义
  const columns: ColumnsType<RemainingIssueItem> = [
    {
      title: "日期",
      dataIndex: "issue_date",
      key: "issue_date",
      width: 150,
      render: (text: string, record: RemainingIssueItem) => {
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
      title: "问题内容",
      dataIndex: "content",
      key: "content",
      render: (text: string, record: RemainingIssueItem) => {
        if (editingId === record.id) {
          return (
            <TextArea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              size="small"
              placeholder="请输入问题内容"
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
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text: string, record: RemainingIssueItem) => {
        if (editingId === record.id) {
          return (
            <Input
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              size="small"
              placeholder="状态"
              className={styles.fullWidth}
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
      render: (_: unknown, record: RemainingIssueItem) => {
        if (editingId === record.id) {
          return (
            <div className={styles.buttonContainer}>
              <Button type="primary" size="small" onClick={handleSaveIssue}>
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
              onClick={() => handleEditIssue(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleDeleteIssue(record)}
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
      fetchIssueData();
    }
  }, [visible, orderNumber]);

  // 关闭弹窗时重置表单
  const handleCancel = () => {
    form.resetFields();
    setEditingId(null);
    setTempContent("");
    setTempDate(null);
    setTempStatus("待处理");
    onCancel();
  };

  return (
    <Modal
      title="遗留问题"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <div className={styles.bottomMargin}>
        <Card title="问题详情" size="small">
          <Table
            columns={columns}
            dataSource={issueList}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      <Card title="添加问题" size="small">
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddIssue}
        >
          <Form.Item
            label="日期"
            name="issue_date"
            rules={[{ required: true, message: "请选择日期" }]}
          >
            <DatePicker
              className={styles.fullWidth}
              placeholder="请选择日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="问题内容"
            name="content"
            rules={[{ required: true, message: "请输入问题内容" }]}
          >
            <TextArea
              className={styles.fullWidth}
              placeholder="请输入遗留问题内容"
              rows={4}
            />
          </Form.Item>

          <Form.Item label="状态" name="status" initialValue="待处理">
            <Input
              className={styles.fullWidth}
              placeholder="请输入状态"
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

export default RemainingIssuesModal;

