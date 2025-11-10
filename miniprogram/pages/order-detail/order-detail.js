// pages/order-detail/order-detail.js
let orderService;

try {
  orderService = require("../../services/orderService.js");
} catch (e) {
  console.error("模块加载失败:", e);
  orderService = null;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    headerPaddingTop: 30,
    headerHeight: 0,
    orderId: null,
    orderNumber: null,
    orderDetail: null,
    loading: false,
    expandedSections: {
      order_info: true, // 默认打开订单信息
      design_progress: true, // 默认打开设计进度
      split_progress: true, // 默认打开拆单进度
      production_progress: true, // 默认打开生产进度
      // 生产进度子项
      production_basic: true,
      production_purchase: true,
      production_storage: true,
      production_material: true,
      production_shipping: true,
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const headerPaddingTop = statusBarHeight * 2 + 30;

    const headerHeight = statusBarHeight * 2 + 25;
    this.setData({
      statusBarHeight: statusBarHeight,
      headerPaddingTop: headerPaddingTop,
      headerHeight: headerHeight,
    });

    if (options.order_number) {
      // 使用订单编号查询（新接口）
      this.setData({
        orderNumber: options.order_number,
      });
      this.loadOrderDetail();
    } else if (options.id) {
      // 兼容旧方式，使用订单ID查询
      this.setData({
        orderId: parseInt(options.id),
      });
      this.loadOrderDetail();
    } else {
      wx.showToast({
        title: "订单信息不存在",
        icon: "none",
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: "订单详情",
    });
  },

  /**
   * 加载订单详情
   */
  loadOrderDetail() {
    if (this.data.loading) {
      return;
    }

    if (!orderService) {
      wx.showToast({
        title: "服务未加载，请重试",
        icon: "none",
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      loading: true,
    });

    // 优先使用订单编号查询（新接口）
    if (this.data.orderNumber) {
      orderService
        .getOrderDetailByNumber(this.data.orderNumber)
        .then((res) => {
          // api.js 已经处理了响应，res 直接是数据对象
          const data = res;
          // 确保 order_info 存在
          if (!data.order_info) {
            data.order_info = {};
          }
          // 处理下单类目，按逗号分割成数组
          if (data.order_info.category_name) {
            data.order_info.category_list = data.order_info.category_name.split(',').map(item => item.trim()).filter(item => item);
          } else {
            data.order_info.category_list = [];
          }
          // 后端已经处理了状态前缀，直接使用
          // 添加状态颜色
          if (data.order_info && data.order_info.order_status) {
            data.order_info.statusColor = this.getStatusColor(
              data.order_info.order_status
            );
          }
          // 格式化金额
          if (data.order_info && data.order_info.order_amount) {
            data.order_info.formatted_amount = this.formatAmount(
              data.order_info.order_amount
            );
          }
          // 处理设计过程，转换为数组格式
          if (data.design_progress && data.design_progress.design_process) {
            const designProcess = data.design_progress.design_process;
            if (designProcess && designProcess !== "暂无进度") {
              const processItems = designProcess.split(",").map((item) => {
                const parts = item.split(":");
                return {
                  task_item: parts[0] || "",
                  planned_date: parts[1] || "-",
                  actual_date: parts[2] || "-",
                };
              });
              data.design_progress.process_items = processItems;
            }
          }
          // 处理设计周期颜色
          if (data.design_progress && data.design_progress.design_cycle) {
            const days = parseInt(data.design_progress.design_cycle);
            if (!isNaN(days)) {
              data.design_progress.design_cycle_color =
                this.getDesignCycleColor(days);
            }
          }
          // 处理拆单进度中的逾期天数
          if (data.split_progress && data.split_progress.order_date) {
            const orderDate = data.split_progress.order_date;
            // 处理厂内生产项
            if (data.split_progress.internal_items) {
              data.split_progress.internal_items =
                data.split_progress.internal_items.map((item) => {
                  const daysPassed = this.calculateOverdueDays(
                    orderDate,
                    item.split_date
                  );
                  let displayValue = item.split_date || `逾期: ${daysPassed}天`;
                  let isOverdue = !item.split_date && daysPassed >= 1;
                  let isOverdueRed = !item.split_date && daysPassed >= 3;
                  return {
                    ...item,
                    daysPassed: daysPassed,
                    displayValue: displayValue,
                    isOverdue: isOverdue,
                    isOverdueRed: isOverdueRed,
                  };
                });
            }
            // 处理外购项
            if (data.split_progress.external_items) {
              data.split_progress.external_items =
                data.split_progress.external_items.map((item) => {
                  const daysPassed = this.calculateOverdueDays(
                    orderDate,
                    item.purchase_date
                  );
                  let displayValue =
                    item.purchase_date || `逾期: ${daysPassed}天`;
                  let isOverdue = !item.purchase_date && daysPassed >= 1;
                  let isOverdueRed = !item.purchase_date && daysPassed >= 3;
                  return {
                    ...item,
                    daysPassed: daysPassed,
                    displayValue: displayValue,
                    isOverdue: isOverdue,
                    isOverdueRed: isOverdueRed,
                  };
                });
            }
          }
          // 计算下单天数：拆单下单日期 - 客户打款日期，最小1天
          if (data.production_progress) {
            const splitOrderDate = data.production_progress.split_order_date;
            const customerPaymentDate =
              data.production_progress.customer_payment_date;
            if (splitOrderDate && customerPaymentDate) {
              const splitDate = new Date(splitOrderDate);
              const paymentDate = new Date(customerPaymentDate);
              // 重置时间为 00:00:00，只计算天数差
              splitDate.setHours(0, 0, 0, 0);
              paymentDate.setHours(0, 0, 0, 0);
              const diffTime = splitDate.getTime() - paymentDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              // 确保最小值为1天
              data.production_progress.calculated_order_days = Math.max(
                diffDays,
                1
              );
            }
          }
          this.setData({
            orderDetail: data,
            loading: false,
          });
        })
        .catch((err) => {
          console.error("加载订单详情失败:", err);
          this.setData({
            loading: false,
          });
          wx.showToast({
            title: "加载失败",
            icon: "none",
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        });
    } else if (this.data.orderId) {
      // 兼容旧方式
      orderService
        .getOrderDetail(this.data.orderId)
        .then((res) => {
          // 添加状态颜色
          const orderDetail = {
            ...res,
            statusColor: this.getStatusColor(res.order_status),
          };
          this.setData({
            orderDetail: orderDetail,
            loading: false,
          });
        })
        .catch((err) => {
          console.error("加载订单详情失败:", err);
          this.setData({
            loading: false,
          });
          wx.showToast({
            title: "加载失败",
            icon: "none",
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadOrderDetail();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return "-";
    return dateStr;
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(dateTime) {
    if (!dateTime) return "-";
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 格式化金额
   * 添加千位分隔符，保留两位小数
   */
  formatAmount(amount) {
    if (!amount && amount !== 0) return "";

    // 转换为数字
    const num = typeof amount === "string" ? parseFloat(amount) : amount;

    // 检查是否为有效数字
    if (isNaN(num)) return "";
    // 格式化为带千位分隔符的字符串，保留两位小数
    return `¥${num.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
  /**
   * 获取设计周期颜色
   */
  getDesignCycleColor(days) {
    if (days <= 3) {
      return "#389e0d"; // green
    } else if (days > 3 && days <= 20) {
      return "#fa8c16"; // orange
    } else if (days > 20) {
      return "#cf1322"; // red
    }
    return "#8c8c8c"; // default
  },

  /**
   * 计算逾期天数
   * @param {string} orderDate - 下单日期，格式 'YYYY-MM-DD'
   * @param {string} splitDate - 拆单日期，格式 'YYYY-MM-DD'，可能为 null
   * @returns {number} 逾期天数
   */
  calculateOverdueDays(orderDate, splitDate) {
    if (!orderDate) return 0;

    let endDate;
    if (splitDate) {
      // 如果有 split_date，用 split_date 减去下单日期
      endDate = new Date(splitDate);
    } else {
      // 如果没有 split_date，用当前时间减去下单日期
      endDate = new Date();
    }

    const startDate = new Date(orderDate);
    // 重置时间为 00:00:00，只计算天数差
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : 0;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status) {
    if (!status) return "#8c8c8c";

    // 提取前缀和具体状态
    let prefix = "";
    let statusText = status;

    if (status.includes("-")) {
      const parts = status.split("-");
      prefix = parts[0];
      statusText = parts.slice(1).join("-");
    }

    // 根据前缀和具体状态返回颜色
    if (prefix === "设计") {
      if (statusText === "已下单") {
        return "#59bf4d";
      } else if (statusText === "暂停" || statusText === "撤销") {
        return "#ea4f5b";
      } else {
        return "#3677e2";
      }
    } else if (prefix === "拆单") {
      if (statusText === "已下单") {
        return "#59bf4d";
      } else if (statusText === "未开始") {
        return "#8c8c8c";
      } else if (statusText === "撤销中") {
        return "#ea4f5b";
      } else {
        return "#0958d9";
      }
    } else if (prefix === "生产") {
      if (statusText === "已完成") {
        return "#389e0d";
      } else {
        return "#0958d9";
      }
    }

    // 默认颜色（兼容旧状态格式）
    return "#8c8c8c";
  },

  /**
   * 切换展开/收起
   */
  toggleSection(e) {
    const section = e.currentTarget.dataset.section;
    const expandedSections = { ...this.data.expandedSections };
    expandedSections[section] = !expandedSections[section];
    this.setData({
      expandedSections: expandedSections,
    });
  },

  /**
   * 切换子项展开/收起
   */
  toggleSubSection(e) {
    const section = e.currentTarget.dataset.section;
    const expandedSections = { ...this.data.expandedSections };
    expandedSections[section] = !expandedSections[section];
    this.setData({
      expandedSections: expandedSections,
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 复制文本
   */
  copyText(e) {
    const text = e.currentTarget.dataset.text;
    if (text) {
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({
            title: "已复制",
            icon: "success",
          });
        },
      });
    }
  },
});
