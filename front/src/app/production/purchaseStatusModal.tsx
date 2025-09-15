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
import type { ProductionOrder } from "../../services/productionApi";
import {
  ProductionProgressData,
  getProductionProgressList,
  batchUpdateProductionProgress,
} from "../../services/productionProgressService";
import styles from "./progressModal.module.css";

// 进度数据接口，包含额外的进度字段
interface ProgressData {
  [key: string]: string | number | null;
}

// 表单值接口
interface FormValues {
  [key: string]: string | number | dayjs.Dayjs | null | undefined;
}

interface PurchaseStatusModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
  onOk: (values: ProgressData) => void;
}

const PurchaseStatusModal: React.FC<PurchaseStatusModalProps> = ({
  visible,
  order,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState<ProductionProgressData[]>(
    []
  );

  // 加载生产进度数据
  useEffect(() => {
    const loadProgressData = async () => {
      if (order && visible) {
        try {
          const data = await getProductionProgressList(order.id);
          setProgressData(data);

          // 根据查询到的数据设置表单初始值
          const formValues: FormValues = {};

          // 根据生产进度数据设置表单值
          data.forEach((item, originalIndex) => {
            const prefix =
              item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              `item${originalIndex}`;
            console.log("item", item);
            if (item.order_date) {
              formValues[`${prefix}OrderDate`] = dayjs(item.order_date);
            }
            if (item.expected_material_date) {
              formValues[`${prefix}ExpectedMaterialDate`] = dayjs(
                item.expected_material_date
              );
            }
            if (item.actual_storage_date) {
              formValues[`${prefix}ActualWarehouseDate`] = dayjs(
                item.actual_storage_date
              );
            }
            if (item.expected_arrival_date) {
              formValues[`${prefix}ExpectedArrivalDate`] = dayjs(
                item.expected_arrival_date
              );
            }
            if (item.actual_arrival_date) {
              formValues[`${prefix}ActualArrivalDate`] = dayjs(
                item.actual_arrival_date
              );
            }
            // 采购状态相关字段
            if (item.order_date) {
              formValues[`${prefix}OrderDate`] = dayjs(item.order_date);
            }
            if (item.expected_material_date) {
              formValues[`${prefix}ExpectedMaterialDate`] = dayjs(
                item.expected_material_date
              );
            }
            if (item.actual_storage_date) {
              formValues[`${prefix}ActualWarehouseDate`] = dayjs(
                item.actual_storage_date
              );
            }
            if (item.expected_arrival_date) {
              formValues[`${prefix}ExpectedArrivalDate`] = dayjs(
                item.expected_arrival_date
              );
            }
            if (item.actual_arrival_date) {
              formValues[`${prefix}ActualArrivalDate`] = dayjs(
                item.actual_arrival_date
              );
            }
          });
          console.log("formValues", formValues);
          form.setFieldsValue(formValues);
        } catch (error) {
          console.error("加载生产进度数据失败:", error);
          message.error("加载生产进度数据失败");
        }
      }
    };

    loadProgressData();
  }, [visible, order, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      // 采购状态更新：使用批量更新接口
        const batchUpdateData: (Omit<
          ProductionProgressData,
          "production_id" | "order_number" | "created_at" | "updated_at"
        > & { id?: number })[] = [];
        let hasUpdates = false;

        progressData.forEach((item, originalIndex) => {
          // 跳过没有ID的记录
          if (!item.id) {
            return;
          }

          const prefix =
            item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            `item${originalIndex}`;

          const itemData: Omit<
            ProductionProgressData,
            "production_id" | "order_number" | "created_at" | "updated_at"
          > & { id?: number } = {
            id: item.id,
            item_type: item.item_type,
            category_name: item.category_name,
            order_date: item.order_date,
            expected_material_date: item.expected_material_date,
            actual_storage_date: item.actual_storage_date,
            storage_time: item.storage_time,
            quantity: item.quantity,
            expected_arrival_date: item.expected_arrival_date,
            actual_arrival_date: item.actual_arrival_date,
          };

          // 检查并更新字段（包括删除操作）
          if (values.hasOwnProperty(`${prefix}OrderDate`)) {
            itemData.order_date = values[`${prefix}OrderDate`]
              ? values[`${prefix}OrderDate`].format("YYYY-MM-DD")
              : "";
            hasUpdates = true;
          }
          if (values.hasOwnProperty(`${prefix}ExpectedMaterialDate`)) {
            itemData.expected_material_date = values[
              `${prefix}ExpectedMaterialDate`
            ]
              ? values[`${prefix}ExpectedMaterialDate`].format("YYYY-MM-DD")
              : "";
            hasUpdates = true;
          }
          if (values.hasOwnProperty(`${prefix}ActualWarehouseDate`)) {
            itemData.actual_storage_date = values[
              `${prefix}ActualWarehouseDate`
            ]
              ? values[`${prefix}ActualWarehouseDate`].format("YYYY-MM-DD")
              : "";
            hasUpdates = true;
          }
          if (values.hasOwnProperty(`${prefix}ExpectedArrivalDate`)) {
            itemData.expected_arrival_date = values[
              `${prefix}ExpectedArrivalDate`
            ]
              ? values[`${prefix}ExpectedArrivalDate`].format("YYYY-MM-DD")
              : "";
            hasUpdates = true;
          }
          if (values.hasOwnProperty(`${prefix}ActualArrivalDate`)) {
            itemData.actual_arrival_date = values[`${prefix}ActualArrivalDate`]
              ? values[`${prefix}ActualArrivalDate`].format("YYYY-MM-DD")
              : "";
            hasUpdates = true;
          }

          batchUpdateData.push(itemData);
        });

        if (hasUpdates && order?.id) {
          // 为采购状态更新转换数据类型
          const purchaseUpdateData: (Partial<ProductionProgressData> & { id: number })[] = batchUpdateData.map(item => ({
            id: item.id!,
            order_date: item.order_date,
            expected_material_date: item.expected_material_date,
            actual_storage_date: item.actual_storage_date,
            expected_arrival_date: item.expected_arrival_date,
            actual_arrival_date: item.actual_arrival_date
          }));
          await batchUpdateProductionProgress(order.id, purchaseUpdateData);
          message.success("采购状态更新成功！");
          // 采购状态更新成功后调用回调
          const formattedValues: ProgressData = {};
          Object.keys(values).forEach((key) => {
            const value = values[key];
            if (dayjs.isDayjs(value)) {
              formattedValues[key] = value.format("YYYY-MM-DD");
            } else {
              formattedValues[key] = value;
            }
          });
          onOk(formattedValues);
          return; // 提前返回，避免执行后面的通用逻辑
        } else {
          message.warning("没有检测到需要更新的数据");
          return; // 提前返回
        }


    } catch (error) {
      console.error("更新失败:", error);
      message.error("更新失败，请检查表单数据！");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!order) {
    return null;
  }

  return (
    <Modal
      title="采购状态更新"
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
              key: "orderCode",
              label: "订单编码",
              children: order.order_number || "-",
            },
            {
              key: "customerName",
              label: "客户名称",
              children: order.customer_name || "-",
            },
            {
              key: "deliveryAddress",
              label: "发货地址",
              children: order.address || "-",
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: order.is_installation ? "是" : "否",
            },
          ]}
        />
      </div>

      {/* 生产进度表单区域 */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Card title="采购状态">
            {/* 厂内生产项 */}
            {progressData.filter((item) => item.item_type === "internal")
              .length > 0 && (
              <div className={styles.sectionContainer}>
                <h3 className={styles.sectionTitle}>厂内生产项</h3>
                <Row gutter={16}>
                  {progressData
                    .map((item, originalIndex) => {
                      if (item.item_type !== "internal") return null;
                      const prefix =
                        item.category_name
                          ?.toLowerCase()
                          .replace(/[^a-z0-9]/g, "") || `item${originalIndex}`;
                      return (
                        <Col span={12} key={`internal-${originalIndex}`}>
                          <div className={styles.itemCard}>
                            <h4 className={styles.itemTitle}>
                              {item.category_name}材料
                            </h4>
                            <div className={styles.dateInfoRow}>
                              <label className={styles.dateLabel}>
                                下单日期:
                              </label>
                              <span className={styles.dateValue}>
                                {item.order_date || "-"}
                              </span>
                            </div>
                            <Form.Item
                              label="预计齐料日期"
                              name={`${prefix}ExpectedMaterialDate`}
                              className={styles.formItem}
                            >
                              <DatePicker
                                placeholder="选择预计齐料日期"
                                className={styles.fullWidth}
                              />
                            </Form.Item>
                            <Form.Item
                              label="实际齐料日期"
                              name={`${prefix}ActualWarehouseDate`}
                              className={styles.formItem}
                            >
                              <DatePicker
                                placeholder="选择实际齐料日期"
                                className={styles.fullWidth}
                              />
                            </Form.Item>
                          </div>
                        </Col>
                      );
                    })
                    .filter(Boolean)}
                </Row>
              </div>
            )}

            {/* 外购项 */}
            {progressData.filter((item) => item.item_type === "external")
              .length > 0 && (
              <div className={styles.sectionContainer}>
                <h3 className={styles.sectionTitle}>外购项</h3>
                <Row gutter={16}>
                  {progressData
                    .map((item, originalIndex) => {
                      if (item.item_type !== "external") return null;
                      const prefix =
                        item.category_name
                          ?.toLowerCase()
                          .replace(/[^a-z0-9]/g, "") || `item${originalIndex}`;
                      return (
                        <Col span={12} key={`external-${originalIndex}`}>
                          <div className={styles.itemCard}>
                            <h4 className={styles.itemTitle}>
                              {item.category_name}
                            </h4>
                            <div className={styles.dateInfoRow}>
                              <label className={styles.dateLabel}>
                                下单日期:
                              </label>
                              <span className={styles.dateValue}>
                                {item.order_date || "-"}
                              </span>
                            </div>
                            <Form.Item
                              label="预计到厂日期"
                              name={`${prefix}ExpectedArrivalDate`}
                              className={styles.formItem}
                            >
                              <DatePicker
                                placeholder="选择预计到厂日期"
                                className={styles.fullWidth}
                              />
                            </Form.Item>
                            <Form.Item
                              label="实际到厂日期"
                              name={`${prefix}ActualArrivalDate`}
                              className={styles.formItem}
                            >
                              <DatePicker
                                placeholder="选择实际到厂日期"
                                className={styles.fullWidth}
                              />
                            </Form.Item>
                          </div>
                        </Col>
                      );
                    })
                    .filter(Boolean)}
                </Row>
              </div>
            )}
          </Card>
      </Form>
    </Modal>
  );
};

export default PurchaseStatusModal;
