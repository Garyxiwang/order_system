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
import type { SplitOrder } from "../../services/splitApi";

const { TextArea } = Input;

interface SplitOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: SplitFormValues) => void;
  orderData: SplitOrder | null;
}

export interface SplitFormValues {
  // 木门/柜体相关
  doorSplitDate: string;
  doorFixedDate: string;
  cabinetSplitDate: string;
  cabinetFixedDate: string;

  // 其他项目相关
  stoneSplitDate: string;
  stoneFixedDate: string;
  boardSplitDate: string;
  boardFixedDate: string;
  aluminumSplitDate: string;
  aluminumFixedDate: string;

  remarks: string;
}

const SplitOrderModal: React.FC<SplitOrderModalProps> = ({
  visible,
  onCancel,
  onOk,
  orderData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderData) {
      form.setFieldsValue({
        doorSplitDate: undefined,
        doorFixedDate: orderData.fixedTime
          ? dayjs(orderData.fixedTime)
          : undefined,
        cabinetSplitDate: undefined,
        cabinetFixedDate: orderData.fixedTime
          ? dayjs(orderData.fixedTime)
          : undefined,
        stoneSplitDate: undefined,
        stoneFixedDate: undefined,
        boardSplitDate: undefined,
        boardFixedDate: undefined,
        aluminumSplitDate: undefined,
        aluminumFixedDate: undefined,
        remarks: orderData.remark || "",
      });
    }
  }, [orderData, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log("拆单数据:", values);
      onOk(values);
      message.success("拆单操作成功！");
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

  if (!orderData) {
    return null;
  }

  return (
    <Modal
      title="拆单操作"
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
          title="基本信息"
          bordered
          column={2}
          size="small"
          items={[
            {
              key: "designNumber",
              label: "订单编号",
              children: orderData.designNumber || "-",
            },
            {
              key: "customerName",
              label: "客户名称",
              children: orderData.customerName || "-",
            },
            {
              key: "address",
              label: "地址",
              children: orderData.address || "-",
            },
            {
              key: "designer",
              label: "设计师",
              children: orderData.designer || "-",
            },
            {
              key: "salesPerson",
              label: "销售员",
              children: orderData.salesPerson || "-",
            },
            {
              key: "createTime",
              label: "下单日期",
              children: orderData.createTime || "-",
            },
          ]}
        />
      </div>

      {/* 拆单操作表单区域 */}
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
                label="拆单日期"
                name="doorSplitDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="定板日期"
                name="doorFixedDate"
                style={{ marginBottom: 0 }}
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
                label="拆单日期"
                name="cabinetSplitDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="定板日期"
                name="cabinetFixedDate"
                style={{ marginBottom: 0 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* 石材和板材 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="石材" size="small" style={{ height: "100%" }}>
              <Form.Item
                label="拆单日期"
                name="stoneSplitDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="定板日期"
                name="stoneFixedDate"
                style={{ marginBottom: 0 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="板材" size="small" style={{ height: "100%" }}>
              <Form.Item
                label="拆单日期"
                name="boardSplitDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="定板日期"
                name="boardFixedDate"
                style={{ marginBottom: 0 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* 铝合金门 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="铝合金门" size="small">
              <Form.Item
                label="拆单日期"
                name="aluminumSplitDate"
                style={{ marginBottom: 12 }}
              >
                <DatePicker
                  placeholder="请选择日期"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="定板日期"
                name="aluminumFixedDate"
                style={{ marginBottom: 0 }}
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

export default SplitOrderModal;
