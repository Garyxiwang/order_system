"use client";

import React, { useState, useEffect } from "react";
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
import { updateAfterSalesOrder, type AfterSalesOrder } from "../../services/afterSalesApi";

const { TextArea } = Input;

interface EditReorderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  reorderOrder: AfterSalesOrder; // 要编辑的补单订单
}

const EditReorderModal: React.FC<EditReorderModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  reorderOrder,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  // 解析补单信息
  const parseReorderInfo = (details: string) => {
    const lines = details.split("\n");
    let reorderDetails = "";
    let expectedDeliveryDate = "";
    let expectedMaterialDate = "";
    let actualDeliveryDate = "";
    let files = "";

    lines.forEach((line) => {
      if (line.startsWith("补单明细：")) {
        reorderDetails = line.replace("补单明细：", "");
      } else if (line.startsWith("预计发货时间：")) {
        expectedDeliveryDate = line.replace("预计发货时间：", "").replace("未设置", "");
      } else if (line.startsWith("预计齐料时间：")) {
        expectedMaterialDate = line.replace("预计齐料时间：", "").replace("未设置", "");
      } else if (line.startsWith("实际出货时间：")) {
        actualDeliveryDate = line.replace("实际出货时间：", "").replace("未设置", "");
      } else if (line.startsWith("附件：")) {
        files = line.replace("附件：", "").replace("无", "");
      }
    });

    return {
      reorderDetails,
      expectedDeliveryDate,
      expectedMaterialDate,
      actualDeliveryDate,
      files,
    };
  };

  useEffect(() => {
    if (visible && reorderOrder) {
      // 解析现有数据
      const details = reorderOrder.external_purchase_details || "";
      const parsed = parseReorderInfo(details);

      // 设置表单值
      form.setFieldsValue({
        reorder_details: parsed.reorderDetails,
        expected_delivery_date: parsed.expectedDeliveryDate
          ? dayjs(parsed.expectedDeliveryDate)
          : reorderOrder.delivery_date
          ? dayjs(reorderOrder.delivery_date)
          : undefined,
        expected_material_date: parsed.expectedMaterialDate
          ? dayjs(parsed.expectedMaterialDate)
          : undefined,
        actual_delivery_date: parsed.actualDeliveryDate
          ? dayjs(parsed.actualDeliveryDate)
          : reorderOrder.installation_date
          ? dayjs(reorderOrder.installation_date)
          : undefined,
      });

      // 设置文件列表（如果有附件）
      if (parsed.files) {
        const fileNames = parsed.files.split(", ").filter((f) => f.trim());
        const initialFiles: UploadFile[] = fileNames.map((fileName, index) => ({
          uid: `existing-${index}`,
          name: fileName,
          status: "done",
        }));
        setFileList(initialFiles);
      } else {
        setFileList([]);
      }
    }
  }, [visible, reorderOrder, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!reorderOrder.id) {
        message.error("补单ID不存在");
        return;
      }

      setLoading(true);

      // 处理文件列表
      const fileNames = fileList.map((file) => file.name).join(", ");
      const reorderInfo = `补单明细：${values.reorder_details || ""}\n预计发货时间：${values.expected_delivery_date ? values.expected_delivery_date.format("YYYY-MM-DD") : "未设置"}\n预计齐料时间：${values.expected_material_date ? values.expected_material_date.format("YYYY-MM-DD") : "未设置"}\n实际出货时间：${values.actual_delivery_date ? values.actual_delivery_date.format("YYYY-MM-DD") : "未设置"}\n附件：${fileNames || "无"}`;

      // 更新补单
      const response = await updateAfterSalesOrder(reorderOrder.id.toString(), {
        external_purchase_details: reorderInfo,
        delivery_date: values.expected_delivery_date
          ? values.expected_delivery_date.format("YYYY-MM-DD")
          : undefined,
        installation_date: values.actual_delivery_date
          ? values.actual_delivery_date.format("YYYY-MM-DD")
          : undefined,
      });

      if (response.code === 200) {
        message.success("补单更新成功");
        form.resetFields();
        setFileList([]);
        onSuccess();
      } else {
        message.error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    } finally {
      setLoading(false);
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
      title="编辑补单"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
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
              支持上传多个文件，单个文件不超过10MB。可以重新上传替换现有附件
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

export default EditReorderModal;

