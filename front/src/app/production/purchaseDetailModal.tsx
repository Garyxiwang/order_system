"use client";

import React from "react";
import { Modal, Descriptions, Card, Table } from "antd";
import { ProductionOrder } from "../../services/productionApi";
import type { ColumnsType } from "antd/es/table";

interface PurchaseDetailModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
}

const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  visible,
  order,
  onCancel,
}) => {
  console.log("PurchaseDetailModal props:", { visible, order });
  if (!order) return null;

  const parseProgressData = () => {
    const tempData = [
      {
        id: "1",
        category: "木门",
        splitOrderDate: "2025-07-01",
        expectedMaterialDate: "2025-07-03",
        warehousingDate: "2025-07-04",
      },
      {
        id: "2",
        category: "柜体",
        splitOrderDate: "2025-07-01",
        expectedMaterialDate: "2025-07-03",
        warehousingDate: "2025-07-04",
      },
      {
        id: "3",
        category: "五金",
        splitOrderDate: "2025-07-01",
        expectedMaterialDate: "2025-07-03",
        warehousingDate: "2025-07-04",
      },
    ];
    return tempData;
  };

  const progressList = parseProgressData();

  // 表格列定义
  const columns: ColumnsType<ProductionOrder> = [
    {
      title: "类目",
      dataIndex: "category",
      key: "category",
      render: (text: string) => (
        <span style={{ fontWeight: "500", color: "#333" }}>{text}</span>
      ),
    },
    {
      title: "下单日期",
      dataIndex: "splitOrderDate",
      key: "splitOrderDate",
    },
    {
      title: "预计齐料日期",
      dataIndex: "expectedMaterialDate",
      key: "expectedMaterialDate",
      render: (time: string) => (
        <span style={{ color: "#666" }}>{time || "-"}</span>
      ),
    },
    {
      title: "实际入库日期",
      dataIndex: "warehousingDate",
      key: "warehousingDate",
      render: (time: string) => (
        <span style={{ color: time ? "#1890ff" : "#999" }}>{time || "-"}</span>
      ),
    },
  ];

  return (
    <Modal
      title="采购状态详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      {/* 订单基本信息区域 */}
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
          title="订单基本信息"
          bordered
          column={2}
          size="small"
          items={[
            {
              key: "orderCode",
              label: "订单编码",
              children: order.orderCode,
            },
            {
              key: "customerName",
              label: "客户名称",
              children: order.customerName,
            },
            {
              key: "deliveryAddress",
              label: "发货地址",
              children: order.deliveryAddress,
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: order.isInstallation ? "是" : "否",
            },
            {
              key: "customerPaymentDate",
              label: "客户打款日期",
              children: order.customerPaymentDate || "-",
            },
            {
              key: "splitOrderDate",
              label: "拆单下单日期",
              children: order.splitOrderDate || "-",
            },
            {
              key: "orderDays",
              label: "下单天数",
              children: order.orderDays ? `${order.orderDays}天` : "-",
            },
          ]}
        />
      </div>

      <Card title="采购状态明细" size="small">
        <Table
          columns={
            columns as ColumnsType<{
              id: string;
              category: string;
              splitOrderDate: string;
              expectedMaterialDate: string;
              warehousingDate: string;
            }>
          }
          dataSource={progressList}
          rowKey="id"
          pagination={false}
          size="small"
          bordered
        />
      </Card>
    </Modal>
  );
};

export default PurchaseDetailModal;
