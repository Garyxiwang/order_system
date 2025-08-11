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
      title: "进度事项",
      dataIndex: "item",
      key: "item",
      width: 120,
    },
    {
      title: "计划日期",
      dataIndex: "plannedDate",
      key: "plannedDate",
      width: 120,
    },
    {
      title: "实际日期",
      dataIndex: "actualDate",
      key: "actualDate",
      width: 120,
    },
  ];

  return (
    <Modal
      title={`进度详情 - 订单编号：${orderNumber}`}
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