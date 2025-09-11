"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  message,
  Input,
  Descriptions,
} from "antd";
const { TextArea } = Input;
import dayjs, { Dayjs } from "dayjs";
import type { SplitOrder } from "../../services/splitApi";
import {
  splitProgressApi,
  SplitProgressItem,
} from "../../services/splitProgressApi";
import { CategoryService, CategoryData } from "../../services/categoryService";

interface SplitOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: SplitFormValues) => void;
  orderData: SplitOrder | null;
}

export interface SplitFormValues {
  // 厂内生产项：类目名称 -> {计划日期, 拆单日期}
  internal_items: Record<
    string,
    {
      plannedDate?: string;
      splitDate?: string;
    }
  >;
  // 外购项：类目名称 -> {计划日期, 采购日期}
  external_items: Record<
    string,
    {
      plannedDate?: string;
      purchaseDate?: string;
    }
  >;
}

const SplitOrderModal: React.FC<SplitOrderModalProps> = ({
  visible,
  onCancel,
  onOk,
  orderData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [internalCategories, setInternalCategories] = useState<CategoryData[]>(
    []
  );
  const [externalCategories, setExternalCategories] = useState<CategoryData[]>(
    []
  );

  // 初始化表单数据
  useEffect(() => {
    const loadFormData = async () => {
      if (orderData) {
        const internalItems: Record<
          string,
          { plannedDate?: Dayjs; splitDate?: Dayjs }
        > = {};
        const externalItems: Record<
          string,
          { plannedDate?: Dayjs; purchaseDate?: Dayjs }
        > = {};

        // 通过order_number查询split_progress表中的数据
        try {
          const progressList = await splitProgressApi.getProgressByOrderNumber(
            orderData.order_number
          );

          // 根据item_type分类并创建表单项
          const internalCategories: CategoryData[] = [];
          const externalCategories: CategoryData[] = [];

          progressList.forEach((progress: SplitProgressItem) => {
            if (progress.item_type === "internal") {
              internalItems[progress.category_name] = {
                plannedDate: progress.planned_date
                  ? dayjs(progress.planned_date)
                  : orderData.completion_date
                  ? dayjs(orderData.completion_date)
                  : undefined,
                splitDate: progress.split_date
                  ? dayjs(progress.split_date)
                  : undefined,
              };
              internalCategories.push({
                id: 0,
                name: progress.category_name,
                category_type: "厂内生产项",
              });
            } else if (progress.item_type === "external") {
              externalItems[progress.category_name] = {
                plannedDate: progress.planned_date
                  ? dayjs(progress.planned_date)
                  : orderData.completion_date
                  ? dayjs(orderData.completion_date)
                  : undefined,
                purchaseDate: progress.purchase_date
                  ? dayjs(progress.purchase_date)
                  : undefined,
              };
              externalCategories.push({
                id: 0,
                name: progress.category_name,
                category_type: "外购项",
              });
            }
          });

          setInternalCategories(internalCategories);
          setExternalCategories(externalCategories);
        } catch (error) {
          console.error("加载拆单进度数据失败:", error);
          setInternalCategories([]);
          setExternalCategories([]);
        }

        form.setFieldsValue({
          internalItems,
          externalItems,
        });
      }
    };

    loadFormData();
  }, [orderData, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 转换数据格式，将日期对象转换为字符串
      const formattedValues: {
        internalItems: Record<
          string,
          { plannedDate?: string; splitDate?: string }
        >;
        externalItems: Record<
          string,
          { plannedDate?: string; purchaseDate?: string }
        >;
      } = {
        internalItems: {},
        externalItems: {},
      };

      const legacyFormattedValues: SplitFormValues = {
        internal_items: {},
        external_items: {},
      };

      // 处理厂内生产项
      if (values.internalItems) {
        Object.keys(values.internalItems).forEach((categoryName) => {
          const item = values.internalItems[categoryName];
          formattedValues.internalItems[categoryName] = {
            plannedDate: item.plannedDate
              ? dayjs(item.plannedDate).format("YYYY-MM-DD")
              : undefined,
            splitDate: item.splitDate
              ? dayjs(item.splitDate).format("YYYY-MM-DD")
              : undefined,
          };
        });
      }

      // 处理外购项
      if (values.externalItems) {
        Object.keys(values.externalItems).forEach((categoryName) => {
          const item = values.externalItems[categoryName];
          formattedValues.externalItems[categoryName] = {
            plannedDate: item.plannedDate
              ? dayjs(item.plannedDate).format("YYYY-MM-DD")
              : undefined,
            purchaseDate: item.purchaseDate
              ? dayjs(item.purchaseDate).format("YYYY-MM-DD")
              : undefined,
          };
        });
      }

      // 调用新的拆单进度API
      if (!orderData?.id) {
        throw new Error("订单数据不完整");
      }

      await splitProgressApi.batchUpdate(orderData.id, formattedValues);

      // 同时填充legacy格式用于回调
      Object.keys(formattedValues.internalItems).forEach((categoryName) => {
        legacyFormattedValues.internal_items[categoryName] =
          formattedValues.internalItems[categoryName];
      });
      Object.keys(formattedValues.externalItems).forEach((categoryName) => {
        legacyFormattedValues.external_items[categoryName] =
          formattedValues.externalItems[categoryName];
      });

      console.log("拆单进度更新成功:", formattedValues);
      onOk(legacyFormattedValues);
      message.success("拆单进度更新成功！");
    } catch (error) {
      console.error("拆单进度更新失败:", error);
      message.error("拆单进度更新失败，请重试！");
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
          title="订单信息"
          bordered
          column={2}
          size="small"
          items={[
            {
              key: "order_number",
              label: "订单编号",
              children: orderData.order_number || "-",
            },
            {
              key: "customer_name",
              label: "客户名称",
              children: orderData.customer_name || "-",
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
              key: "salesperson",
              label: "销售员",
              children: orderData.salesperson || "-",
            },
            {
              key: "order_date",
              label: "下单日期",
              children: orderData.order_date || "-",
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
        {/* 厂内生产项 */}
        {internalCategories.length > 0 && (
          <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="厂内生产项" size="small">
                <Row gutter={16}>
                  {internalCategories.map((category) => (
                    <Col
                      span={12}
                      key={category.id}
                      style={{ marginBottom: 16 }}
                    >
                      <Card title={category.name} size="small" type="inner">
                        <Form.Item
                          label="计划日期"
                          name={["internalItems", category.name, "plannedDate"]}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker
                            placeholder="请选择日期"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Form.Item
                          label="拆单日期"
                          name={["internalItems", category.name, "splitDate"]}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker
                            placeholder="请选择日期"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* 外购项 */}
        {externalCategories.length > 0 && (
          <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="外购项" size="small">
                <Row gutter={16}>
                  {externalCategories.map((category) => (
                    <Col
                      span={12}
                      key={category.id}
                      style={{ marginBottom: 16 }}
                    >
                      <Card title={category.name} size="small" type="inner">
                        <Form.Item
                          label="计划日期"
                          name={["externalItems", category.name, "plannedDate"]}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker
                            placeholder="请选择日期"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Form.Item
                          label="采购日期"
                          name={[
                            "externalItems",
                            category.name,
                            "purchaseDate",
                          ]}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker
                            placeholder="请选择日期"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
};

export default SplitOrderModal;
