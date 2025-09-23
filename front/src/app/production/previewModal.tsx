import React from "react";
import { Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined } from "@ant-design/icons";
import { ProductionOrder } from "../../services/productionApi";
import PermissionService from "@/utils/permissions";

interface PreviewModalProps {
  visible: boolean;
  onCancel: () => void;
  data: ProductionOrder[];
  loading?: boolean;
  title?: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onCancel,
  data,
  loading = false,
  title = "生产数据预览",
}) => {
  // 创建预览用的列定义，去除操作列
  const previewColumns: ColumnsType<ProductionOrder> = [
    {
      title: "订单编号",
      dataIndex: "order_number",
      key: "order_number",
      width: 120,
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 150,
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "address",
      width: 200,
      ellipsis: true,
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "是否安装",
      dataIndex: "is_installation",
      key: "is_installation",
      width: 100,
      render: (value: boolean) => <span>{value ? "是" : "否"}</span>,
    },
    {
      title: "客户打款日期",
      dataIndex: "customer_payment_date",
      key: "customer_payment_date",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "拆单下单日期",
      dataIndex: "split_order_date",
      key: "split_order_date",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "下单天数",
      dataIndex: "order_days",
      key: "order_days",
      width: 100,
      render: (value: string, record: ProductionOrder) => {
        if (record.split_order_date && record.customer_payment_date) {
          const splitDate = new Date(record.split_order_date);
          const paymentDate = new Date(record.customer_payment_date);
          // 计算逻辑：拆单下单日期 - 客户打款日期
          const diffTime = splitDate.getTime() - paymentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return `${diffDays}天`;
        }
        return value ? `${value}天` : "-";
      },
    },
    {
      title: "预计交货日期",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "采购状态",
      dataIndex: "purchase_status",
      key: "purchase_status",
      width: 200,
      render: (text: string) => {
        if (!text) {
          return "-";
        }

        const items = text.split("; ");
        return (
          <div>
            {items.map((item, index) => {
              const parts = item.split(":");
              const name = parts[0];
              const status = parts[1];

              if (parts.length >= 2 && name !== undefined) {
                const isCompleted = status && status.trim() !== "";
                return (
                  <div key={index}>
                    {isCompleted ? (
                      <CheckOutlined
                        style={{ color: "green", marginRight: "4px" }}
                      />
                    ) : (
                      <span style={{ marginRight: "18px" }} />
                    )}
                    {name}: {status ? status : "-"}
                  </div>
                );
              } else {
                return (
                  <div key={index} style={{ marginLeft: "20px" }}>
                    {name}: -
                  </div>
                );
              }
            })}
          </div>
        );
      },
    },
    {
      title: "成品入库数量",
      dataIndex: "finished_goods_quantity",
      key: "finished_goods_quantity",
      render: (text: string, record: ProductionOrder) => {
        if (!text) return "-";

        const statusParts = text.split(";");
        return (
          <div>
            {statusParts.map((part, index) => {
              const [item, quantity] = part.split(":");

              return (
                <div key={index} style={{ marginBottom: 4 }}>
                  <span>{item.trim()}: </span>
                  <span>{quantity ? `${quantity.trim()}件` : "-"}</span>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "材料数量",
      dataIndex: "materialQuantity",
      key: "materialQuantity",
      width: 120,
      render: (value, record: ProductionOrder) => {
        return (
          <div>
            <div>18板：{record.board_18 ? `${record.board_18}张` : "-"}</div>
            <div>09板：{record.board_09 ? `${record.board_09}张` : "-"}</div>
          </div>
        );
      },
    },
    {
      title: "下料日期",
      dataIndex: "cutting_date",
      key: "cutting_date",
      width: 120,
      render: (text: string) => text || "-",
    },
    {
      title: "出货进度",
      dataIndex: "shipmentProgress",
      key: "shipmentProgress",
      width: 200,
      render: (text, record: ProductionOrder) => {
        return (
          <div>
            <div>预计出货日期：{record.expected_shipping_date || "-"}</div>
            <div>实际出货日期：{record.actual_delivery_date || "-"}</div>
          </div>
        );
      },
    },
    {
      title: "订单状态",
      dataIndex: "order_status",
      key: "order_status",
      width: 100,
      render: (text: string) => {
        // 向后兼容旧字段
        const status = text || "";
        let color = "";
        if (status === "已完成") {
          color = "green";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      render: (text: string) => text || "-",
    },
  ];

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="95vw"
      style={{ top: 20 }}
      styles={{
        body: {
          padding: "16px",
        },
      }}
      destroyOnHidden
    >
      <Table
        columns={previewColumns}
        dataSource={data}
        loading={loading}
        bordered
        pagination={false}
        rowKey={(record) => record.id || record.order_number}
        size="small"
        scroll={{ x: "max-content" }}
      />
    </Modal>
  );
};

export default PreviewModal;
