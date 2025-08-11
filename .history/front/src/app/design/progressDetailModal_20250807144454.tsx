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
    return data.map((item, index) => {
      // 假设数据格式为 "事项|预计时间|实际时间" 或 "事项|预计时间" 或 "事项"
      const parts = item.split("|");
      return {
        id: index.toString(),
        item: parts[0]?.trim() || item,
        estimatedTime: parts[1]?.trim() || undefined,
        actualTime: parts[2]?.trim() || undefined,
      };
    });
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
        <span style={{ fontWeight: '500', color: '#333' }}>{text}</span>
      ),
    },
    {
      title: "预计时间",
      dataIndex: "estimatedTime",
      key: "estimatedTime",
      width: 150,
      render: (time: string) => (
        <span style={{ color: '#666' }}>
          {time || "未设定"}
        </span>
      ),
    },
    {
      title: "实际时间",
      dataIndex: "actualTime",
      key: "actualTime",
      width: 150,
      render: (time: string) => (
        <span style={{ color: time ? '#1890ff' : '#999' }}>
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
        <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <span style={{ fontWeight: 'bold', color: '#333' }}>订单编号：</span>{orderNumber}
            {orderName && (
              <span style={{ marginLeft: 16 }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>客户名称：</span>{orderName}
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
