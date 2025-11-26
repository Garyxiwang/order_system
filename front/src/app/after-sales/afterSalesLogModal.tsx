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
  Checkbox,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import styles from "./afterSalesModal.module.css";
import { createDesignOrder } from "../../services/designApi";
import { getAfterSalesOrders } from "../../services/afterSalesApi";
import AddAfterSalesLogModal from "./addAfterSalesLogModal";

const { TextArea } = Input;
const { Option } = Select;

interface AfterSalesLogItem {
  id: string;
  log_date: string;
  content: string;
  feedback_person?: string; // 反馈人
  is_processed?: boolean; // 是否处理
  has_beauty?: boolean; // 是否有美容
  beauty_processed?: boolean; // 美容是否处理
  after_sales_type?: string; // 售后类型：问题单、裁撤单
  modification_details?: string; // 裁改明细
  modification_reason?: string; // 裁改原因
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
  const [tempHasBeauty, setTempHasBeauty] = useState<boolean>(false);
  const [tempBeautyProcessed, setTempBeautyProcessed] = useState<boolean>(false);
  const [tempAfterSalesType, setTempAfterSalesType] = useState<string>("");
  const [tempModificationDetails, setTempModificationDetails] = useState<string>("");
  const [tempModificationReason, setTempModificationReason] = useState<string>("");
  const [tempResponsiblePerson, setTempResponsiblePerson] = useState<string>("");
  const [afterSalesOrder, setAfterSalesOrder] = useState<{
    order_number: string;
    customer_name: string;
    shipping_address: string;
    designer?: string;
  } | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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
          has_beauty: false,
          beauty_processed: false,
          after_sales_type: "问题单",
          created_at: "2024-01-15 10:00:00",
        },
        {
          id: "2",
          log_date: "2024-01-20",
          content: "回访客户，无问题",
          feedback_person: "客户A",
          is_processed: true,
          has_beauty: true,
          beauty_processed: true,
          after_sales_type: "裁撤单",
          modification_details: "需要更换部分配件",
          modification_reason: "质量问题",
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
    setTempHasBeauty(record.has_beauty || false);
    setTempBeautyProcessed(record.beauty_processed || false);
    setTempAfterSalesType(record.after_sales_type || "");
    setTempModificationDetails(record.modification_details || "");
    setTempModificationReason(record.modification_reason || "");
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
        has_beauty: tempHasBeauty,
        beauty_processed: tempBeautyProcessed,
        after_sales_type: tempAfterSalesType,
        modification_details: tempModificationDetails,
        modification_reason: tempModificationReason,
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
      setTempHasBeauty(false);
      setTempBeautyProcessed(false);
      setTempAfterSalesType("");
      setTempModificationDetails("");
      setTempModificationReason("");
      setTempResponsiblePerson("");
    } catch (error) {
      console.error("保存售后日志失败:", error);
      message.error("保存售后日志失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建订单
  const handleCreateOrder = async (record: AfterSalesLogItem) => {
    if (!afterSalesOrder) {
      message.error("无法获取售后订单信息");
      return;
    }

    Modal.confirm({
      title: "确认创建订单",
      content: `确定要为此售后日志创建设计订单吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        setLoading(true);
        try {
          // 生成新的订单编号（基于原订单编号+后缀）
          const newOrderNumber = `${afterSalesOrder.order_number}-${Date.now()}`;
          
          const response = await createDesignOrder({
            order_number: newOrderNumber,
            customer_name: afterSalesOrder.customer_name,
            address: afterSalesOrder.shipping_address,
            designer: afterSalesOrder.designer || "",
            salesperson: afterSalesOrder.designer || "",
            assignment_date: dayjs().format("YYYY-MM-DD"),
            design_process: "",
            category_name: "",
            order_status: "未下单",
            order_type: "设计单",
            design_cycle: "0",
            remarks: `由售后日志创建，原订单：${orderNumber}，售后类型：${record.after_sales_type || "问题单"}`,
            is_installation: false,
          });

          if (response.code === 200) {
            message.success(`订单创建成功，订单编号：${newOrderNumber}`);
            if (onSuccess) {
              onSuccess();
            }
          } else {
            message.error(response.message || "创建订单失败");
          }
        } catch (error) {
          console.error("创建订单失败:", error);
          message.error("创建订单失败，请稍后重试");
        } finally {
          setLoading(false);
        }
      },
    });
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
    setTempHasBeauty(false);
    setTempBeautyProcessed(false);
    setTempAfterSalesType("");
    setTempModificationDetails("");
    setTempModificationReason("");
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
      title: "售后类型",
      dataIndex: "after_sales_type",
      key: "after_sales_type",
      width: 100,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Select
              value={tempAfterSalesType}
              onChange={setTempAfterSalesType}
              size="small"
              placeholder="选择类型"
              className={styles.fullWidth}
            >
              <Option value="问题单">问题单</Option>
              <Option value="裁撤单">裁撤单</Option>
            </Select>
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
            <Checkbox
              checked={tempIsProcessed}
              onChange={(e) => setTempIsProcessed(e.target.checked)}
            >
              是
            </Checkbox>
          );
        }
        return isProcessed ? "是" : "否";
      },
    },
    {
      title: "是否有美容",
      dataIndex: "has_beauty",
      key: "has_beauty",
      width: 100,
      render: (hasBeauty: boolean, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Checkbox
              checked={tempHasBeauty}
              onChange={(e) => setTempHasBeauty(e.target.checked)}
            >
              是
            </Checkbox>
          );
        }
        return hasBeauty ? "是" : "否";
      },
    },
    {
      title: "美容是否处理",
      dataIndex: "beauty_processed",
      key: "beauty_processed",
      width: 120,
      render: (beautyProcessed: boolean, record: AfterSalesLogItem) => {
        if (editingId === record.id) {
          return (
            <Checkbox
              checked={tempBeautyProcessed}
              onChange={(e) => {
                setTempBeautyProcessed(e.target.checked);
                if (!e.target.checked && !tempHasBeauty) {
                  setTempBeautyProcessed(false);
                }
              }}
              disabled={!tempHasBeauty}
            >
              是
            </Checkbox>
          );
        }
        return beautyProcessed ? "是" : "否";
      },
    },
    {
      title: "裁改明细",
      dataIndex: "modification_details",
      key: "modification_details",
      width: 150,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id && tempAfterSalesType === "裁撤单") {
          return (
            <TextArea
              value={tempModificationDetails}
              onChange={(e) => setTempModificationDetails(e.target.value)}
              size="small"
              placeholder="裁改明细"
              className={styles.fullWidth}
              rows={2}
            />
          );
        }
        if (record.after_sales_type === "裁撤单") {
          return (
            <div
              style={{
                maxWidth: "150px",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {text || "-"}
            </div>
          );
        }
        return "-";
      },
    },
    {
      title: "裁改原因",
      dataIndex: "modification_reason",
      key: "modification_reason",
      width: 150,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id && tempAfterSalesType === "裁撤单") {
          return (
            <TextArea
              value={tempModificationReason}
              onChange={(e) => setTempModificationReason(e.target.value)}
              size="small"
              placeholder="裁改原因"
              className={styles.fullWidth}
              rows={2}
            />
          );
        }
        if (record.after_sales_type === "裁撤单") {
          return (
            <div
              style={{
                maxWidth: "150px",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {text || "-"}
            </div>
          );
        }
        return "-";
      },
    },
    {
      title: "责任人",
      dataIndex: "responsible_person",
      key: "responsible_person",
      width: 100,
      render: (text: string, record: AfterSalesLogItem) => {
        if (editingId === record.id && tempAfterSalesType === "裁撤单") {
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
        if (record.after_sales_type === "裁撤单") {
          return text || "-";
        }
        return "-";
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
              创建订单
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
    setTempHasBeauty(false);
    setTempBeautyProcessed(false);
    setTempAfterSalesType("");
    setTempModificationDetails("");
    setTempModificationReason("");
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
        <div style={{ marginBottom: 16, textAlign: "right" }}>
          <Button
            type="primary"
            onClick={() => setIsAddModalVisible(true)}
          >
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
    </Modal>
  );
};

export default AfterSalesLogModal;
