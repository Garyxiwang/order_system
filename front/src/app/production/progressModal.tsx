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
import styles from "./progressModal.module.css";

interface ProgressModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
  onOk: (values: Partial<ProductionOrder>) => void;
  modalType: "progress" | "purchase";
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  order,
  onCancel,
  onOk,
  modalType,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && order) {
      form.setFieldsValue({
        // 厂内生产项 - 木门
        doorOrderDate: null,
        doorExpectedMaterialDate: order.expectedMaterialDate
          ? dayjs(order.expectedMaterialDate)
          : null,
        doorActualWarehouseDate: null,

        // 厂内生产项 - 柜体
        cabinetOrderDate: null,
        cabinetExpectedMaterialDate: order.expectedMaterialDate
          ? dayjs(order.expectedMaterialDate)
          : null,
        cabinetActualWarehouseDate: null,

        // 外购项 - 石材
        stoneOrderDate: null,
        stoneExpectedArrivalDate: null,
        stoneActualArrivalDate: null,

        // 外购项 - 板材
        boardOrderDate: null,
        boardExpectedArrivalDate: null,
        boardActualArrivalDate: null,

        // 车间进度相关
        cuttingDate: order.cuttingDate ? dayjs(order.cuttingDate) : null,
        warehouseDate: order.warehouseDate ? dayjs(order.warehouseDate) : null,
        expectedShipmentDate: order.expectedShipmentDate
          ? dayjs(order.expectedShipmentDate)
          : null,

        // 成品入库进度 - 厂内生产项
        doorWarehouseTime: null,
        doorHardwareCount: null,
        cabinetWarehouseTime: null,
        cabinetHardwareCount: null,

        // 成品入库进度 - 外购项
        stoneWarehouseTime: null,
        stoneCount: null,
        boardWarehouseTime: null,
        boardCount: null,
      });
    }
  }, [visible, order, form]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formattedValues = {
        // 厂内生产项 - 木门
        doorOrderDate: values.doorOrderDate
          ? values.doorOrderDate.format("YYYY-MM-DD")
          : null,
        doorExpectedMaterialDate: values.doorExpectedMaterialDate
          ? values.doorExpectedMaterialDate.format("YYYY-MM-DD")
          : null,
        doorActualWarehouseDate: values.doorActualWarehouseDate
          ? values.doorActualWarehouseDate.format("YYYY-MM-DD")
          : null,
        // 厂内生产项 - 柜体
        cabinetOrderDate: values.cabinetOrderDate
          ? values.cabinetOrderDate.format("YYYY-MM-DD")
          : null,
        cabinetExpectedMaterialDate: values.cabinetExpectedMaterialDate
          ? values.cabinetExpectedMaterialDate.format("YYYY-MM-DD")
          : null,
        cabinetActualWarehouseDate: values.cabinetActualWarehouseDate
          ? values.cabinetActualWarehouseDate.format("YYYY-MM-DD")
          : null,
        // 外购项 - 石材
        stoneOrderDate: values.stoneOrderDate
          ? values.stoneOrderDate.format("YYYY-MM-DD")
          : null,
        stoneExpectedArrivalDate: values.stoneExpectedArrivalDate
          ? values.stoneExpectedArrivalDate.format("YYYY-MM-DD")
          : null,
        stoneActualArrivalDate: values.stoneActualArrivalDate
          ? values.stoneActualArrivalDate.format("YYYY-MM-DD")
          : null,
        // 外购项 - 板材
        boardOrderDate: values.boardOrderDate
          ? values.boardOrderDate.format("YYYY-MM-DD")
          : null,
        boardExpectedArrivalDate: values.boardExpectedArrivalDate
          ? values.boardExpectedArrivalDate.format("YYYY-MM-DD")
          : null,
        boardActualArrivalDate: values.boardActualArrivalDate
          ? values.boardActualArrivalDate.format("YYYY-MM-DD")
          : null,
        // 车间进度相关
        cuttingDate: values.cuttingDate
          ? values.cuttingDate.format("YYYY-MM-DD")
          : null,
        warehouseDate: values.warehouseDate
          ? values.warehouseDate.format("YYYY-MM-DD")
          : null,
        expectedShipmentDate: values.expectedShipmentDate
          ? values.expectedShipmentDate.format("YYYY-MM-DD")
          : null,

        // 成品入库进度 - 厂内生产项
        doorWarehouseTime: values.doorWarehouseTime
          ? values.doorWarehouseTime.format("YYYY-MM-DD")
          : null,
        doorHardwareCount: values.doorHardwareCount || null,
        cabinetWarehouseTime: values.cabinetWarehouseTime
          ? values.cabinetWarehouseTime.format("YYYY-MM-DD")
          : null,
        cabinetHardwareCount: values.cabinetHardwareCount || null,

        // 成品入库进度 - 外购项
        stoneWarehouseTime: values.stoneWarehouseTime
          ? values.stoneWarehouseTime.format("YYYY-MM-DD")
          : null,
        stoneCount: values.stoneCount || null,
        boardWarehouseTime: values.boardWarehouseTime
          ? values.boardWarehouseTime.format("YYYY-MM-DD")
          : null,
        boardCount: values.boardCount || null,
      };
      onOk(formattedValues);
      message.success("生产进度更新成功！");
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

  if (!order) {
    return null;
  }

  return (
    <Modal
      title={modalType === "progress" ? "生产进度更新" : "采购状态更新"}
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
              children: order.orderCode || "-",
            },
            {
              key: "customerName",
              label: "客户名称",
              children: order.customerName || "-",
            },
            {
              key: "deliveryAddress",
              label: "发货地址",
              children: order.deliveryAddress || "-",
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: order.isInstallation ? "是" : "否",
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
        {/* 根据modalType显示不同内容 */}
        {modalType === "purchase" && (
          <Card title="采购状态">
            {/* 厂内生产项 */}
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>厂内生产项</h3>

              <Row gutter={16}>
                {/* 木门 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>木门材料</h4>
                    <div className={styles.dateInfoRow}>
                      <label className={styles.dateLabel}>下单日期:</label>
                      <span className={styles.dateValue}>
                        {form.getFieldValue("doorOrderDate")
                          ? dayjs(form.getFieldValue("doorOrderDate")).format(
                              "YYYY-MM-DD"
                            )
                          : "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="预计齐料日期"
                      name="doorExpectedMaterialDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择预计齐料日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="实际入库日期"
                      name="doorActualWarehouseDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择实际入库日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>

                {/* 柜体 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>柜体材料</h4>
                    <div className={styles.dateInfoRow}>
                      <label className={styles.dateLabel}>下单日期:</label>
                      <span className={styles.dateValue}>
                        {form.getFieldValue("cabinetOrderDate")
                          ? dayjs(
                              form.getFieldValue("cabinetOrderDate")
                            ).format("YYYY-MM-DD")
                          : "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="预计齐料日期"
                      name="cabinetExpectedMaterialDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择预计齐料日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="实际入库日期"
                      name="cabinetActualWarehouseDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择实际入库日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 外购项 */}
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>外购项</h3>

              <Row gutter={16}>
                {/* 石材 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>石材</h4>
                    <div className={styles.dateInfoRow}>
                      <label className={styles.dateLabel}>下单日期:</label>
                      <span className={styles.dateValue}>
                        {form.getFieldValue("stoneOrderDate")
                          ? dayjs(form.getFieldValue("stoneOrderDate")).format(
                              "YYYY-MM-DD"
                            )
                          : "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="预计到厂日期"
                      name="stoneExpectedArrivalDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择预计到厂日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="实际到厂日期"
                      name="stoneActualArrivalDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择实际到厂日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>

                {/* 板材 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>板材</h4>
                    <div className={styles.dateInfoRow}>
                      <label className={styles.dateLabel}>下单日期:</label>
                      <span className={styles.dateValue}>
                        {form.getFieldValue("boardOrderDate")
                          ? dayjs(form.getFieldValue("boardOrderDate")).format(
                              "YYYY-MM-DD"
                            )
                          : "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="预计到厂日期"
                      name="boardExpectedArrivalDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择预计到厂日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="实际到厂日期"
                      name="boardActualArrivalDate"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择实际到厂日期"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        )}

        {modalType === "progress" && (
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
        )}
        {modalType === "progress" && (
          <Card title="成品入库进度">
            {/* 厂内生产项 */}
            <div className={styles.sectionContainer}>
              <h3 className={styles.sectionTitle}>厂内生产项</h3>

              <Row gutter={16}>
                {/* 木门 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>木门</h4>
                    <Form.Item
                      label="入库时间"
                      name="doorWarehouseTime"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择入库时间"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="件数"
                      name="doorHardwareCount"
                      className={styles.formItem}
                    >
                      <Input
                        placeholder="请输入件数"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>

                {/* 柜体 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>柜体</h4>
                    <Form.Item
                      label="入库时间"
                      name="cabinetWarehouseTime"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择入库时间"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="件数"
                      name="cabinetHardwareCount"
                      className={styles.formItem}
                    >
                      <Input
                        placeholder="请输入件数"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>
                {/* 五金 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>五金</h4>
                    <Form.Item
                      label="入库时间"
                      name="doorWarehouseTime"
                      className={styles.formItem}
                    >
                      <DatePicker
                        placeholder="选择入库时间"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                    <Form.Item
                      label="件数"
                      name="doorHardwareCount"
                      className={styles.formItem}
                    >
                      <Input
                        placeholder="请输入件数"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>
                
              </Row>
            </div>

            {/* 外购项 */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>外购项</h3>

              <Row gutter={16}>
                {/* 石材 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>石材</h4>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>入库时间:</span>
                      <span className={styles.infoValue}>
                        {order?.stoneWarehouseTime || "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="件数"
                      name="stoneCount"
                      className={styles.formItem}
                    >
                      <Input
                        placeholder="请输入件数"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>

                {/* 板材 */}
                <Col span={12}>
                  <div className={styles.itemCard}>
                    <h4 className={styles.itemTitle}>板材</h4>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>入库时间:</span>
                      <span className={styles.infoValue}>
                        {order?.boardWarehouseTime || "2025-07-01"}
                      </span>
                    </div>
                    <Form.Item
                      label="件数"
                      name="boardCount"
                      className={styles.formItem}
                    >
                      <Input
                        placeholder="请输入件数"
                        className={styles.fullWidth}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        )}
      </Form>
    </Modal>
  );
};

export default ProgressModal;
