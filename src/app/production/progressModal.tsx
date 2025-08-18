"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Descriptions,
  Card,
} from "antd";
import dayjs from "dayjs";
import type { ProductionOrder } from "../../services/productionApi";

interface ProgressModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
  onOk: (values: Partial<ProductionOrder>) => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  order,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && order) {
      form.setFieldsValue({
        // 木门相关
        doorExpectedMaterialDate: order.expectedMaterialDate
          ? dayjs(order.expectedMaterialDate)
          : null,
        doorActualMaterialStatus: order.actualMaterialStatus,
        doorCuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,
        doorWarehouseDate: order.warehouseDate
          ? dayjs(order.warehouseDate)
          : null,

        // 柜体相关
        cabinetExpectedMaterialDate: order.expectedMaterialDate
          ? dayjs(order.expectedMaterialDate)
          : null,
        cabinetActualMaterialStatus: order.actualMaterialStatus,
        cabinetBoard18: order.board18,
        cabinetBoard09: order.board09,
        cabinetCuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,
        cabinetWarehouseDate: order.warehouseDate
          ? dayjs(order.warehouseDate)
          : null,
      });
    }
  }, [visible, order, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formattedValues = {
        expectedMaterialDate:
          values.doorExpectedMaterialDate || values.cabinetExpectedMaterialDate
            ? (
                values.doorExpectedMaterialDate ||
                values.cabinetExpectedMaterialDate
              ).format("YYYY-MM-DD")
            : null,
        actualMaterialStatus:
          values.doorActualMaterialStatus || values.cabinetActualMaterialStatus,
        board18: values.cabinetBoard18,
        board09: values.cabinetBoard09,
        cuttingDate:
          values.doorCuttingDate || values.cabinetCuttingDate
            ? (values.doorCuttingDate || values.cabinetCuttingDate).format(
                "YYYY-MM-DD"
              )
            : null,
        warehouseDate:
          values.doorWarehouseDate || values.cabinetWarehouseDate
            ? (values.doorWarehouseDate || values.cabinetWarehouseDate).format(
                "YYYY-MM-DD"
              )
            : null,
      };
      onOk(formattedValues);
      message.success("材料状态更新成功！");
    } catch (error) {
      console.error("表单验证失败:", error);
      message.error("请检查表单数据！");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!order) {
    return null;
  }

  return (
    <Modal
      title="材料状态更新"
      open={visible}
      onCancel={handleCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="ok" type="primary" loading={loading} onClick={handleOk}>
          确认
        </Button>,
      ]}
    >
      {/* 只读订单信息区域 */}
      <div
        style={{
          marginBottom: 24,
          padding: "16px",
          background: "#fafafa",
          borderRadius: "6px",
          border: "1px solid #e8e8e8",
        }}
      >
        <Descriptions
          title="订单信息"
          bordered
          column={2}
          size="small"
          items={[
            {
              key: "orderCode",
              label: "订单编码",
              children: order.orderCode || "-",
            },
            {
              key: "customerName",
              label: "客户名称",
              children: order.customerName || "-",
            },
            {
              key: "deliveryAddress",
              label: "发货地址",
              children: order.deliveryAddress || "-",
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: order.isInstallation ? "是" : "否",
            },
          ]}
        />
      </div>

      {/* 材料状态表单区域 */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        {/* 木门和柜体 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="木门" size="small" style={{ height: "100%" }}>
              <Form.Item
                label="预计日期"
                name="doorExpectedMaterialDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="实际日期"
                name="doorCuttingDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="柜体" size="small" style={{ height: "100%" }}>
              <Form.Item
                label="预计日期"
                name="doorExpectedMaterialDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="实际日期"
                name="doorCuttingDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ProgressModal;
