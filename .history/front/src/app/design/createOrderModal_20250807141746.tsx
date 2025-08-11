"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;

interface OrderFormValues {
  orderNumber: string;
  customerName: string;
  orderAddress: string;
  orderType: string;
  designer: string;
  salesperson: string;
  categories: string[];
  splitDate?: string;
  orderStatus: string;
  progressDetail: string;
  remark?: string;
}

interface CreateOrderModalProps {
  visible: boolean;
  onOk: (values: OrderFormValues) => void;
  onCancel: () => void;
  initialValues?: Partial<OrderFormValues>;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  visible,
  onOk,
  onCancel,
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // 编辑模式，设置编辑数据
        const formValues = {
          ...initialValues,
          splitDate: initialValues.splitDate ? dayjs(initialValues.splitDate) : undefined,
        };
        form.setFieldsValue(formValues);
      } else {
        // 新增模式，重置为默认值并清空所有字段
        form.resetFields();
        form.setFieldsValue({
          orderType: "设计单",
          progressDetail: "正常进行中",
          categories: [],
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onOk(values);
        form.resetFields();
      })
      .catch((info) => {
        console.log("验证失败:", info);
      });
  };

  const handleCancel = () => {
    onCancel();
    form.resetFields();
  };

  return (
    <Modal
      title="新增/编辑 订单"
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
              name="orderNumber"
              rules={[{ required: true, message: "请输入订单编号" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="客户名称"
              name="customerName"
              rules={[{ required: true, message: "请输入客户名称" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="订单地址"
              name="orderAddress"
              rules={[{ required: true, message: "请输入订单地址" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="订单类型"
              name="orderType"
              rules={[{ required: true, message: "请选择订单类型" }]}
            >
              <Select placeholder="设计单">
                <Option value="设计单">设计单</Option>
                <Option value="生产单">生产单</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="设计师"
              name="designer"
              rules={[{ required: true, message: "请选择设计师" }]}
            >
              <Select placeholder="设计师A">
                <Option value="设计师A">设计师A</Option>
                <Option value="设计师B">设计师B</Option>
                <Option value="设计师C">设计师C</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="销售员"
              name="salesperson"
              rules={[{ required: true, message: "请选择销售员" }]}
            >
              <Select placeholder="销售A">
                <Option value="销售A">销售A</Option>
                <Option value="销售B">销售B</Option>
                <Option value="销售C">销售C</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="下单类目"
              name="categories"
              rules={[{ required: true, message: "请选择下单类目" }]}
            >
              <Checkbox.Group>
                <Row>
                  <Col span={6}>
                    <Checkbox value="木门">木门</Checkbox>
                  </Col>
                  <Col span={6}>
                    <Checkbox value="柜体">柜体</Checkbox>
                  </Col>
                  <Col span={6}>
                    <Checkbox value="石材">石材</Checkbox>
                  </Col>
                  <Col span={6}>
                    <Checkbox value="板材">板材</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="分单日期" name="splitDate">
              <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="订单状态" name="orderStatus">
              <Select placeholder="请选择订单状态" allowClear>
                <Option value="进行中">进行中</Option>
                <Option value="延期">延期</Option>
                <Option value="暂停">暂停</Option>
                <Option value="已完成">已完成</Option>
                <Option value="等硬装">等硬装</Option>
                <Option value="客户待打款">客户待打款</Option>
                <Option value="待客户确认">待客户确认</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="备注" name="remark">
              <Input.TextArea placeholder="请输入" rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateOrderModal;
