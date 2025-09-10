"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Row,
  Col,
  message,
  Descriptions,
} from "antd";
import type { SplitOrder } from "../../services/splitApi";
import { updateSplitOrder } from "../../services/splitApi";
import { UserService, UserRole } from "../../services/userService";
import { CategoryService } from "../../services/categoryService";

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
  categories: string[];
  remarks: string;
}

interface UserData {
  username: string;
  role: string;
}

interface CategoryData {
  id: number;
  name: string;
  category_type: string;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  visible,
  onCancel,
  onOk,
  orderData,
}) => {
  const [form] = Form.useForm<EditFormValues>();
  const [loading, setLoading] = useState(false);
  const [splitters, setSplitters] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // 获取拆单员列表
  const fetchSplitters = async () => {
    try {
      const users = await UserService.getUsersByRole(UserRole.SPLITTING);
      setSplitters(users);
    } catch (error) {
      console.error("获取拆单员列表失败:", error);
      message.error("获取拆单员列表失败");
    }
  };

  // 获取类目列表
  const fetchCategories = async () => {
    try {
      const categoryList = await CategoryService.getCategoryList();
      setCategories(categoryList);
    } catch (error) {
      console.error("获取类目列表失败:", error);
      message.error("获取类目列表失败");
    }
  };

  // 初始化数据
  useEffect(() => {
    if (visible) {
      setLoadingData(true);
      Promise.all([fetchSplitters(), fetchCategories()]).finally(() =>
        setLoadingData(false)
      );
    }
  }, [visible]);

  useEffect(() => {
    if (orderData) {
      form.setFieldsValue({
        splitter: orderData.splitter || undefined,
        categories: (() => {
          const categories: string[] = [];

          // 处理厂内生产项
          if (orderData.internal_production_items) {
            if (typeof orderData.internal_production_items === "string") {
              // 字符串格式："类目:实际时间:消耗时间"
              const items = (
                orderData.internal_production_items as string
              ).split(",");
              items.forEach((item: string) => {
                const parts = item.split(":");
                if (parts[0]) categories.push(parts[0]);
              });
            }
          }

          // 处理外购项
          if (orderData.external_purchase_items) {
            if (typeof orderData.external_purchase_items === "string") {
              // 字符串格式："类目:实际时间:消耗时间"
              const items = (orderData.external_purchase_items as string).split(
                ","
              );
              items.forEach((item: string) => {
                const parts = item.split(":");
                if (parts[0]) categories.push(parts[0]);
              });
            }
          }

          return [...new Set(categories)]; // 去重
        })(),
        remarks: orderData.remarks || "",
      });
    }
  }, [orderData, form]);

  const handleFinish = async (values: EditFormValues) => {
    try {
      setLoading(true);

      if (!orderData?.id) {
        message.error("订单ID不存在");
        setLoading(false);
        return;
      }

      // 将选中的类目转换为生产项格式
      const productionItems = values.categories.map((categoryName: string) => ({
        category_name: categoryName,
        planned_date: undefined,
        actual_date: undefined,
      }));

      // 调用API更新拆单信息
      const response = await updateSplitOrder(orderData.id, {
        splitter: values.splitter,
        internal_production_items: productionItems,
        remarks: values.remarks,
      });

      if (response.code === 200) {
        message.success("订单信息更新成功");
        onOk(values);
        form.resetFields();
      } else {
        message.error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
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
      title="编辑拆单"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      width={1200}
      confirmLoading={loading}
    >
      <div style={{ padding: "16px 0" }}>
        {/* 只读信息区域 */}
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
                children: orderData.order_number,
              },
              {
                key: "customer_name",
                label: "客户名称",
                children: orderData.customer_name,
              },
              {
                key: "address",
                label: "地址",
                children: orderData.address,
              },
              {
                key: "designer",
                label: "设计师",
                children: orderData.designer,
              },
              {
                key: "salesperson",
                label: "销售员",
                children: orderData.salesperson,
              },
              {
                key: "order_amount",
                label: "订单金额",
                children: orderData.order_amount
                  ? `¥${orderData.order_amount}`
                  : "-",
              },
              {
                key: "cabinet_area",
                label: "柜体面积",
                children: orderData.cabinet_area
                  ? `${orderData.cabinet_area}㎡`
                  : "-",
              },
              {
                key: "wall_panel_area",
                label: "墙板面积",
                children: orderData.wall_panel_area
                  ? `${orderData.wall_panel_area}㎡`
                  : "-",
              },
              {
                key: "order_date",
                label: "下单日期",
                children: orderData.order_date,
              },
              {
                key: "order_status",
                label: "订单状态",
                children: orderData.order_status,
              },
              {
                key: "quote_status",
                label: "报价状态",
                children: orderData.quote_status,
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
          onFinish={handleFinish}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="拆单员"
                name="splitter"
                rules={[{ required: true, message: "请选择拆单员" }]}
              >
                <Select
                  placeholder="请选择拆单员"
                  allowClear
                  loading={loadingData}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {splitters.map((user) => (
                    <Option key={user.username} value={user.username}>
                      {user.username}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="下单类目"
                name="categories"
                rules={[{ required: true, message: "请选择下单类目" }]}
              >
                <Checkbox.Group>
                  <Row>
                    {categories.map((category) => (
                      <Col
                        flex="auto"
                        key={category.id}
                        style={{ whiteSpace: "nowrap", minWidth: "fit-content" }}
                      >
                        <Checkbox
                          value={category.name}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {category.name}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </Col>
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
