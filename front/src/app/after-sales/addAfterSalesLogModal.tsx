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

interface AfterSalesLogFormValues {
  log_date: dayjs.Dayjs;
  content: string;
  feedback_person?: string;
  is_processed?: boolean;
  has_beauty?: boolean;
  beauty_processed?: boolean;
  after_sales_type?: string;
  modification_details?: string;
  modification_reason?: string;
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
  const [afterSalesType, setAfterSalesType] = useState<string>("");

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
        has_beauty: values.has_beauty || false,
        beauty_processed: values.beauty_processed || false,
        after_sales_type: values.after_sales_type,
        modification_details: values.modification_details,
        modification_reason: values.modification_reason,
        responsible_person: values.responsible_person,
      };

      // 模拟数据 - 实际应该调用API
      // const response = await createAfterSalesLog(logData);
      // if (response.code === 200) {
      //   message.success("售后日志添加成功");
      //   form.resetFields();
      //   setAfterSalesType("");
      //   onSuccess();
      // } else {
      //   message.error(response.message || "添加失败");
      // }

      message.success("售后日志添加成功");
      form.resetFields();
      setAfterSalesType("");
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
    setAfterSalesType("");
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
          has_beauty: false,
          beauty_processed: false,
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
          label="售后类型"
          name="after_sales_type"
          rules={[{ required: true, message: "请选择售后类型" }]}
        >
          <Select
            className={styles.fullWidth}
            placeholder="请选择售后类型"
            onChange={(value) => setAfterSalesType(value)}
          >
            <Option value="问题单">问题单</Option>
            <Option value="裁撤单">裁撤单</Option>
          </Select>
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

        <Form.Item label="是否处理" name="is_processed" valuePropName="checked">
          <Checkbox>是</Checkbox>
        </Form.Item>

        <Form.Item label="是否有美容" name="has_beauty" valuePropName="checked">
          <Checkbox
            onChange={(e) => {
              if (!e.target.checked) {
                form.setFieldsValue({ beauty_processed: false });
              }
            }}
          >
            是
          </Checkbox>
        </Form.Item>

        <Form.Item
          label="美容是否处理"
          name="beauty_processed"
          valuePropName="checked"
        >
          <Checkbox disabled={!form.getFieldValue("has_beauty")}>
            是
          </Checkbox>
        </Form.Item>

        {afterSalesType === "裁撤单" && (
          <>
            <Form.Item
              label="裁改明细"
              name="modification_details"
              rules={[
                {
                  required: true,
                  message: "请输入裁改明细",
                },
              ]}
            >
              <TextArea
                className={styles.fullWidth}
                placeholder="请输入裁改明细"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              label="裁改原因"
              name="modification_reason"
              rules={[
                {
                  required: true,
                  message: "请输入裁改原因",
                },
              ]}
            >
              <TextArea
                className={styles.fullWidth}
                placeholder="请输入裁改原因"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              label="责任人"
              name="responsible_person"
              rules={[
                {
                  required: true,
                  message: "请输入责任人",
                },
              ]}
            >
              <Input
                className={styles.fullWidth}
                placeholder="请输入责任人"
              />
            </Form.Item>
          </>
        )}

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

