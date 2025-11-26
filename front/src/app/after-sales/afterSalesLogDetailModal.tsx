"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Card, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDateTime } from "../../utils/dateUtils";
import styles from "./afterSalesModal.module.css";

interface AfterSalesLogItem {
  id: string;
  log_date: string;
  content: string;
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
      // 模拟数据 - 实际应该调用API
      // const response = await getAfterSalesLogs(orderNumber);
      
      const mockData: AfterSalesLogItem[] = [
        {
          id: "1",
          log_date: "2024-01-15",
          content: "客户反馈安装完成，整体满意",
          created_at: "2024-01-15 10:00:00",
        },
        {
          id: "2",
          log_date: "2024-01-20",
          content: "回访客户，无问题",
          created_at: "2024-01-20 14:30:00",
        },
      ];

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
      title: "日期",
      dataIndex: "log_date",
      key: "log_date",
      width: 150,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: "内容",
      dataIndex: "content",
      key: "content",
      render: (text: string) => (
        <div
          style={{
            maxWidth: "500px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text || "-"}
        </div>
      ),
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

