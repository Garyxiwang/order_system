import React from "react";
import { Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SplitOrder, ProductionItem } from "../../services/splitApi";
import { formatDateTime } from "../../utils/dateUtils";
import PermissionService from "@/utils/permissions";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

interface PreviewModalProps {
  visible: boolean;
  onCancel: () => void;
  data: SplitOrder[];
  loading?: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onCancel,
  data,
  loading = false,
}) => {
  // 创建预览用的列定义，与拆单管理页面保持一致，去除操作列
  const previewColumns: ColumnsType<SplitOrder> = [
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
      width: 90,
    },
    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      width: 120,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "拆单员",
      dataIndex: "splitter",
      key: "splitter",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "厂内生产项",
      dataIndex: "internal_production_items",
      key: "internal_production_items",
      width: 200,
      render: (items: ProductionItem[] | string, record: SplitOrder) => {
        if (!items) return "-";

        let productionItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          productionItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
              cycle_days: parts[2] || "",
            };
          });
        }
        if (!productionItems || productionItems.length === 0) return null;

        return (
          <div>
            {productionItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;
              const cycleDays = item.cycle_days;

              if (actualDate) {
                const cycleNumber = parseInt(cycleDays || "0") || 0;
                const isOverThreeDays = cycleNumber >= 3;
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}:{" "}
                    <span
                      style={{ color: isOverThreeDays ? "red" : "inherit" }}
                    >
                      {cycleDays}
                    </span>
                  </div>
                );
              } else {
                const currentDate = new Date();
                const orderDate = record.order_date
                  ? new Date(record.order_date)
                  : null;
                const daysPassed = orderDate
                  ? Math.floor(
                      (currentDate.getTime() - orderDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div key={index}>
                    <CloseOutlined
                      style={{ color: "red", marginRight: "4px" }}
                    />
                    {name}: -{" "}
                    <span
                      style={{
                        color: daysPassed >= 3 ? "red" : "inherit",
                        marginLeft: "4px",
                      }}
                    >
                      逾期: {daysPassed}天
                    </span>
                  </div>
                );
              }
            })}
          </div>
        );
      },
    },
    {
      title: "外购项",
      dataIndex: "external_purchase_items",
      key: "external_purchase_items",
      width: 200,
      render: (items: ProductionItem[] | string, record: SplitOrder) => {
        if (!items) return "-";
        let purchaseItems: ProductionItem[] = [];

        // 处理字符串格式的数据（格式："类目:实际时间:消耗时间"）
        if (typeof items === "string" && items) {
          const itemStrings: string[] = items.split(",");
          purchaseItems = itemStrings.map((item: string) => {
            const parts: string[] = item.split(":");
            return {
              category_name: parts[0] || "",
              actual_date: parts[1] && parts[1] !== "-" ? parts[1] : undefined,
              cycle_days: parts[2] || "",
            };
          });
        }
        if (!purchaseItems || purchaseItems.length === 0) return null;

        return (
          <div>
            {purchaseItems.map((item: ProductionItem, index: number) => {
              const name = item.category_name || "";
              const actualDate = item.actual_date;
              const cycleDays = item.cycle_days;

              if (actualDate) {
                const cycleNumber = parseInt(cycleDays || "0") || 0;
                const isOverThreeDays = cycleNumber >= 3;
                return (
                  <div key={index}>
                    <CheckOutlined
                      style={{ color: "green", marginRight: "4px" }}
                    />
                    {name}: {actualDate}:{" "}
                    <span
                      style={{ color: isOverThreeDays ? "red" : "inherit" }}
                    >
                      {cycleDays}
                    </span>
                  </div>
                );
              } else {
                const currentDate = new Date();
                const orderDate = record.order_date
                  ? new Date(record.order_date)
                  : null;
                const daysPassed = orderDate
                  ? Math.floor(
                      (currentDate.getTime() - orderDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div key={index}>
                    <CloseOutlined
                      style={{ color: "red", marginRight: "4px" }}
                    />
                    {name}: -{" "}
                    <span
                      style={{
                        color: daysPassed >= 3 ? "red" : "inherit",
                        marginLeft: "4px",
                      }}
                    >
                      逾期: {daysPassed}天
                    </span>
                  </div>
                );
              }
            })}
          </div>
        );
      },
    },
    {
      title: "报价状态",
      dataIndex: "quote_status",
      key: "quote_status",
      width: 100,
      render: (text: string) => {
        const status = text || "";
        let color = "";
        if (status === "已打款") {
          color = "green";
        } else if (status === "未打款") {
          color = "red";
        }
        return <span style={{ color }}>{status || "-"}</span>;
      },
    },
    {
      title: "完成日期",
      dataIndex: "completion_date",
      key: "completion_date",
      width: 120,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "订单类型",
      dataIndex: "order_type",
      key: "order_type",
      width: 100,
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
      width: 100,
      render: (text: string) => text || "-",
    },
    {
      title: "面积信息",
      key: "area_info",
      width: 150,
      render: (text: string, record: SplitOrder) => {
        const cabinetArea = record.cabinet_area;
        const wallPanelArea = record.wall_panel_area;
        return (
          <div>
            <div>柜体面积: {cabinetArea ? `${cabinetArea}㎡` : "-"}</div>
            <div>墙板面积: {wallPanelArea ? `${wallPanelArea}㎡` : "-"}</div>
          </div>
        );
      },
    },
    ...(PermissionService.canViewOrderAmount()
      ? [
          {
            title: "订单金额",
            dataIndex: "order_amount",
            key: "order_amount",
            width: 120,
            render: (text: string) => (
              <div>
                {text
                  ? `¥${Number(text).toLocaleString("zh-CN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-"}
              </div>
            ),
          },
        ]
      : []),
    {
      title: "订单状态",
      dataIndex: "order_status",
      key: "order_status",
      width: 100,
      render: (text: string, record: SplitOrder) => {
        const status = text || record.order_status || "";
        let color = "";
        if (status === "已下单") {
          color = "green";
        } else if (status === "拆单中") {
          color = "blue";
        } else if (status === "撤销中") {
          color = "red";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
      width: 150,
      render: (text: string) => {
        const remark = text;
        return (
          <div
            style={{
              maxWidth: "150px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {remark || "-"}
          </div>
        );
      },
    },
  ];

  return (
    <Modal
      title="拆单数据预览"
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
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default PreviewModal;
