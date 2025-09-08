"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Card, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import styles from "./progressDetailModal.module.css";
import {
  getProgressByOrderId,
  type ProgressData,
} from "../../services/progressService";

interface ProgressDetailItem {
  id: string;
  item: string;
  estimatedTime?: string;
  actualTime?: string;
  note?: string;
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
}) => {
  const [progressList, setProgressList] = useState<ProgressDetailItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取进度数据
  const fetchProgressData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      const response = await getProgressByOrderId(orderNumber);

      if (
        response.code === 200 &&
        response?.data?.items &&
        Array.isArray(response.data.items)
      ) {
        // 将API数据转换为表格数据格式
        const progressData: ProgressDetailItem[] = response.data.items.map(
          (item: ProgressData, index: number) => ({
            id: item.id?.toString() || (index + 1).toString(),
            item: item.task_item,
            estimatedTime: item.planned_date || "-",
            actualTime: item.actual_date || "-",
            note: item.remarks || "",
          })
        );
        setProgressList(progressData);
      } else {
        message.warning(response.message || "暂无进度数据");
        setProgressList([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      message.error(`获取进度数据失败: ${errorMessage}`);
      setProgressList([]);
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开且有订单号时获取数据
  useEffect(() => {
    if (visible && orderNumber) {
      fetchProgressData();
    }
  }, [visible, orderNumber]);

  // 表格列定义
  const columns: ColumnsType<ProgressDetailItem> = [
    {
      title: "事项",
      dataIndex: "item",
      key: "item",
      width: 150,
      render: (text: string) => <span className={styles.itemText}>{text}</span>,
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
        <span
          className={
            time ? styles.actualTimeCompleted : styles.actualTimePending
          }
        >
          {time || "-"}
        </span>
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
            <span className={styles.label}>订单编号：</span>
            {orderNumber}
            {orderName && (
              <span className={styles.customerName}>
                <span className={styles.label}>客户名称：</span>
                {orderName}
              </span>
            )}
          </div>
        </Card>
      </div>
      <Card title="设计进度明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={progressList}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: loading ? "加载中..." : "暂无数据" }}
          />
        </Spin>
      </Card>
    </Modal>
  );
};

export default ProgressDetailModal;
