"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Card, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDateTime } from "../../utils/dateUtils";
import styles from "./afterSalesModal.module.css";

interface FollowUpItem {
  id: string;
  follow_up_date: string;
  content: string;
  created_at?: string;
}

interface FollowUpDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  customerName?: string;
}

const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  customerName,
}) => {
  const [followUpList, setFollowUpList] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取回访情况数据（模拟数据）
  const fetchFollowUpData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟数据
      const mockData: FollowUpItem[] = [
        {
          id: "1",
          follow_up_date: "2024-01-25",
          content: "客户满意，无问题",
          created_at: "2024-01-25 10:00:00",
        },
      ];

      setFollowUpList(mockData);
    } catch (error) {
      message.error("获取回访情况失败");
      setFollowUpList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && orderNumber) {
      fetchFollowUpData();
    }
  }, [visible, orderNumber]);

  const columns: ColumnsType<FollowUpItem> = [
    {
      title: "日期",
      dataIndex: "follow_up_date",
      key: "follow_up_date",
      width: 150,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: "回访内容",
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
      title="回访情况详情"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <div className={styles.bottomMargin}>
        <Card size="small">
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16 }}>订单编号：{orderNumber}</span>
            {customerName && <span>客户名称：{customerName}</span>}
          </div>
        </Card>
      </div>
      <Card title="回访情况明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={followUpList}
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

export default FollowUpDetailModal;

