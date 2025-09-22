"use client";

import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Card, Table, message, Spin } from "antd";
import { SplitOrder, ProductionItem } from "../../services/splitApi";
import {
  splitProgressApi,
  SplitProgressItem,
} from "../../services/splitProgressApi";
import type { ColumnsType } from "antd/es/table";

interface ProgressDetailModal {
  visible: boolean;
  order: SplitOrder | null;
  onCancel: () => void;
  itemType?: "internal" | "external"; // 项目类型：厂内生产项或外购项
}

const ProgressDetailModal: React.FC<
  ProgressDetailModal
> = ({ visible, order, onCancel, itemType = "internal" }) => {
  const [progressList, setProgressList] = useState<SplitProgressItem[]>([]);
  const [loading, setLoading] = useState(false);

  console.log("InternalProductionDetailModal props:", { visible, order });

  // 获取拆单进度数据
  const fetchProgressData = async () => {
    if (!order?.id) return;

    setLoading(true);
    try {
      const data = await splitProgressApi.getProgressList(order.id);
      // 根据itemType筛选对应的项目类型
      const filteredItems = data.filter(
        (item) => item.item_type === itemType
      );
      setProgressList(filteredItems);
    } catch (error) {
      console.error("获取拆单进度数据失败:", error);
      message.error("获取拆单进度数据失败");
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
  const columns: ColumnsType<SplitProgressItem> = [
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
        title: itemType === "internal" ? "计划拆单日期" : "计划下单日期",
      dataIndex: "planned_date",
      key: "planned_date",
      render: (date: string) => (
        <span style={{ color: "#666" }}>{date || "-"}</span>
      ),
    },
    {
      title: itemType === "internal" ? "实际拆单日期" : "实际下单日期",
      dataIndex: itemType === "internal" ? "split_date" : "purchase_date",
      key: itemType === "internal" ? "split_date" : "purchase_date",
      render: (date: string) => (
        <span style={{ color: date ? "#1890ff" : "#999" }}>{date || "-"}</span>
      ),
    },
  ];

  return (
    <Modal
      title={itemType === "internal" ? "厂内生产项详情" : "外购项详情"}
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
              key: "splitter",
              label: "拆单员",
              children: order.splitter || "-",
            },
            {
              key: "orderDate",
              label: "下单日期",
              children: order.order_date || "-",
            },
            {
              key: "completionDate",
              label: "完成日期",
              children: order.completion_date || "-",
            },
            {
              key: "orderStatus",
              label: "订单状态",
              children: order.order_status || "-",
            },
          ]}
        />
      </div>

      <Card title={itemType === "internal" ? "厂内生产项明细" : "外购项明细"} size="small">
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

export default ProgressDetailModal;
