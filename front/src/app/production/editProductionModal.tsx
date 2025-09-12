"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Row,
  Col,
  message,
  Descriptions,
} from "antd";
import dayjs from "dayjs";
import type { ProductionOrder } from "../../services/productionApi";

const { Option } = Select;
const { TextArea } = Input;

interface EditProductionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: Partial<ProductionOrder>) => void;
  orderData: ProductionOrder | null;
}

const EditProductionModal: React.FC<EditProductionModalProps> = ({
  visible,
  onCancel,
  onOk,
  orderData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 当模态框打开且有订单数据时，填充表单
  useEffect(() => {
    if (visible && orderData) {
      form.setFieldsValue({
        expectedDeliveryDate: orderData.expected_delivery_date
          ? dayjs(orderData.expected_delivery_date)
          : null,
        board18: orderData.board_18,
        board09: orderData.board_09,
        remarks: orderData.remarks,
        actualShipmentDate: orderData.actual_delivery_date
          ? dayjs(orderData.actual_delivery_date)
          : null,
      });
    }
  }, [visible, orderData, form]);

  // 处理确认
  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 转换日期格式和字段名称
      const formattedValues = {
        expected_delivery_date: values.expectedDeliveryDate
          ? values.expectedDeliveryDate.format("YYYY-MM-DD")
          : null,
        board_18: values.board18,
        board_09: values.board09,
        remarks: values.remarks,
        actual_delivery_date: values.actualShipmentDate
          ? values.actualShipmentDate.format("YYYY-MM-DD")
          : null,
      };

      onOk(formattedValues);
    } catch (error) {
      console.error("表单验证失败:", error);
      message.error("请检查表单数据！");
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!orderData) {
    return null;
  }

  return (
    <Modal
      title="编辑生产订单"
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
          title="订单基本信息"
          bordered
          column={2}
          size="small"
          items={[
            {
              key: "orderNumber",
              label: "订单编号",
              children: orderData.order_number,
            },
            {
              key: "customerName",
              label: "客户名称",
              children: orderData.customer_name,
            },
            {
              key: "address",
              label: "发货地址",
              children: orderData.address || "-",
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: orderData.is_installation ? "是" : "否",
            },
            {
              key: "customerPaymentDate",
              label: "客户打款日期",
              children: orderData.customer_payment_date || "-",
            },
            {
              key: "splitOrderDate",
              label: "拆单下单日期",
              children: orderData.split_order_date || "-",
            },
            {
              key: "orderDays",
              label: "下单天数",
              children: orderData.order_days ? `${orderData.order_days}天` : "-",
            },
            {
              key: "internalProduction",
              label: "厂内生产项",
              children: orderData.internal_production_items || "-",
            },
            {
              key: "externalPurchase",
              label: "外购项",
              children: orderData.external_purchase_items || "-",
              span: 2,
            },
          ]}
        />
      </div>

      {/* 可编辑表单区域 */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="18板" name="board18">
              <Input placeholder="请输入18板数量" addonAfter="张" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="09板" name="board09">
              <Input placeholder="请输入09板数量" addonAfter="张" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="预计交货日期"
              name="expectedDeliveryDate"
              rules={[{ required: true, message: "请选择预计交货日期" }]}
            >
              <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="实际出货日期" name="actualShipmentDate">
              <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remarks"
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 21 }}
            >
              <TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditProductionModal;
