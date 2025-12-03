"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  message,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import styles from "./afterSalesModal.module.css";

const { TextArea } = Input;

interface CreateReorderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: {
    reorderNumber: string;
    reorderDetails: string;
    files: UploadFile[];
    expectedDeliveryDate?: string;
    expectedMaterialDate?: string;
    actualDeliveryDate?: string;
  }) => void;
  afterSalesDate?: string; // 售后时间，用于计算默认预计发货时间
  originalOrderNumber?: string; // 原订单编号，用于生成补单编号
}

const CreateReorderModal: React.FC<CreateReorderModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  afterSalesDate,
  originalOrderNumber,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 生成默认补单编号
  const generateReorderNumber = useCallback((): string => {
    if (originalOrderNumber) {
      return `${originalOrderNumber}-补${Date.now().toString().slice(-6)}`;
    }
    return `补单-${Date.now().toString().slice(-8)}`;
  }, [originalOrderNumber]);

  // 计算默认预计发货时间（售后时间后3天）
  const getDefaultExpectedDeliveryDate = useCallback((): Dayjs | null => {
    if (afterSalesDate) {
      const date = dayjs(afterSalesDate);
      if (date.isValid()) {
        return date.add(3, "day");
      }
    }
    // 如果没有售后时间，使用当前时间后3天
    return dayjs().add(3, "day");
  }, [afterSalesDate]);

  useEffect(() => {
    if (visible) {
      // 重置表单和文件列表
      form.resetFields();
      setFileList([]);
      
      // 生成并设置默认补单编号
      const defaultReorderNumber = generateReorderNumber();
      
      // 设置默认预计发货时间
      const defaultDate = getDefaultExpectedDeliveryDate();
      
      form.setFieldsValue({
        reorder_number: defaultReorderNumber,
        expected_delivery_date: defaultDate,
      });
    }
  }, [visible, afterSalesDate, originalOrderNumber, form, generateReorderNumber, getDefaultExpectedDeliveryDate]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = {
        reorderNumber: values.reorder_number || generateReorderNumber(),
        reorderDetails: values.reorder_details || "",
        files: fileList,
        expectedDeliveryDate: values.expected_delivery_date
          ? values.expected_delivery_date.format("YYYY-MM-DD")
          : undefined,
        expectedMaterialDate: values.expected_material_date
          ? values.expected_material_date.format("YYYY-MM-DD")
          : undefined,
        actualDeliveryDate: values.actual_delivery_date
          ? values.actual_delivery_date.format("YYYY-MM-DD")
          : undefined,
      };

      onSuccess(formData);
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  // 文件上传前的处理
  const beforeUpload = (file: File) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("文件大小不能超过10MB");
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  };

  // 文件变化处理
  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  // 删除文件
  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    return true;
  };

  return (
    <Modal
      title="创建补单"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          确认
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Form.Item
          label="补单编号"
          name="reorder_number"
          rules={[{ required: true, message: "请输入补单编号" }]}
        >
          <Input
            className={styles.fullWidth}
            placeholder="补单编号（自动生成，可修改）"
          />
        </Form.Item>

        <Form.Item
          label="补单明细"
          name="reorder_details"
          rules={[{ required: true, message: "请输入补单明细" }]}
        >
          <TextArea
            className={styles.fullWidth}
            placeholder="请输入补单明细"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="上传文件"
          name="files"
        >
          <Upload
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleFileChange}
            onRemove={handleRemove}
            multiple
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
            <span style={{ marginLeft: 8, color: "#999" }}>
              支持上传多个文件，单个文件不超过10MB
            </span>
          </Upload>
        </Form.Item>

        <Form.Item
          label="预计发货时间"
          name="expected_delivery_date"
          rules={[{ required: true, message: "请选择预计发货时间" }]}
        >
          <DatePicker
            className={styles.fullWidth}
            placeholder="请选择预计发货时间"
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          label="预计齐料时间"
          name="expected_material_date"
        >
          <DatePicker
            className={styles.fullWidth}
            placeholder="请选择预计齐料时间"
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          label="实际出货时间"
          name="actual_delivery_date"
        >
          <DatePicker
            className={styles.fullWidth}
            placeholder="请选择实际出货时间"
            format="YYYY-MM-DD"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateReorderModal;

