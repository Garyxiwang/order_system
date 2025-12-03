"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Table, Card, message, Spin, Button, Space, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDateTime } from "../../utils/dateUtils";
import styles from "./afterSalesModal.module.css";
import { getAfterSalesOrders, deleteAfterSalesOrder, type AfterSalesOrder } from "../../services/afterSalesApi";
import EditReorderModal from "./editReorderModal";

interface ReorderDetailItem {
  id: string;
  order_number: string;
  customer_name: string;
  reorder_details: string;
  files?: string; // 附件列表
  expected_delivery_date?: string;
  expected_material_date?: string;
  actual_delivery_date?: string;
  created_at?: string;
  originalOrder?: AfterSalesOrder; // 保存原始订单数据，用于编辑
}

interface ReorderDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  customerName?: string;
}

const ReorderDetailModal: React.FC<ReorderDetailModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  customerName,
}) => {
  const [reorderList, setReorderList] = useState<ReorderDetailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingReorder, setEditingReorder] = useState<ReorderDetailItem | null>(null);

  // 获取补单数据
  const fetchReorderData = useCallback(async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 查询所有补单（订单编号包含原订单编号的补单）
      const response = await getAfterSalesOrders({
        orderNumber: `${orderNumber}-补`,
        no_pagination: true,
      });

      if (response.items && response.items.length > 0) {
        // 解析补单信息
        const reorderItems: ReorderDetailItem[] = response.items
          .filter((item) => item.is_reorder === true)
          .map((item) => {
            // 从external_purchase_details中解析补单信息
            const details = item.external_purchase_details || "";
            const lines = details.split("\n");
            let reorderDetails = "";
            let expectedDeliveryDate = "";
            let expectedMaterialDate = "";
            let actualDeliveryDate = "";

            let files = "";
            lines.forEach((line) => {
              if (line.startsWith("补单明细：")) {
                reorderDetails = line.replace("补单明细：", "");
              } else if (line.startsWith("预计发货时间：")) {
                expectedDeliveryDate = line.replace("预计发货时间：", "").replace("未设置", "");
              } else if (line.startsWith("预计齐料时间：")) {
                expectedMaterialDate = line.replace("预计齐料时间：", "").replace("未设置", "");
              } else if (line.startsWith("实际出货时间：")) {
                actualDeliveryDate = line.replace("实际出货时间：", "").replace("未设置", "");
              } else if (line.startsWith("附件：")) {
                files = line.replace("附件：", "").replace("无", "");
              }
            });

            return {
              id: item.id?.toString() || "",
              order_number: item.order_number,
              customer_name: item.customer_name,
              reorder_details: reorderDetails,
              files: files,
              expected_delivery_date: expectedDeliveryDate || item.delivery_date,
              expected_material_date: expectedMaterialDate,
              actual_delivery_date: actualDeliveryDate || item.installation_date,
              created_at: item.created_at,
              originalOrder: item, // 保存原始订单数据
            };
          });

        setReorderList(reorderItems);
      } else {
        setReorderList([]);
      }
    } catch (error) {
      console.error("获取补单数据失败:", error);
      message.error("获取补单数据失败");
      setReorderList([]);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (visible && orderNumber) {
      fetchReorderData();
    }
  }, [visible, orderNumber, fetchReorderData]);

  // 编辑补单
  const handleEditReorder = (record: ReorderDetailItem) => {
    setEditingReorder(record);
    setIsEditModalVisible(true);
  };

  // 删除补单
  const handleDeleteReorder = async (record: ReorderDetailItem) => {
    if (!record.originalOrder?.id) {
      message.error("无法获取补单ID");
      return;
    }

    try {
      setLoading(true);
      const response = await deleteAfterSalesOrder(record.originalOrder.id.toString());
      
      if (response.code === 200) {
        message.success("删除补单成功");
        // 重新加载数据
        await fetchReorderData();
      } else {
        message.error(response.message || "删除失败");
      }
    } catch (error) {
      console.error("删除补单失败:", error);
      message.error("删除补单失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑成功
  const handleEditSuccess = async () => {
    setIsEditModalVisible(false);
    setEditingReorder(null);
    await fetchReorderData();
  };

  // 处理文件下载
  const handleDownloadFile = async (fileName: string, reorderOrderNumber?: string) => {
    try {
      // 实际应该从服务器获取文件URL
      // const fileUrl = await getFileDownloadUrl(fileName, reorderOrderNumber);
      // 实际使用时，应该使用类似这样的代码：
      // const response = await fetch(`/api/v1/files/download?fileName=${fileName}&orderNumber=${reorderOrderNumber}`);
      // const blob = await response.blob();
      
      // 模拟文件下载（实际应该使用真实的文件URL）
      // 这里创建一个临时的blob来模拟下载
      console.log(`下载文件：${fileName}，订单编号：${reorderOrderNumber || "未知"}`);
      const blob = new Blob(["这是模拟的文件内容"], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`正在下载：${fileName}`);
    } catch (error) {
      console.error("下载文件失败:", error);
      message.error(`下载文件失败：${fileName}`);
    }
  };

  const columns: ColumnsType<ReorderDetailItem> = [
    {
      title: "补单编号",
      dataIndex: "order_number",
      key: "order_number",
      width: 150,
    },
    {
      title: "补单明细",
      dataIndex: "reorder_details",
      key: "reorder_details",
      width: 200,
      render: (text: string, record: ReorderDetailItem) => (
        <div>
          <div
            style={{
              maxWidth: "200px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
              marginBottom: record.files ? 8 : 0,
            }}
          >
            {text || "-"}
          </div>
          {record.files && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
              <span style={{ marginRight: 4 }}>附件：</span>
              {record.files.split(", ").filter((f) => f.trim()).map((fileName, index, array) => (
                <span key={index}>
                  <Button
                    type="link"
                    size="small"
                    style={{ 
                      padding: 0, 
                      height: "auto", 
                      fontSize: "12px",
                      color: "#1890ff",
                      textDecoration: "underline"
                    }}
                    onClick={() => handleDownloadFile(fileName.trim(), record.order_number)}
                  >
                    {fileName.trim()}
                  </Button>
                  {index < array.length - 1 && <span style={{ margin: "0 4px" }}>、</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "补单时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (text: string) => (text ? formatDateTime(text) : "-"),
    },
    {
      title: "预计发货时间",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      width: 150,
      render: (text: string) => (text ? formatDateTime(text) : "-"),
    },
    {
      title: "预计齐料时间",
      dataIndex: "expected_material_date",
      key: "expected_material_date",
      width: 150,
      render: (text: string) => (text ? formatDateTime(text) : "-"),
    },
    {
      title: "实际出货时间",
      dataIndex: "actual_delivery_date",
      key: "actual_delivery_date",
      width: 150,
      render: (text: string) => (text ? formatDateTime(text) : "-"),
    },

    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_: unknown, record: ReorderDetailItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleEditReorder(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该补单？"
            onConfirm={() => handleDeleteReorder(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="补单详情"
      open={visible}
      onCancel={onCancel}
      width={1200}
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
      <Card title="补单明细" size="small">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={reorderList}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: loading ? "加载中..." : "暂无补单数据" }}
          />
        </Spin>
      </Card>

      {/* 编辑补单Modal */}
      {editingReorder && editingReorder.originalOrder && (
        <EditReorderModal
          visible={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingReorder(null);
          }}
          onSuccess={handleEditSuccess}
          reorderOrder={editingReorder.originalOrder}
        />
      )}
    </Modal>
  );
};

export default ReorderDetailModal;

