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
      <div style={{ marginBottom: 24 }}>
        <Descriptions
          title="订单信息"
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
        {/* 木门 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="木门" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="拆单日期" name="doorSplitDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="定板日期" name="doorFixedDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 柜体 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="柜体" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="拆单日期" name="cabinetSplitDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="定板日期" name="cabinetFixedDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 石材 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="石材" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="拆单日期" name="stoneSplitDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="定板日期" name="stoneFixedDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 板材 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="板材" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="拆单日期" name="boardSplitDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="定板日期" name="boardFixedDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 铝合金门 */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="铝合金门" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="拆单日期" name="aluminumSplitDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="定板日期" name="aluminumFixedDate">
                    <DatePicker placeholder="请选择日期" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remarks"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <TextArea
                placeholder="请输入备注信息"
                rows={3}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SplitOrderModal;
