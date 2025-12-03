"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Input,
  DatePicker,
  Button,
  Space,
  message,
  Card,
  Select,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import styles from "./afterSalesModal.module.css";
import {
  getAfterSalesOrders,
  createAfterSalesOrder,
} from "../../services/afterSalesApi";
import AddAfterSalesLogModal from "./addAfterSalesLogModal";
import CreateReorderModal from "./createReorderModal";

const { TextArea } = Input;
const { Option } = Select;

interface AfterSalesLogItem {
  id: string;
  log_date: string;
  content: string;
  feedback_person?: string; // 反馈人
  is_processed?: boolean; // 是否处理
  responsible_person?: string; // 责任人
  created_at?: string;
}

interface AfterSalesLogModalProps {
  visible: boolean;
  onCancel: () => void;
  orderNumber: string;
  onSuccess?: () => void;
}

const AfterSalesLogModal: React.FC<AfterSalesLogModalProps> = ({
  visible,
  onCancel,
  orderNumber,
  onSuccess,
}) => {
  const [logList, setLogList] = useState<AfterSalesLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState<string>("");
  const [tempDate, setTempDate] = useState<dayjs.Dayjs | null>(null);
  const [tempFeedbackPerson, setTempFeedbackPerson] = useState<string>("");
  const [tempIsProcessed, setTempIsProcessed] = useState<boolean>(false);
  const [tempResponsiblePerson, setTempResponsiblePerson] =
    useState<string>("");
  const [afterSalesOrder, setAfterSalesOrder] = useState<{
    order_number: string;
    customer_name: string;
    shipping_address: string;
    designer?: string;
  } | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCreateReorderModalVisible, setIsCreateReorderModalVisible] = useState(false);
  const [selectedLogForReorder, setSelectedLogForReorder] = useState<AfterSalesLogItem | null>(null);

  // 获取售后订单信息
  const fetchAfterSalesOrder = async () => {
    if (!orderNumber) return;

    try {
      const response = await getAfterSalesOrders({
        orderNumber: orderNumber,
        page: 1,
        pageSize: 1,
      });
      if (response.items && response.items.length > 0) {
        setAfterSalesOrder(response.items[0]);
      }
    } catch (err) {
      console.error("获取售后订单信息失败:", err);
    }
  };

  // 获取售后日志数据（模拟数据）
  const fetchLogData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // 模拟数据 - 实际应该调用API
      // const response = await getAfterSalesLogs(orderNumber);

      // 模拟数据
      const mockData: AfterSalesLogItem[] = [
        {
          id: "1",
          log_date: "2024-01-15",
          content: "客户反馈安装完成，整体满意",
          feedback_person: "客户A",
          is_processed: true,
          responsible_person: "设计师1",
          created_at: "2024-01-15 10:00:00",
        },
        {
          id: "2",
          log_date: "2024-01-20",
          content: "回访客户，无问题",
          feedback_person: "客户A",
          is_processed: false,
          responsible_person: "设计师1",
          created_at: "2024-01-20 14:30:00",
        },
      ];

      setLogList(mockData);
    } catch (err) {
      console.error("获取售后日志失败:", err);
      message.error("获取售后日志失败");
      setLogList([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理添加日志成功
  const handleAddLogSuccess = () => {
    setIsAddModalVisible(false);
    fetchLogData();
    if (onSuccess) {
      onSuccess();
    }
  };

  // 编辑日志
  const handleEditLog = (record: AfterSalesLogItem) => {
    setEditingId(record.id);
    setTempContent(record.content);
    setTempFeedbackPerson(record.feedback_person || "");
    setTempIsProcessed(record.is_processed || false);
    setTempResponsiblePerson(record.responsible_person || "");
    if (record.log_date) {
      const date = dayjs(record.log_date);
      setTempDate(date.isValid() ? date : null);
    } else {
      setTempDate(null);
    }
  };

  // 保存日志更新
  const handleSaveLog = async () => {
    if (!editingId || !orderNumber) return;

    setLoading(true);
    try {
      const currentItem = logList.find((item) => item.id === editingId);
      if (!currentItem) return;

      const updateData = {
        log_date: tempDate
          ? tempDate.format("YYYY-MM-DD")
          : currentItem.log_date,
        content: tempContent,
        feedback_person: tempFeedbackPerson,
        is_processed: tempIsProcessed,
        responsible_person: tempResponsiblePerson,
      };

      // 模拟数据 - 实际应该调用API
      // const response = await updateAfterSalesLog(editingId, updateData);

      setLogList(
        logList.map((item) =>
          item.id === editingId ? { ...item, ...updateData } : item
        )
      );
      message.success("售后日志更新成功");
      setEditingId(null);
      setTempContent("");
      setTempDate(null);
      setTempFeedbackPerson("");
      setTempIsProcessed(false);
      setTempResponsiblePerson("");
    } catch (error) {
      console.error("保存售后日志失败:", error);
      message.error("保存售后日志失败");
    } finally {
      setLoading(false);
    }
  };

  // 打开创建补单modal
  const handleCreateOrder = (record: AfterSalesLogItem) => {
    if (!afterSalesOrder) {
      message.error("无法获取售后订单信息");
      return;
    }
    setSelectedLogForReorder(record);
    setIsCreateReorderModalVisible(true);
  };

  // 处理创建补单成功
  const handleCreateReorderSuccess = async (data: {
    reorderDetails: string;
    files: UploadFile[];
    expectedDeliveryDate?: string;
    expectedMaterialDate?: string;
    actualDeliveryDate?: string;
  }) => {
    if (!afterSalesOrder || !selectedLogForReorder) {
      message.error("无法获取售后订单信息");
      return;
    }

    setLoading(true);
    try {
      // 生成新的订单编号（基于原订单编号+后缀）
      const newOrderNumber = `${afterSalesOrder.order_number}-补${Date.now()
        .toString()
        .slice(-6)}`;

      // 处理文件列表（这里可以根据实际需求上传文件到服务器）
      const fileNames = data.files.map((file) => file.name).join(", ");
      const reorderInfo = `补单明细：${data.reorderDetails}\n预计发货时间：${data.expectedDeliveryDate || "未设置"}\n预计齐料时间：${data.expectedMaterialDate || "未设置"}\n实际出货时间：${data.actualDeliveryDate || "未设置"}\n附件：${fileNames || "无"}`;

      // 创建安装补单（安装订单）
      const response = await createAfterSalesOrder({
        order_number: newOrderNumber,
        customer_name: afterSalesOrder.customer_name,
        shipping_address: afterSalesOrder.shipping_address,
        customer_phone: "",
        delivery_date: data.expectedDeliveryDate,
        installation_date: data.actualDeliveryDate,
        is_completed: false,
        is_reorder: true,
        external_purchase_details: reorderInfo,
        designer: afterSalesOrder.designer || "",
        related_person: undefined,
      });

      if (response.code === 200) {
        message.success(`补单创建成功，订单编号：${newOrderNumber}`);
        setIsCreateReorderModalVisible(false);
        setSelectedLogForReorder(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error(response.message || "创建补单失败");
      }
    } catch (error) {
      console.error("创建补单失败:", error);
      message.error("创建补单失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 删除日志
  const handleDeleteLog = async (record: AfterSalesLogItem) => {
    Modal.confirm({
      title: "确认删除该售后日志？",
      content: `日期：${record.log_date}`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        setLoading(true);
        try {
          // 模拟数据 - 实际应该调用API
          // const response = await deleteAfterSalesLog(record.id);

          setLogList(logList.filter((item) => item.id !== record.id));
          message.success("删除成功");
        } catch (error) {
          console.error("删除售后日志失败:", error);
          message.error("删除售后日志失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setTempContent("");
    setTempDate(null);
    setTempFeedbackPerson("");
    setTempIsProcessed(false);
    setTempResponsiblePerson("");
  };

  // 表格列定义
  const columns: ColumnsType<AfterSalesLogItem> = [
    {
      title: "反馈日期",
      dataIndex: "log_date",
      key: "log_date",
      width: 120,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <DatePicker
              value={tempDate}
              onChange={setTempDate}
              format="YYYY-MM-DD"
              size="small"
              placeholder="选择日期"
              className={styles.fullWidth}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "反馈人",
      dataIndex: "feedback_person",
      key: "feedback_person",
      width: 100,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Input
              value={tempFeedbackPerson}
              onChange={(e) => setTempFeedbackPerson(e.target.value)}
              size="small"
              placeholder="反馈人"
              className={styles.fullWidth}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "问题描述",
      dataIndex: "content",
      key: "content",
      width: 200,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <TextArea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              size="small"
              placeholder="请输入内容"
              className={styles.fullWidth}
              rows={2}
            />
          );
        }
        return (
          <div
            style={{
              maxWidth: "200px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {text || "-"}
          </div>
        );
      },
    },
    {
      title: "是否处理",
      dataIndex: "is_processed",
      key: "is_processed",
      width: 100,
      render: (isProcessed: boolean, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Select
              value={tempIsProcessed ? "已处理" : "未处理"}
              onChange={(value) => setTempIsProcessed(value === "已处理")}
              size="small"
              className={styles.fullWidth}
            >
              <Option value="已处理">已处理</Option>
              <Option value="未处理">未处理</Option>
            </Select>
          );
        }
        return (
          <Tag color={isProcessed ? "green" : "orange"}>
            {isProcessed ? "已处理" : "未处理"}
          </Tag>
        );
      },
    },
    {
      title: "责任人",
      dataIndex: "responsible_person",
      key: "responsible_person",
      width: 100,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Input
              value={tempResponsiblePerson}
              onChange={(e) => setTempResponsiblePerson(e.target.value)}
              size="small"
              placeholder="责任人"
              className={styles.fullWidth}
            />
          );
        }
        return text || "-";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      fixed: "right",
      render: (_: unknown, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <div className={styles.buttonContainer}>
              <Button type="primary" size="small" onClick={handleSaveLog}>
                保存
              </Button>
              <Button size="small" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          );
        }
        return (
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => handleEditLog(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleDeleteLog(record)}
              danger
            >
              删除
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => handleCreateOrder(record)}
            >
              创建补单
            </Button>
          </Space>
        );
      },
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    if (visible && orderNumber) {
      fetchAfterSalesOrder();
      fetchLogData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, orderNumber]);

  // 关闭弹窗时重置
  const handleCancel = () => {
    setEditingId(null);
    setTempContent("");
    setTempDate(null);
    setTempFeedbackPerson("");
    setTempIsProcessed(false);
    setTempResponsiblePerson("");
    onCancel();
  };

  return (
    <Modal
      title="售后日志"
      open={visible}
      onCancel={handleCancel}
      width={1400}
      footer={null}
    >
      <div className={styles.bottomMargin}>
        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <Button type="primary" onClick={() => setIsAddModalVisible(true)}>
            添加日志
          </Button>
        </div>
        <Card title="日志详情" size="small">
          <Table
            columns={columns}
            dataSource={logList}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </Card>
      </div>

      {/* 添加日志Modal */}
      <AddAfterSalesLogModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={handleAddLogSuccess}
        orderNumber={orderNumber}
      />

      {/* 创建补单Modal */}
      <CreateReorderModal
        visible={isCreateReorderModalVisible}
        onCancel={() => {
          setIsCreateReorderModalVisible(false);
          setSelectedLogForReorder(null);
        }}
        onSuccess={handleCreateReorderSuccess}
        afterSalesDate={selectedLogForReorder?.log_date}
      />
    </Modal>
  );
};

export default AfterSalesLogModal;
