"use client";

import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Card, Table, message, Spin } from "antd";
import { ProductionOrder } from "../../services/productionApi";
import {
  getProductionProgressList,
  ProductionProgressData,
} from "../../services/productionProgressService";
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
  const [progressList, setProgressList] = useState<ProductionProgressData[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  console.log("PurchaseDetailModal props:", { visible, order });

  // 获取生产进度数据
  const fetchProgressData = async () => {
    if (!order?.id) return;

    setLoading(true);
    try {
      const data = await getProductionProgressList(order.id);
      setProgressList(data);
    } catch (error) {
      console.error("获取生产进度数据失败:", error);
      message.error("获取生产进度数据失败");
      setProgressList([]);
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开且有订单数据时获取进度数据
  useEffect(() => {
    if (visible && order?.id) {
      fetchProgressData();
    }
  }, [visible, order?.id]);

  if (!order) return null;

  // 表格列定义
  const columns: ColumnsType<ProductionProgressData> = [
    {
      title: "类目",
      dataIndex: "category_name",
      key: "category_name",
      render: (text: string) => (
        <span style={{ fontWeight: "500", color: "#333" }}>{text}</span>
      ),
    },
    {
      title: "项目类型",
      dataIndex: "item_type",
      key: "item_type",
      render: (type: string) => (
        <span>{type === "internal" ? "厂内生产项" : "外购项"}</span>
      ),
    },
    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      render: (date: string) => <span>{date || "-"}</span>,
    },
    {
      title: "预计齐料日期",
      dataIndex: "expected_date",
      key: "expected_date",
      render: (_, record: ProductionProgressData) => {
        const expectedDate =
          record.item_type === "internal"
            ? record.expected_material_date
            : record.expected_arrival_date;
        return <span style={{ color: "#666" }}>{expectedDate || "-"}</span>;
      },
    },
    {
      title: "实际齐料日期",
      dataIndex: "actual_date",
      key: "actual_date",
      render: (_, record: ProductionProgressData) => {
        const actualDate =
          record.item_type === "internal"
            ? record.actual_storage_date
            : record.actual_arrival_date;
        return (
          <span style={{ color: actualDate ? "#1890ff" : "#999" }}>
            {actualDate || "-"}
          </span>
        );
      },
    },
    // {
    //   title: "数量",
    //   dataIndex: "quantity",
    //   key: "quantity",
    //   render: (quantity: string) => <span>{quantity || "-"}</span>,
    // },
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
              children: order.order_number,
            },
            {
              key: "customerName",
              label: "客户名称",
              children: order.customer_name,
            },
            {
              key: "deliveryAddress",
              label: "发货地址",
              children: order.address,
            },
            {
              key: "isInstallation",
              label: "是否安装",
              children: order.is_installation ? "是" : "否",
            },
            {
              key: "customerPaymentDate",
              label: "客户打款日期",
              children: order.customer_payment_date || "-",
            },
            {
              key: "splitOrderDate",
              label: "拆单下单日期",
              children: order.split_order_date || "-",
            },
            {
              key: "orderDays",
              label: "下单天数",
              children: order.order_days ? `${order.order_days}天` : "-",
            },
          ]}
        />
      </div>

      <Card title="采购状态明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={progressList}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            locale={{
              emptyText: loading ? "加载中..." : "暂无数据",
            }}
          />
        </Spin>
      </Card>
    </Modal>
  );
};

export default PurchaseDetailModal;
