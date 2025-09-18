import React from "react";
import { Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined } from "@ant-design/icons";
import { DesignOrder } from "../../services/designApi";
import { formatDateTime } from "../../utils/dateUtils";
import PermissionService from "@/utils/permissions";

interface PreviewModalProps {
  visible: boolean;
  onCancel: () => void;
  data: DesignOrder[];
  loading?: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onCancel,
  data,
  loading = false,
}) => {
  // 创建预览用的列定义，去除操作列
  const previewColumns: ColumnsType<DesignOrder> = [
    {
      title: "序号",
      key: "index",
      width: 60,
      align: "center" as const,
      render: (_: unknown, __: DesignOrder, index: number) => index + 1,
    },
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
      width: 120,
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "address",
      width: 200,
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
      width: 100,
      render: (text: string) => (text ? text : "-"),
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
      width: 100,
      render: (text: string) => (text ? text : "-"),
    },
    {
      title: "分单日期",
      dataIndex: "assignment_date",
      key: "assignment_date",
      width: 120,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "设计过程",
      dataIndex: "design_process",
      key: "design_process",
      width: 300,
      render: (text: string) => {
        if (!text || text === "暂无进度") return "-";
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        // 解析进度项目，分离事件名和实际时间
        const parseProgressItem = (item: string) => {
          if (item.includes(":")) {
            const [status, time] = item.split(":");
            return { status: status.trim(), time: time.trim() };
          }
          return { status: item, time: null };
        };

        // 显示所有进度项目
        return (
          <div>
            {items.map((item, itemIndex) => {
              const { status, time } = parseProgressItem(item);

              return (
                <div key={itemIndex} style={{ marginBottom: "2px" }}>
                  {time && time !== "-" ? (
                    <span>
                      <CheckOutlined
                        style={{ color: "green", marginRight: "4px" }}
                      />
                      {status}：
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {time}
                      </span>
                    </span>
                  ) : (
                    <span
                      style={{ display: "inline-block", marginLeft: "15px" }}
                    >
                      {status}：-
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "下单类目",
      dataIndex: "category_name",
      key: "category_name",
      width: 150,
      render: (categories: string[] | string) => {
        if (!categories) return "-";

        // 处理字符串类型的情况（兼容旧数据）
        const categoryArray = Array.isArray(categories)
          ? categories
          : categories
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);

        if (categoryArray.length === 0) return "-";

        return (
          <div>
            {categoryArray.map((category, index) => (
              <div key={index}>{category}</div>
            ))}
          </div>
        );
      },
    },
    {
      title: "下单日期",
      dataIndex: "order_date",
      key: "order_date",
      width: 120,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "设计周期",
      dataIndex: "design_cycle",
      key: "design_cycle",
      width: 100,
      render: (cycle: string) => {
        if (!cycle) return "-";
        const days = parseInt(cycle);
        let color = "default";
        if (days <= 3) {
          color = "green";
        } else if (days > 3 && days <= 20) {
          color = "orange";
        } else if (days > 20) {
          color = "red";
        }
        return <Tag color={color}>{days}天</Tag>;
      },
    },
    {
      title: "订单类型",
      dataIndex: "order_type",
      key: "order_type",
      width: 100,
    },
    {
      title: "是否安装",
      dataIndex: "is_installation",
      key: "is_installation",
      width: 100,
      render: (text: boolean) => <div>{text ? "是" : "否"}</div>,
    },
    {
      title: "面积信息",
      key: "area_info",
      width: 150,
      render: (text: string, record: DesignOrder) => {
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
      render: (text: string) => {
        // 如果已下单，显示已完成
        if (text === "下单") {
          return <Tag color="blue">待下单</Tag>;
        }
        if (text === "已下单") {
          return <Tag color="green">{text}</Tag>;
        }
        if (text === "已撤销" || text === "暂停") {
          return <Tag color="red">{text}</Tag>;
        }

        return <Tag color="blue">{text}</Tag>;
      },
    },
    {
      title: "备注",
      dataIndex: "remarks",
      key: "remarks",
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
  ];

  return (
    <Modal
      title="设计数据预览"
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
        rowKey={(record) => record.order_number}
        size="small"
      />
    </Modal>
  );
};

export default PreviewModal;
