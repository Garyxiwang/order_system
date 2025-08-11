"use client";

import React from "react";
import { Modal, Table, Card } from "antd";
import type { ColumnsType } from "antd/es/table";

interface ProgressDetailItem {
  id: string;
  item: string;
  estimatedTime?: string;
  actualTime?: string;
}

interface ProgressDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  orderName: string;
  progressData: string[];
}

const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  orderName,
  progressData,
}) => {
  // 解析进度数据
  const parseProgressData = (data: string[]): ProgressDetailItem[] => {
    const tempData = [
      {
        id: "1",
        item: "量尺",
        estimatedTime: "2025-07-01",
        actualTime: "2025-07-01",
      },
      {
        id: "2",
        item: "初稿",
        estimatedTime: "2025-07-03",
        actualTime: "2025-07-04",
      },
      {
        id: "3",
        item: "已报价未打款",
        estimatedTime: "2025-07-05",
        actualTime: "2025-07-05",
      },
    ];
    return tempData;
  };

  const progressList = parseProgressData(progressData);

  // 表格列定义
  const columns: ColumnsType<ProgressDetailItem> = [
    {
      title: "事项",
      dataIndex: "item",
      key: "item",
      width: 250,
      render: (text: string) => (
        <span style={{ fontWeight: "500", color: "#333" }}>{text}</span>
      ),
    },
    {
      title: "计划时间",
      dataIndex: "estimatedTime",
      key: "estimatedTime",
      width: 150,
      render: (time: string) => (
        <span style={{ color: "#666" }}>{time || "未设定"}</span>
      ),
    },
    {
      title: "实际时间",
      dataIndex: "actualTime",
      key: "actualTime",
      width: 150,
      render: (time: string) => (
        <span style={{ color: time ? "#1890ff" : "#999" }}>
          {time || "未完成"}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title="进度详情"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small" style={{ backgroundColor: "#f8f9fa" }}>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <span style={{ fontWeight: "bold", color: "#333" }}>
              订单编号：
            </span>
            {orderNumber}
            {orderName && (
              <span style={{ marginLeft: 16 }}>
                <span style={{ fontWeight: "bold", color: "#333" }}>
                  客户名称：
                </span>
                {orderName}
              </span>
            )}
          </div>
        </Card>
      </div>
      <Card title="进度明细" size="small">
        <Table
          columns={columns}
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

export default ProgressDetailModal;
