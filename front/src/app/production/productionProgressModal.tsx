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
import { updateProductionOrder } from "../../services/productionApi";
import {
  ProductionProgressData,
  getProductionProgressList,
  batchUpdateProductionProgress,
} from "../../services/productionProgressService";
import styles from "./progressModal.module.css";

// 进度数据接口
interface ProgressData {
  [key: string]: string | number | null;
}

// 表单值接口
interface FormValues {
  [key: string]: string | number | dayjs.Dayjs | null | undefined;
  cuttingDate?: dayjs.Dayjs | null;
  expectedShipmentDate?: dayjs.Dayjs | null;
}

interface ProductionProgressModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
  onOk: (values: ProgressData) => void;
}

const ProductionProgressModal: React.FC<ProductionProgressModalProps> = ({
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
          const formValues: FormValues = {
            // 车间进度相关
            cuttingDate: order.cutting_date ? dayjs(order.cutting_date) : null,
            expectedShipmentDate: order.expected_shipping_date
              ? dayjs(order.expected_shipping_date)
              : null,
          };

          // 根据生产进度数据设置表单值
          const internalItems = data.filter(item => item.item_type === 'internal');
          const externalItems = data.filter(item => item.item_type === 'external');
          
          // 处理厂内生产项
          internalItems.forEach((item, index) => {
            const prefix =
              item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              `internal${index}`;
            if (item.storage_time) {
              formValues[`${prefix}WarehouseTime`] = dayjs(item.storage_time);
            }
            if (item.quantity) {
              formValues[`${prefix}Count`] = item.quantity;
              formValues[`${prefix}HardwareCount`] = item.quantity;
            }
          });
          
          // 处理外购项
          externalItems.forEach((item, index) => {
            const prefix =
              item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              `external${index}`;
            if (item.storage_time) {
              formValues[`${prefix}WarehouseTime`] = dayjs(item.storage_time);
            }
            if (item.quantity) {
              formValues[`${prefix}Count`] = item.quantity;
              formValues[`${prefix}HardwareCount`] = item.quantity;
            }
          });
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

        
        // 生产进度更新：分两部分处理
      const productionUpdatePromises: Promise<{
        code: number;
        message: string;
        data: ProductionOrder;
      }>[] = [];
      const progressUpdatePromises: Promise<ProductionProgressData[]>[] = [];

      // 1. 更新生产表中的下料日期和预计出货日期
      const productionUpdates: Partial<ProductionOrder> = {};
      if (values.cuttingDate) {
        productionUpdates.cutting_date =
          values.cuttingDate.format("YYYY-MM-DD");
      }
      if (values.expectedShipmentDate) {
        productionUpdates.expected_shipping_date =
          values.expectedShipmentDate.format("YYYY-MM-DD");
      }

      if (Object.keys(productionUpdates).length > 0 && order?.id) {
        productionUpdatePromises.push(
          updateProductionOrder(String(order.id), productionUpdates)
        );
      }

      // 2. 批量更新生产进度表中的入库时间和件数
      const progressBatchUpdateData: (Omit<
        ProductionProgressData,
        "production_id" | "order_number" | "created_at" | "updated_at"
      > & { id?: number })[] = [];
      let hasProgressUpdates = false;

      console.log('原始进度数据:', progressData);
      
      // 分别处理厂内生产项和外购项
      const internalItems = progressData.filter(item => item.item_type === "internal");
      const externalItems = progressData.filter(item => item.item_type === "external");
      
      // 处理厂内生产项
      internalItems.forEach((item, index) => {
        // 跳过没有ID的记录
        if (!item.id) {
          return;
        }

        const prefix =
          item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          `internal${index}`;
        
        
        

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

        // 只更新生产相关的字段
        if (values.hasOwnProperty(`${prefix}WarehouseTime`)) {
          itemData.storage_time = values[`${prefix}WarehouseTime`]
            ? values[`${prefix}WarehouseTime`].format("YYYY-MM-DD")
            : "";
          hasProgressUpdates = true;
        }
        if (
          values.hasOwnProperty(`${prefix}Count`) ||
          values.hasOwnProperty(`${prefix}HardwareCount`)
        ) {
          const countValue =
            values[`${prefix}Count`] || values[`${prefix}HardwareCount`];
          itemData.quantity = countValue ? String(countValue) : "";
          hasProgressUpdates = true;
        }

        progressBatchUpdateData.push(itemData);
      });
      
      // 处理外购项
      externalItems.forEach((item, index) => {
        // 跳过没有ID的记录
        if (!item.id) {
          return;
        }

        const prefix =
          item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          `external${index}`;
        
        
        

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

        // 只更新生产相关的字段
        if (values.hasOwnProperty(`${prefix}WarehouseTime`)) {
          itemData.storage_time = values[`${prefix}WarehouseTime`]
            ? values[`${prefix}WarehouseTime`].format("YYYY-MM-DD")
            : "";
          hasProgressUpdates = true;
        }
        if (
          values.hasOwnProperty(`${prefix}Count`) ||
          values.hasOwnProperty(`${prefix}HardwareCount`)
        ) {
          const countValue =
            values[`${prefix}Count`] || values[`${prefix}HardwareCount`];
          itemData.quantity = countValue ? String(countValue) : "";
          hasProgressUpdates = true;
        }

        progressBatchUpdateData.push(itemData);
      });



      // 执行批量更新
      if (hasProgressUpdates && order?.id) {
        // 发送完整的数据结构，只包含有更新的项目
        const filteredUpdateData = progressBatchUpdateData
          .filter(item => {
            // 根据 item_type 生成正确的前缀，与表单渲染逻辑保持一致
            const originalItem = progressData.find(p => p.id === item.id);
            let prefix;
            if (originalItem?.item_type === "internal") {
              // 使用与表单渲染相同的索引计算方式
              const internalItems = progressData.filter(p => p.item_type === "internal");
              const internalIndex = internalItems.findIndex(p => p.id === item.id);
              prefix = item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || `internal${internalIndex}`;
            } else {
              // 使用与表单渲染相同的索引计算方式
              const externalItems = progressData.filter(p => p.item_type === "external");
              const externalIndex = externalItems.findIndex(p => p.id === item.id);
              prefix = item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || `external${externalIndex}`;
            }
            return values.hasOwnProperty(`${prefix}WarehouseTime`) || 
                   values.hasOwnProperty(`${prefix}Count`) || 
                   values.hasOwnProperty(`${prefix}HardwareCount`);
          })
          .filter(item => item.id !== undefined) as (Partial<ProductionProgressData> & { id: number })[];
        
  
        
        if (filteredUpdateData.length > 0) {
          progressUpdatePromises.push(
            batchUpdateProductionProgress(order.id, filteredUpdateData)
          );
        }
      }

      // 分别等待不同类型的Promise
      if (productionUpdatePromises.length > 0) {
        await Promise.all(productionUpdatePromises);
      }
      if (progressUpdatePromises.length > 0) {
        await Promise.all(progressUpdatePromises);
      }

      if (
        productionUpdatePromises.length > 0 ||
        progressUpdatePromises.length > 0
      ) {
        message.success("生产进度更新成功！");
        // 格式化返回值
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
      } else {
        message.warning("没有检测到需要更新的数据");
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
      title="生产进度更新"
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
        <Card title="车间进度" className={styles.card}>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item label="下料日期" name="cuttingDate">
                <DatePicker
                  placeholder="请选择日期"
                  className={styles.fullWidth}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="预计出货日期" name="expectedShipmentDate">
                <DatePicker
                  placeholder="请选择日期"
                  className={styles.fullWidth}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        
        <Card title="成品入库进度">
          {/* 厂内生产项 */}
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionTitle}>厂内生产项</h3>
            <Row gutter={16}>
              {progressData
                .filter((item) => item.item_type === "internal")
                .map((item, index) => {
                  const prefix =
                    item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || `internal${index}`;

                  return (
                    <Col span={12} key={`internal-warehouse-${index}`}>
                      <div className={styles.itemCard}>
                        <h4 className={styles.itemTitle}>
                          {item.category_name}
                        </h4>
                        <Form.Item
                          label="实际入库时间"
                          name={`${prefix}WarehouseTime`}
                          className={styles.formItem}
                        >
                          <DatePicker
                            placeholder="选择入库时间"
                            className={styles.fullWidth}
                          />
                        </Form.Item>
                        <Form.Item
                          label="件数"
                          name={`${prefix}Count`}
                          className={styles.formItem}
                        >
                          <Input
                            placeholder="请输入件数"
                            className={styles.fullWidth}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                  );
                })}
            </Row>
          </div>

          {/* 外购项 */}
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionTitle}>外购项</h3>
            <Row gutter={16}>
              {progressData
                .filter((item) => item.item_type === "external")
                .map((item, index) => {
                  const prefix =
                    item.category_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || `external${index}`;

                  return (
                    <Col span={12} key={`external-warehouse-${index}`}>
                      <div className={styles.itemCard}>
                        <h4 className={styles.itemTitle}>
                          {item.category_name}
                        </h4>
                        <Form.Item
                          label="实际入库时间"
                          name={`${prefix}WarehouseTime`}
                          className={styles.formItem}
                        >
                          <DatePicker
                            placeholder="选择入库时间"
                            className={styles.fullWidth}
                          />
                        </Form.Item>
                        <Form.Item
                          label="件数"
                          name={`${prefix}Count`}
                          className={styles.formItem}
                        >
                          <Input
                            placeholder="请输入件数"
                            className={styles.fullWidth}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                  );
                })}
            </Row>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default ProductionProgressModal;