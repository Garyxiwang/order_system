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
  Checkbox,
} from "antd";
import dayjs from "dayjs";
import { UserService, UserData } from "../../services/userService";
import { CategoryService, CategoryData } from "../../services/categoryService";

const { Option } = Select;

interface OrderFormValues {
  order_number: string;
  customer_name: string;
  address: string;
  designer: string;
  salesperson: string;
  assignment_date: string;
  category_name: string;
  order_type: string;
  cabinet_area?: string;
  wall_panel_area?: string;
  order_amount?: string;
  is_installation: boolean;
  remarks?: string;
}

interface CreateOrderModalProps {
  visible: boolean;
  onOk: (values: OrderFormValues) => Promise<boolean>;
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
  const [designers, setDesigners] = useState<UserData[]>([]);
  const [salespersons, setSalespersons] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载基础数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [designersData, salespersonsData, categoriesData] =
        await Promise.all([
          UserService.getDesigners(),
          UserService.getSalespersons(),
          CategoryService.getCategoryList(),
        ]);
      setDesigners(designersData);
      setSalespersons(salespersonsData);
      setCategories(categoriesData);
    } catch (error) {
      message.error("加载数据失败，请重试");
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      // 加载基础数据
      loadData();

      if (initialValues) {
        // 编辑模式，设置编辑数据
        const formValues = {
          ...initialValues,
          assignment_date:
            initialValues.assignment_date &&
            dayjs(initialValues.assignment_date).isValid()
              ? dayjs(initialValues.assignment_date)
              : undefined,
          // 将category_name字符串转换为数组以适配Checkbox.Group
          category_name:
            initialValues.category_name &&
            typeof initialValues.category_name === "string"
              ? initialValues.category_name.split(",")
              : initialValues.category_name,
        };
        form.setFieldsValue(formValues);
      } else {
        // 新增模式，重置为默认值并清空所有字段
        form.resetFields();
        form.setFieldsValue({
          order_type: "设计单",
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 将category_name数组转换为逗号分隔的字符串
      // 处理数字字段，空字符串转为undefined而不是0
      const processedValues = {
        ...values,
        category_name: Array.isArray(values.category_name)
          ? values.category_name.join(",")
          : values.category_name,
        order_amount:
          values.order_amount && values.order_amount !== ""
            ? values.order_amount
            : undefined,
        cabinet_area:
          values.cabinet_area && values.cabinet_area !== ""
            ? values.cabinet_area
            : undefined,
        wall_panel_area:
          values.wall_panel_area && values.wall_panel_area !== ""
            ? values.wall_panel_area
            : undefined,
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
      title={initialValues ? "编辑订单" : "新增订单"}
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
        initialValues={{
          assignment_date: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="订单编号"
              name="order_number"
              rules={[{ required: true, message: "请输入订单编号" }]}
            >
              <Input placeholder="请输入" disabled={!!initialValues} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="客户名称"
              name="customer_name"
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
              name="address"
              rules={[{ required: true, message: "请输入订单地址" }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="订单类型"
              name="order_type"
              rules={[{ required: true, message: "请选择订单类型" }]}
            >
              <Select placeholder="设计单">
                <Option value="设计单">设计单</Option>
                <Option value="生产单">生产单</Option>
                <Option value="成品单">成品单</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="设计师"
              name="designer"
              dependencies={["order_type"]}
            >
              <Select placeholder="请选择设计师" loading={loading}>
                {designers.map((designer) => (
                  <Option key={designer.username} value={designer.username}>
                    {designer.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="销售员"
              name="salesperson"
              dependencies={["order_type"]}
              rules={[{ required: true, message: "请选择销售员" }]}
            >
              <Select placeholder="请选择销售员" loading={loading}>
                {salespersons.map((salesperson) => (
                  <Option
                    key={salesperson.username}
                    value={salesperson.username}
                  >
                    {salesperson.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="下单类目"
              name="category_name"
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
          <Col span={12}>
            <Form.Item
              label="是否安装"
              name="is_installation"
              rules={[{ required: true, message: "请选择是否安装" }]}
            >
              <Select placeholder="请选择是否安装" allowClear>
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="分单日期"
              name="assignment_date"
              rules={[{ required: true, message: "请选择分单日期" }]}
            >
              <DatePicker
                placeholder="请选择分单日期"
                style={{ width: "100%" }}
                showNow={false}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="订单金额" name="order_amount">
              <Input placeholder="请输入" addonAfter="元" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="柜体面积" name="cabinet_area">
              <Input placeholder="请输入" addonAfter="㎡" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="墙板面积" name="wall_panel_area">
              <Input placeholder="请输入" addonAfter="㎡" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="备注" name="remarks">
              <Input.TextArea placeholder="请输入" rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {/* <Row gutter={16}>
          {!initialValues && (
            <Col span={12}>
              <Form.Item label="订单状态" name="orderStatus">
                <Select
                  placeholder="请选择订单状态"
                  allowClear
                  defaultValue={"进行中"}
                >
                  <Option value="进行中">进行中</Option>
                  <Option value="延期">延期</Option>
                  <Option value="暂停">暂停</Option>
                  <Option value="等硬装">等硬装</Option>
                  <Option value="客户待打款">客户待打款</Option>
                  <Option value="待客户确认">待客户确认</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row> */}
      </Form>
    </Modal>
  );
};

export default CreateOrderModal;
