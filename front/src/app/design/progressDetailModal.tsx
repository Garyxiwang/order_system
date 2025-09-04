"use client";

import React from "react";
import { Modal, Table, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import styles from "./progressDetailModal.module.css";

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
  const parseProgressData = (data: string[]): ProgressDetailItem[] => {
    const tempData = [
      {
        id: "1",
        item: "量尺",
        estimatedTime: "2025-07-01",
        actualTime: "2025-07-01",
        note: "这是个备注1",
      },
      {
        id: "2",
        item: "初稿",
        estimatedTime: "2025-07-03",
        actualTime: "2025-07-04",
        note: "",
      },
      {
        id: "3",
        item: "已报价未打款",
        estimatedTime: "2025-07-05",
        actualTime: "2025-07-05",
        note: "",
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
      width: 150,
      render: (text: string) => (
        <span className={styles.itemText}>{text}</span>
      ),
    },
    {
      title: "计划时间",
      dataIndex: "estimatedTime",
      key: "estimatedTime",
      width: 150,
      render: (time: string) => (
        <span className={styles.plannedTime}>{time || "-"}</span>
      ),
    },
    {
      title: "实际时间",
      dataIndex: "actualTime",
      key: "actualTime",
      width: 150,
      render: (time: string) => (
        <span className={time ? styles.actualTimeCompleted : styles.actualTimePending}>{time || "-"}</span>
      ),
    },
    {
      title: "备注",
      dataIndex: "note",
      key: "note",
      width: 200,
    },
  ];

  return (
    <Modal
      title="设计详情"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <div className={styles.infoContainer}>
        <Card size="small" className={styles.infoCard}>
          <div className={styles.infoText}>
            <span className={styles.label}>
              订单编号：
            </span>
            {orderNumber}
            {orderName && (
              <span className={styles.customerName}>
                <span className={styles.label}>
                  客户名称：
                </span>
                {orderName}
              </span>
            )}
          </div>
        </Card>
      </div>
      <Card title="设计进度明细" size="small">
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
