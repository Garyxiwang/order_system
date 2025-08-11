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
      if (item.includes(":")) {
        const [status, time] = item.split(":");
        return {
          id: index.toString(),
          item: status.trim(),
          time: time.trim(),
        };
      }
      return {
        id: index.toString(),
        item: item,
        time: undefined,
      };
    });
  };

  const progressList = parseProgressData(progressData);

  // 表格列定义
  const columns: ColumnsType<ProgressDetailItem> = [
    {
      title: "进度事项",
      dataIndex: "item",
      key: "item",
      width: 300,
      render: (text: string) => (
        <span style={{ fontWeight: '500', color: '#333' }}>{text}</span>
      ),
    },
    {
      title: "完成时间",
      dataIndex: "time",
      key: "time",
      width: 200,
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
      width={700}
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
