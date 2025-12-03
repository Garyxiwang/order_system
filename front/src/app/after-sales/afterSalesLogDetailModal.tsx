"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Card, message, Spin, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDateTime } from "../../utils/dateUtils";
import styles from "./afterSalesModal.module.css";
import { mockLogsStorage } from "./addAfterSalesLogModal";

interface AfterSalesLogItem {
  id: string;
  log_date: string;
  content: string;
  feedback_person?: string; // 反馈人
  is_processed?: boolean; // 是否处理
  responsible_person?: string; // 责任人
  created_at?: string;
}

interface AfterSalesLogDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  customerName?: string;
}

const AfterSalesLogDetailModal: React.FC<AfterSalesLogDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  customerName,
}) => {
  const [logList, setLogList] = useState<AfterSalesLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取售后日志数据（模拟数据）
  const fetchLogData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 从mock存储中获取数据
      const mockData = mockLogsStorage[orderNumber] || [];

      setLogList(mockData);
    } catch (error) {
      message.error("获取售后日志失败");
      setLogList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && orderNumber) {
      fetchLogData();
    }
  }, [visible, orderNumber]);

  const columns: ColumnsType<AfterSalesLogItem> = [
    {
      title: "反馈日期",
      dataIndex: "log_date",
      key: "log_date",
      width: 120,
      render: (text: string) => (text ? formatDateTime(text) : "-"),
    },
    {
      title: "反馈人",
      dataIndex: "feedback_person",
      key: "feedback_person",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "问题描述",
      dataIndex: "content",
      key: "content",
      width: 200,
      render: (text: string) => (
        <div
          style={{
            maxWidth: "200px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text || "-"}
        </div>
      ),
    },
    {
      title: "是否处理",
      dataIndex: "is_processed",
      key: "is_processed",
      width: 100,
      render: (isProcessed: boolean) => (
        <Tag color={isProcessed ? "green" : "orange"}>
          {isProcessed ? "已处理" : "未处理"}
        </Tag>
      ),
    },
    {
      title: "责任人",
      dataIndex: "responsible_person",
      key: "responsible_person",
      width: 100,
      render: (text: string) => text || "-",
    },
  ];

  return (
    <Modal
      title="售后日志详情"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <div className={styles.bottomMargin}>
        <Card size="small">
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16 }}>订单编号：{orderNumber}</span>
            {customerName && (
              <span>客户名称：{customerName}</span>
            )}
          </div>
        </Card>
      </div>
      <Card title="售后日志明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={logList}
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

export default AfterSalesLogDetailModal;

