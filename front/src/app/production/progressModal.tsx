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
  modalType: 'progress' | 'purchase';
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  order,
  onCancel,
  onOk,
  modalType,
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
        doorCuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,

        // 柜体相关
        cabinetExpectedMaterialDate: order.expectedMaterialDate
          ? dayjs(order.expectedMaterialDate)
          : null,
        cabinetCuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,

        // 车间进度相关
        cuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,
        warehouseDate: order.warehouseDate ? dayjs(order.warehouseDate) : null,
        expectedShipmentDate: order.expectedShipmentDate ? dayjs(order.expectedShipmentDate) : null,
      });
    }
  }, [visible, order, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formattedValues = {
        // 采购状态相关
        doorExpectedMaterialDate: values.doorExpectedMaterialDate
          ? values.doorExpectedMaterialDate.format("YYYY-MM-DD")
          : null,
        doorCuttingDate: values.doorCuttingDate
          ? values.doorCuttingDate.format("YYYY-MM-DD")
          : null,
        cabinetExpectedMaterialDate: values.cabinetExpectedMaterialDate
          ? values.cabinetExpectedMaterialDate.format("YYYY-MM-DD")
          : null,
        cabinetCuttingDate: values.cabinetCuttingDate
          ? values.cabinetCuttingDate.format("YYYY-MM-DD")
          : null,
        // 车间进度相关
        cuttingDate: values.cuttingDate
          ? values.cuttingDate.format("YYYY-MM-DD")
          : null,
        warehouseDate: values.warehouseDate
          ? values.warehouseDate.format("YYYY-MM-DD")
          : null,
        expectedShipmentDate: values.expectedShipmentDate
          ? values.expectedShipmentDate.format("YYYY-MM-DD")
          : null,
      };
      onOk(formattedValues);
      message.success("生产进度更新成功！");
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
      title={modalType === 'progress' ? '生产进度更新' : '采购状态更新'}
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

      {/* 生产进度表单区域 */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        {/* 根据modalType显示不同内容 */}
        {modalType === 'purchase' && (
          <Card title="采购状态">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="木门" size="small" style={{ height: "100%" }}>
                  <Form.Item
                    label="预计齐料日期"
                    name="doorExpectedMaterialDate"
                    style={{ marginBottom: 12 }}
                  >
                    <DatePicker
                      placeholder="请选择日期"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="实际齐料日期"
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
                    label="预计齐料日期"
                    name="cabinetExpectedMaterialDate"
                    style={{ marginBottom: 12 }}
                  >
                    <DatePicker
                      placeholder="请选择日期"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="实际齐料日期"
                    name="cabinetCuttingDate"
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
          </Card>
        )}

        {modalType === 'progress' && (
          <Card title="车间进度">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="下料日期" name="cuttingDate">
                  <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="成品入库日期" name="warehouseDate">
                  <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="预计出货日期" name="expectedShipmentDate">
                  <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}
      </Form>
    </Modal>
  );
};

export default ProgressModal;
