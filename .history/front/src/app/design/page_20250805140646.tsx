"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Input, Select, Row, Col, Tag, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import CreateOrderModal from "../../components/CreateOrderModal";
import { getDesignOrders, createDesignOrder, updateDesignOrder, type DesignOrder } from "../../services/designApi";

const { Option } = Select;

const DesignPage: React.FC = () => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DesignOrder | null>(null);
  const [designData, setDesignData] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const showModal = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const showEditModal = (record: DesignOrder) => {
    console.log("record", record);
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // 处理下单操作
  const handlePlaceOrder = (record: DesignOrder) => {
    Modal.confirm({
      title: '确认下单',
      content: `确定要为订单 ${record.orderNumber} 下单吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const response = await updateDesignOrder(record.orderNumber, {
            ...record,
            state: '已下单',
          });
          
          if (response.code === 200) {
            message.success('下单成功');
            await loadDesignData(); // 重新加载数据
          } else {
            message.error(response.message || '下单失败');
          }
        } catch (error) {
          message.error('下单失败，请稍后重试');
          console.error('下单失败:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleOk = async (values: {
    orderNumber: string;
    customerName: string;
    orderAddress: string;
    orderType: string;
    designer: string;
    salesperson: string;
    categories: string[];
    splitDate?: string;
    orderStatus: string;
    progressDetail: string;
    remark?: string;
  }) => {
    try {
      setLoading(true);
      
      if (editingRecord) {
        // 编辑模式
        const response = await updateDesignOrder(editingRecord.orderNumber, {
          customerName: values.customerName,
          address: values.orderAddress,
          designer: values.designer,
          salesperson: values.salesperson,
          splitTime: values.splitDate || '',
          progressDetail: values.progressDetail,
          category: values.categories.join(','),
          orderType: values.orderType,
          remark: values.remark || '',
        });
        
        if (response.code === 200) {
          message.success('更新成功');
        } else {
          message.error(response.message || '更新失败');
          return;
        }
      } else {
        // 新增模式
        const response = await createDesignOrder({
          customerName: values.customerName,
          address: values.orderAddress,
          designer: values.designer,
          salesperson: values.salesperson,
          splitTime: values.splitDate || '',
          progress: '',
          progressDetail: values.progressDetail,
          category: values.categories.join(','),
          cycle: '0',
          state: '未下单',
          orderType: values.orderType,
          remark: values.remark || '',
        });
        
        if (response.code === 200) {
          message.success('创建成功');
        } else {
          message.error(response.message || '创建失败');
          return;
        }
      }
      
      // 重新加载数据
      await loadDesignData();
      setIsModalVisible(false);
      setEditingRecord(null);
    } catch (error) {
      message.error('操作失败，请稍后重试');
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // 加载设计订单数据
  const loadDesignData = async () => {
    try {
      setLoading(true);
      const response = await getDesignOrders();
      if (response.code === 200) {
        setDesignData(response.data);
      } else {
        message.error(response.message || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败，请稍后重试');
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadDesignData();
  }, []);

  const columns: ColumnsType<DesignOrder> = [
    {
      title: "订单编号",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "客户名称",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "customerName",
    },
    {
      title: "设计师",
      dataIndex: "designer",
      key: "designer",
    },
    {
      title: "销售员",
      dataIndex: "salesperson",
      key: "salesperson",
    },
    {
      title: "分单日期",
      dataIndex: "splitTime",
      key: "splitTime",
    },
    {
      title: "进度过程",
      dataIndex: "progress",
      key: "progress",
      render: (
        text: string,
        record: DesignOrder,
        index: number
      ) => {
        if (!text) return "-";
        const items = text
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        const isExpanded = expandedRows.has(index);
        const shouldShowExpand = items.length > 3;
        const displayItems = isExpanded ? items : items.slice(0, 3);

        const toggleExpand = () => {
          const newExpandedRows = new Set(expandedRows);
          if (isExpanded) {
            newExpandedRows.delete(index);
          } else {
            newExpandedRows.add(index);
          }
          setExpandedRows(newExpandedRows);
        };

        // 解析进度项目，分离状态和时间
        const parseProgressItem = (item: string) => {
          if (item.includes(":")) {
            const [status, time] = item.split(":");
            return { status: status.trim(), time: time.trim() };
          }
          return { status: item, time: null };
        };

        return (
          <div>
            {displayItems.map((item, itemIndex) => {
              const { status, time } = parseProgressItem(item);

              return (
                <div key={itemIndex}>
                  {time ? (
                    <span>
                      {status}{" "}
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        ({time})
                      </span>
                    </span>
                  ) : (
                    <span>{status}</span>
                  )}
                </div>
              );
            })}
            {shouldShowExpand && !isExpanded && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={toggleExpand}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  展开
                </Button>
              </div>
            )}
            {shouldShowExpand && isExpanded && (
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Button
                  type="link"
                  size="small"
                  onClick={toggleExpand}
                  style={{ padding: "0 4px", fontSize: "12px" }}
                >
                  收起
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "进度详情",
      dataIndex: "progressDetail",
      key: "progressDetail",
      render: (text: string) => {
        if (!text) return "-";
        return text;
      },
    },
    {
      title: "下单类目",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "设计周期",
      dataIndex: "cycle",
      key: "cycle",
      render: (text: string) => {
        if (!text) return "-";

        // 提取数字部分
        const match = text.match(/(\d+)/);
        const days = match ? parseInt(match[1]) : 0;

        let color = "#000"; // 默认黑色
        if (days > 50) {
          color = "#ff4d4f"; // 红色 - 大于50天
        } else if (days > 20) {
          color = "#faad14"; // 橙色 - 大于20天
        }

        return <span style={{ color }}>{text} 天</span>;
      },
    },
    {
      title: "订单状态",
      dataIndex: "state",
      key: "state",
      render: (text: string) => {
        if (text === "已下单") {
          return <Tag color="green">{text}</Tag>;
        }
        return text;
      },
    },
    {
      title: "订单类型",
      dataIndex: "orderType",
      key: "orderType",
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text: string) => (
        <div
          style={{
            maxWidth: "150px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text || "-"}
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: DesignOrder) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Button type="link" size="small">
            更新进度
          </Button>
          <Button type="link" size="small">
            下单
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 搜索Card */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <Row gutter={24}>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单编号：
              </label>
              <Input
                placeholder="请输入"
                className="rounded-md border-gray-200 flex-1"
                size="middle"
                allowClear
              />
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单名称：
              </label>
              <Input
                placeholder="请输入"
                className="rounded-md border-gray-200 flex-1"
                size="middle"
                allowClear
              />
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单状态：
              </label>
              <Select
                placeholder="全部状态"
                className="rounded-md flex-1"
                size="middle"
                defaultValue={"-1"}
                allowClear
              >
                <Option value="-1">未下单</Option>
                <Option value="1">已下单</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                设计师：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designer1">设计师1</Option>
                <Option value="designer2">设计师2</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-12">
                销售员：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designer1">销售员1</Option>
                <Option value="designer2">销售员2</Option>
                <Option value="designer2">销售员3</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                进度详情：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="designing">正常进行中</Option>
                <Option value="reviewing">等硬装</Option>
                <Option value="completed">客户待打款</Option>
                <Option value="completed">待客户确认</Option>
                <Option value="completed">其他</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                进度事项：
              </label>
              <Select
                placeholder="全部"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="normal">量尺</Option>
                <Option value="important">初稿</Option>
                <Option value="urgent">已报价未打款</Option>
                <Option value="urgent">已打款</Option>
                <Option value="urgent">已下单</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                订单类型：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                allowClear
              >
                <Option value="design">设计单</Option>
                <Option value="development">拆单订单</Option>
              </Select>
            </div>
          </Col>
          <Col span={6} className="py-2">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm font-medium text-gray-700 min-w-16">
                设计周期：
              </label>
              <Select
                placeholder="请选择"
                className="rounded-md flex-1"
                size="middle"
                defaultValue={"20"}
                allowClear
              >
                <Option value="20">大于20天</Option>
                <Option value="50">大于50天</Option>
              </Select>
            </div>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col span={24} className="text-right">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="middle"
                className="bg-blue-600 hover:bg-blue-700"
              >
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 内容Card */}
      <Card variant="outlined">
        {/* 新增按钮 */}
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={showModal}
          >
            创建订单
          </Button>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={designData}
          loading={loading}
          bordered={false}
          pagination={{ pageSize: 10 }}
          rowClassName="hover:bg-blue-50"
          rowKey={(record) => record.orderNumber}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* 新增订单Modal */}
      <CreateOrderModal
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        initialValues={
          editingRecord
            ? {
                orderNumber: editingRecord.orderNumber as string,
                customerName: editingRecord.customerName as string,
                orderAddress: editingRecord.address as string,
                orderType: editingRecord.orderType as string,
                designer: editingRecord.designer as string,
                salesperson: editingRecord.salesperson as string,
                splitDate: editingRecord.splitTime as string,
                orderStatus: editingRecord.state as string,
                progressDetail: editingRecord.progressDetail as string,
                categories:
                  (editingRecord.category as string)?.split(",") || [],
                remark: editingRecord.remark as string,
              }
            : undefined
        }
      />
    </div>
  );
};

export default DesignPage;
