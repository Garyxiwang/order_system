"use client";

import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Card, Table, message, Spin } from "antd";
import { ProductionOrder } from "../../services/productionApi";
import {
  getProductionProgressList,
  ProductionProgressData,
} from "../../services/productionProgressService";
import type { ColumnsType } from "antd/es/table";

interface FinishedGoodsDetailModalProps {
  visible: boolean;
  order: ProductionOrder | null;
  onCancel: () => void;
}

const FinishedGoodsDetailModal: React.FC<FinishedGoodsDetailModalProps> = ({
  visible,
  order,
  onCancel,
}) => {
  const [progressList, setProgressList] = useState<ProductionProgressData[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  console.log("FinishedGoodsDetailModal props:", { visible, order });

  // 获取生产进度数据
  const fetchProgressData = async () => {
    if (!order?.id) return;

    setLoading(true);
    try {
      const data = await getProductionProgressList(order.id);
      // 显示所有项目（厂内和外购）的成品入库数据
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
      title: "实际入库日期",
      dataIndex: "storage_time",
      key: "storage_time",
      render: (time: string) => <span>{time || "-"}</span>,
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: string) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>
          {quantity ? `${quantity}件` : "-"}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={`成品入库详情 - ${order.order_number}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单编号">
              {order.order_number}
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">
              {order.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="厂内生产项">
              {order.internal_production_items || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {order.order_status}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <Card title="成品入库进度详情" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={progressList}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{
              emptyText: loading ? "加载中..." : "暂无成品入库数据",
            }}
          />
        </Spin>
      </Card>
    </Modal>
  );
};

export default FinishedGoodsDetailModal;
