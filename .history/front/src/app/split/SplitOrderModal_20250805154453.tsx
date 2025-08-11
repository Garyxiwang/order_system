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
      <div style={{ 
        marginBottom: 32, 
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <Descriptions
          title="基本信息"
          bordered
          column={2}
          size="middle"
          labelStyle={{ 
            background: '#fafafa', 
            fontWeight: 600,
            color: '#262626'
          }}
          contentStyle={{
            background: '#fff',
            color: '#595959'
          }}
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
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card 
              title="🚪 木门" 
              size="default"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)',
                border: '1px solid #1890ff',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
              }}
              headStyle={{
                background: '#1890ff',
                color: '#fff',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600
              }}
            >
              <Row gutter={20}>
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
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card 
              title="🗄️ 柜体" 
              size="default"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)',
                border: '1px solid #52c41a',
                background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
              }}
              headStyle={{
                background: '#52c41a',
                color: '#fff',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600
              }}
            >
              <Row gutter={20}>
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
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card 
              title="🪨 石材" 
              size="default"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(250, 173, 20, 0.15)',
                border: '1px solid #faad14',
                background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)'
              }}
              headStyle={{
                background: '#faad14',
                color: '#fff',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600
              }}
            >
              <Row gutter={20}>
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
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card 
              title="🪵 板材" 
              size="default"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)',
                border: '1px solid #722ed1',
                background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)'
              }}
              headStyle={{
                background: '#722ed1',
                color: '#fff',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600
              }}
            >
              <Row gutter={20}>
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
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card 
              title="🚪 铝合金门" 
              size="default"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(235, 47, 150, 0.15)',
                border: '1px solid #eb2f96',
                background: 'linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)'
              }}
              headStyle={{
                background: '#eb2f96',
                color: '#fff',
                borderRadius: '12px 12px 0 0',
                fontWeight: 600
              }}
            >
              <Row gutter={20}>
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
