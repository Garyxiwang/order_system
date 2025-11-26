"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Card, message, Spin, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDateTime } from "../../utils/dateUtils";
import styles from "./afterSalesModal.module.css";

interface RemainingIssueItem {
  id: string;
  issue_date: string;
  content: string;
  status?: string;
  created_at?: string;
}

interface RemainingIssuesDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  customerName?: string;
}

const RemainingIssuesDetailModal: React.FC<RemainingIssuesDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  customerName,
}) => {
  const [issueList, setIssueList] = useState<RemainingIssueItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取遗留问题数据（模拟数据）
  const fetchIssueData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟数据
      const mockData: RemainingIssueItem[] = [
        {
          id: "1",
          issue_date: "2024-01-15",
          content: "需要更换部分配件",
          status: "待处理",
          created_at: "2024-01-15 10:00:00",
        },
      ];

      setIssueList(mockData);
    } catch (error) {
      message.error("获取遗留问题失败");
      setIssueList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && orderNumber) {
      fetchIssueData();
    }
  }, [visible, orderNumber]);

  const columns: ColumnsType<RemainingIssueItem> = [
    {
      title: "日期",
      dataIndex: "issue_date",
      key: "issue_date",
      width: 150,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: "问题内容",
      dataIndex: "content",
      key: "content",
      render: (text: string) => (
        <div
          style={{
            maxWidth: "400px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text || "-"}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          待处理: "orange",
          处理中: "blue",
          已解决: "green",
          已关闭: "default",
        };
        return (
          <Tag color={colorMap[status || ""] || "default"}>
            {status || "-"}
          </Tag>
        );
      },
    },
  ];

  return (
    <Modal
      title="遗留问题详情"
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
      <Card title="遗留问题明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={issueList}
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

export default RemainingIssuesDetailModal;

