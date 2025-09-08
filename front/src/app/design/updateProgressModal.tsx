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
import styles from "./updateProgressModal.module.css";
import {
  createProgress,
  getProgressByOrderId,
  updateProgress,
  type ProgressData,
} from "../../services/progressService";

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
  const progressTypes = [
    "量尺",
    "初稿",
    "报价",
    "打款",
    "延期",
    "暂停",
    "等硬装",
    "客户待打款",
    "待客户确认",
    "下单",
    "其他",
  ];

  // 获取进度数据
  const fetchProgressData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      console.log("开始获取进度数据，订单号:", orderNumber);
      const response = await getProgressByOrderId(orderNumber);

      if (
        response.code === 200 &&
        response?.data?.items &&
        Array.isArray(response.data.items)
      ) {
        // 将API数据转换为表格数据格式
        const progressData: ProgressItem[] = response.data.items.map(
          (item: ProgressData, index: number) => ({
            id: item.id?.toString() || (index + 1).toString(),
            item: item.task_item,
            plannedDate: item.planned_date || "-",
            actualDate: item.actual_date || "-",
            note: item.remarks || "",
          })
        );
        setProgressList(progressData);
      } else {
        message.warning(response.message || "暂无进度数据");
        setProgressList([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      message.error(`获取进度数据失败: ${errorMessage}`);
      setProgressList([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加进度事项
  const handleAddProgress = async (values: ProgressFormValues) => {
    if (!orderNumber) {
      message.error("订单编号不能为空");
      return;
    }

    setLoading(true);
    try {
      const progressType =
        values.progressType === "其他"
          ? values.customContent
          : values.progressType;
      const plannedDate = values.plannedDate.format("YYYY-MM-DD");
      const actualDate = values.actualDate
        ? values.actualDate.format("YYYY-MM-DD")
        : undefined;

      const progressData: Omit<
        ProgressData,
        "id" | "created_at" | "updated_at"
      > = {
        task_item: progressType!,
        planned_date: plannedDate,
        actual_date: actualDate,
        remarks: values.note || "",
        order_id: orderNumber,
      };

      const response = await createProgress(
        progressData as Omit<ProgressData, "id" | "created_at" | "updated_at">
      );

      if (response.code === 200) {
        message.success("进度事项添加成功");
        form.resetFields();
        setShowCustomContent(false);
        // 重新获取进度数据
        await fetchProgressData();
      } else {
        message.error(response.message || "添加进度事项失败");
      }
    } catch (error) {
      console.error("添加进度事项失败:", error);
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
    // 验证日期有效性，避免显示Invalid Date
    if (record.actualDate && record.actualDate !== 'Invalid Date') {
      const date = dayjs(record.actualDate);
      setTempDate(date.isValid() ? date : null);
    } else {
      setTempDate(null);
    }
    setTempNote(record.note || "");
  };

  // 保存实际日期
  const handleSaveActualDate = async () => {
    if (!editingId || !orderNumber) return;

    setLoading(true);
    try {
      const currentItem = progressList.find((item) => item.id === editingId);
      if (!currentItem) return;

      const actualDate = tempDate ? tempDate.format("YYYY-MM-DD") : undefined;
      const updateData: Partial<ProgressData> = {
        actual_date: actualDate,
        remarks: tempNote,
      };

      // 找到对应的进度记录ID
      const progressId = parseInt(currentItem.id);
      const updateResponse = await updateProgress(progressId, updateData);

      if (updateResponse.code === 200) {
        message.success("进度更新成功");
        // 重新获取进度数据
        await fetchProgressData();
      } else {
        message.error(updateResponse.message || "进度更新失败");
      }

      setEditingId(null);
      setTempDate(null);
      setTempNote("");
    } catch (error) {
      console.error("保存进度失败:", error);
      message.error("保存进度失败");
    } finally {
      setLoading(false);
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
              className={styles.fullWidth}
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
              className={styles.fullWidth}
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
            <div className={styles.buttonContainer}>
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
    if (visible && orderNumber) {
      fetchProgressData();
    }
  }, [visible, orderNumber]);

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
      <div className={styles.bottomMargin}>
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
              className={styles.fullWidth}
              placeholder="请选择计划日期"
            />
          </Form.Item>

          {/* <Form.Item label="实际日期" name="actualDate">
            <DatePicker
              className={styles.fullWidth}
              placeholder="请选择实际日期"
            />
          </Form.Item> */}
          <Form.Item label="备注" name="note">
            <Input.TextArea
              className={styles.fullWidth}
              placeholder="请输入备注"
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
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

export default UpdateProgressModal;
