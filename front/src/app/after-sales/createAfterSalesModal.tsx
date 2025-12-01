"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  InputNumber,
} from "antd";
import dayjs from "dayjs";
import { getProductionOrders, type ProductionOrder } from "../../services/productionApi";
import type { AfterSalesOrder } from "../../services/afterSalesApi";

const { Option } = Select;
const { TextArea } = Input;

interface AfterSalesFormValues {
  order_number: string;
  customer_name: string;
  shipping_address: string;
  customer_phone: string;
  delivery_date?: string;
  installation_date?: string;
  first_completion_date?: string;
  is_completed: boolean;
  after_sales_log?: string;
  external_purchase_details?: string;
  remaining_issues?: string;
  costs?: string;
  designer: string;
  splitter?: string;
  follow_up_issues?: string;
}

interface CreateAfterSalesModalProps {
  visible: boolean;
  onOk: (values: AfterSalesFormValues) => Promise<boolean>;
  onCancel: () => void;
  initialValues?: Partial<AfterSalesFormValues>;
}

const CreateAfterSalesModal: React.FC<CreateAfterSalesModalProps> = ({
  visible,
  onOk,
  onCancel,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderNumberSearching, setOrderNumberSearching] = useState(false);

  // 根据订单编号从生产管理查询，自动填充数据
  const handleOrderNumberBlur = async () => {
    const orderNumber = form.getFieldValue("order_number");
    if (!orderNumber || initialValues) {
      // 如果是编辑模式，不自动查询
      return;
    }

    if (!orderNumber.trim()) {
      return;
    }

    try {
      setOrderNumberSearching(true);
      // 从生产管理查询订单（只查询需要安装的订单）
      const productionResponse = await getProductionOrders({
        page: 1,
        page_size: 100,
      });

      // 查找匹配的订单
      const matchedOrder = productionResponse.data?.find(
        (order) =>
          order.order_number === orderNumber && order.is_installation === true
      );

      if (matchedOrder) {
        // 自动填充表单：订单编号、客户名称、发货地址、拆单员信息
        form.setFieldsValue({
          customer_name: matchedOrder.customer_name || "",
          shipping_address: matchedOrder.address || "",
          splitter: matchedOrder.splitter || "",
        });
        message.success("已从生产管理自动填充订单信息");
      } else {
        message.warning(
          "未找到该订单编号或该订单不需要安装，请确认订单编号是否正确"
        );
      }
    } catch (error) {
      console.error("查询订单信息失败:", error);
      message.error("查询订单信息失败，请稍后重试");
    } finally {
      setOrderNumberSearching(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // 编辑模式，设置编辑数据
        const formValues = {
          ...initialValues,
          delivery_date: initialValues.delivery_date
            ? dayjs(initialValues.delivery_date).isValid()
              ? dayjs(initialValues.delivery_date)
              : undefined
            : undefined,
          installation_date: initialValues.installation_date
            ? dayjs(initialValues.installation_date).isValid()
              ? dayjs(initialValues.installation_date)
              : undefined
            : undefined,
          first_completion_date: initialValues.first_completion_date
            ? dayjs(initialValues.first_completion_date).isValid()
              ? dayjs(initialValues.first_completion_date)
              : undefined
            : undefined,
        };
        form.setFieldsValue(formValues);
      } else {
        // 新增模式，重置为默认值并清空所有字段
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 处理日期字段
      const processedValues = {
        ...values,
        delivery_date: values.delivery_date
          ? dayjs(values.delivery_date).format("YYYY-MM-DD")
          : undefined,
        installation_date: values.installation_date
          ? dayjs(values.installation_date).format("YYYY-MM-DD")
          : undefined,
        first_completion_date: values.first_completion_date
          ? dayjs(values.first_completion_date).format("YYYY-MM-DD")
          : undefined,
        costs: values.costs ? String(values.costs) : undefined,
      };
      const success = await onOk(processedValues);
      if (success) {
        form.resetFields();
      }
    } catch (info) {
      console.log("验证失败:", info);
    }
  };

  const handleCancel = () => {
    onCancel();
    form.resetFields();
  };

  return (
    <Modal
      title={initialValues ? "编辑安装单" : "新增安装单"}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={1200}
      okText="确认"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="订单编号"
              name="order_number"
              rules={[{ required: true, message: "请输入订单编号" }]}
            >
              <Input
                placeholder="请输入订单编号"
                disabled={!!initialValues}
                onBlur={handleOrderNumberBlur}
                loading={orderNumberSearching}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="客户名称"
              name="customer_name"
              rules={[{ required: true, message: "请输入客户名称" }]}
            >
              <Input placeholder="请输入或自动填充" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="发货地址"
              name="shipping_address"
              rules={[{ required: true, message: "请输入发货地址" }]}
            >
              <Input placeholder="请输入发货地址" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="客户电话"
              name="customer_phone"
              rules={[{ required: true, message: "请输入客户电话" }]}
            >
              <Input placeholder="请输入客户电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="送货日期" name="delivery_date">
              <DatePicker
                placeholder="请选择送货日期"
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="安装日期" name="installation_date">
              <DatePicker
                placeholder="请选择安装日期"
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="首次完工日期" name="first_completion_date">
              <DatePicker
                placeholder="请选择首次完工日期"
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="是否完工" name="is_completed">
              <Select placeholder="请选择是否完工">
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="设计师" name="designer">
              <Input placeholder="自动填充或手动输入" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="拆单员" name="splitter">
              <Input placeholder="自动填充或手动输入" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="外购产品明细" name="external_purchase_details">
              <TextArea
                placeholder="请输入外购产品明细"
                rows={3}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="产生费用" name="costs">
              <InputNumber
                placeholder="请输入产生费用"
                style={{ width: "100%" }}
                min={0}
                precision={2}
                addonAfter="元"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateAfterSalesModal;
