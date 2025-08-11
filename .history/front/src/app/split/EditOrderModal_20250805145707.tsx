"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import type { SplitOrder } from "../../services/splitApi";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface EditOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: EditFormValues) => void;
  orderData: SplitOrder | null;
}

export interface EditFormValues {
  splitter: string;
  orderStatus: string;
  quoteStatus: string;
  boardDate: dayjs.Dayjs | null;
  splitCompleteDate: dayjs.Dayjs | null;
  remarks: string;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  visible,
  onCancel,
  onOk,
  orderData,
}) => {
  const [form] = Form.useForm<EditFormValues>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onOk(values);
      message.success("订单信息更新成功");
      form.resetFields();
    } catch (error) {
      console.error("表单验证失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!orderData) return null;

  return (
    <Modal
      title="编辑订单"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          确认
        </Button>,
      ]}
      width={1200}
    >
      <div style={{ padding: "16px 0" }}>
        {/* 只读信息区域 */}
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            backgroundColor: "#f5f5f5",
            borderRadius: 6,
          }}
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            订单信息
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Text strong>订单编号:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.designNumber}</Text>
            </Col>
            <Col span={6}>
              <Text strong>客户名称:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.customerName}</Text>
            </Col>

            <Col span={6}>
              <Text strong>地址:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.address}</Text>
            </Col>
            <Col span={6}>
              <Text strong>西安:</Text>
            </Col>
            <Col span={6}>
              <Text>西安</Text>
            </Col>

            <Col span={6}>
              <Text strong>设计师:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.designer}</Text>
            </Col>
            <Col span={6}>
              <Text strong>销售员:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.salesPerson}</Text>
            </Col>

            <Col span={6}>
              <Text strong>下单日期:</Text>
            </Col>
            <Col span={6}>
              <Text>{orderData.createTime}</Text>
            </Col>
            <Col span={12}></Col>

            <Col span={6}>
              <Text strong>类目:</Text>
            </Col>
            <Col span={18}>
              <Text>木门，柜体，石材，板材</Text>
            </Col>
          </Row>
        </div>

        {/* 可编辑表单区域 */}
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          initialValues={{
            splitter: orderData.splitPerson || "",
            orderStatus: orderData.states || "未审核",
            quoteStatus: "已打款",
            boardDate: null,
            splitCompleteDate: null,
            remarks: "",
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="拆单员"
                name="splitter"
                rules={[{ required: true, message: "请选择拆单员" }]}
              >
                <Select placeholder="请选择拆单员">
                  <Option value="拆单员A">拆单员A</Option>
                  <Option value="拆单员B">拆单员B</Option>
                  <Option value="拆单员C">拆单员C</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="订单状态"
                name="orderStatus"
                rules={[{ required: true, message: "请选择订单状态" }]}
              >
                <Select placeholder="请选择订单状态">
                  <Option value="未审核">未审核</Option>
                  <Option value="已审核">已审核</Option>
                  <Option value="生产中">生产中</Option>
                  <Option value="已完成">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="报价状态"
                name="quoteStatus"
                rules={[{ required: true, message: "请选择报价状态" }]}
              >
                <Select placeholder="请选择报价状态">
                  <Option value="已打款">已打款</Option>
                  <Option value="未打款">未打款</Option>
                  <Option value="部分打款">部分打款</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="定板日期" name="boardDate">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="请选择日期"
                  format="YYYY/MM/DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="拆单完成日期" name="splitCompleteDate">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="请选择日期"
                  format="YYYY/MM/DD"
                />
              </Form.Item>
            </Col>
            <Col span={12}></Col>
          </Row>

          <Form.Item
            label="备注"
            name="remarks"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 21 }}
          >
            <TextArea
              rows={4}
              placeholder="请输入备注信息"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default EditOrderModal;
