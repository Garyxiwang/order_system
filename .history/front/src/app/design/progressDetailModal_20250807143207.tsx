"use client";

import React from "react";
import {
  Modal,
  Table,
  Card,
} from "antd";
import type { ColumnsType } from "antd/es/table";

interface ProgressDetailItem {
  id: string;
  item: string;
  time?: string;
}

interface ProgressDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  progressData: string[];
}

const ProgressDetailModal: React.FC<ProgressDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
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
      title: "事项",
      dataIndex: "item",
      key: "item",
      width: 200,
    },
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      width: 150,
      render: (time: string) => time || "-",
    },
  ];

  return (
    <Modal
      title={`进度详情 - ${orderNumber}`}
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      <Card size="small">
        <Table
          columns={columns}
          dataSource={progressList}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </Modal>
  );
};

export default ProgressDetailModal;