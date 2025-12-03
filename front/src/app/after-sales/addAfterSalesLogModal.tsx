"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Space,
  message,
  Select,
  Checkbox,
} from "antd";
import dayjs from "dayjs";
import styles from "./afterSalesModal.module.css";

const { TextArea } = Input;
const { Option } = Select;

// 导出mock存储，供afterSalesLogModal使用
export const mockLogsStorage: Record<string, Array<{
  id: string;
  log_date: string;
  content: string;
  feedback_person?: string;
  is_processed?: boolean;
  responsible_person?: string;
  created_at?: string;
}>> = {};

interface AfterSalesLogFormValues {
  log_date: dayjs.Dayjs;
  content: string;
  feedback_person?: string;
  is_processed?: boolean;
  responsible_person?: string;
}

interface AddAfterSalesLogModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  orderNumber: string;
}

const AddAfterSalesLogModal: React.FC<AddAfterSalesLogModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  orderNumber,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 添加售后日志
  const handleSubmit = async (values: AfterSalesLogFormValues) => {
    if (!orderNumber) {
      message.error("订单编号不能为空");
      return;
    }

    setLoading(true);
    try {
      const logData = {
        order_number: orderNumber,
        log_date: values.log_date.format("YYYY-MM-DD"),
        content: values.content,
        feedback_person: values.feedback_person,
        is_processed: values.is_processed || false,
        responsible_person: values.responsible_person,
      };

      // 保存到mock存储
      if (!mockLogsStorage[orderNumber]) {
        mockLogsStorage[orderNumber] = [];
      }
      const newLog = {
        id: Date.now().toString(),
        log_date: logData.log_date,
        content: logData.content,
        feedback_person: logData.feedback_person,
        is_processed: logData.is_processed,
        responsible_person: logData.responsible_person,
        created_at: new Date().toISOString(),
      };
      mockLogsStorage[orderNumber].push(newLog);

      message.success("售后日志添加成功");
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error("添加售后日志失败:", error);
      message.error("添加售后日志失败");
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗时重置表单
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="添加售后日志"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
    >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        onFinish={handleSubmit}
        initialValues={{
          is_processed: false,
        }}
      >
        <Form.Item
          label="日期"
          name="log_date"
          rules={[{ required: true, message: "请选择日期" }]}
        >
          <DatePicker
            className={styles.fullWidth}
            placeholder="请选择日期"
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item label="反馈人" name="feedback_person">
          <Input
            className={styles.fullWidth}
            placeholder="请输入反馈人"
          />
        </Form.Item>

        <Form.Item
          label="问题描述"
          name="content"
          rules={[{ required: true, message: "请输入问题描述" }]}
        >
          <TextArea
            className={styles.fullWidth}
            placeholder="请输入问题描述"
            rows={3}
          />
        </Form.Item>

        <Form.Item label="是否处理" name="is_processed">
          <Select
            className={styles.fullWidth}
            placeholder="请选择"
          >
            <Option value={true}>已处理</Option>
            <Option value={false}>未处理</Option>
          </Select>
        </Form.Item>

        <Form.Item label="责任人" name="responsible_person">
          <Input
            className={styles.fullWidth}
            placeholder="请输入责任人"
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
    </Modal>
  );
};

export default AddAfterSalesLogModal;

