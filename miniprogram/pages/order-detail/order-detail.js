// pages/order-detail/order-detail.js
let orderService;

try {
  orderService = require('../../services/orderService.js');
} catch (e) {
  console.error('模块加载失败:', e);
  orderService = null;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderId: null,
    orderDetail: null,
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.id) {
      this.setData({
        orderId: parseInt(options.id)
      });
      this.loadOrderDetail();
    } else {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'none'
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
      title: '订单详情'
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
        title: '服务未加载，请重试',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      loading: true
    });

    orderService.getOrderDetail(this.data.orderId)
      .then((res) => {
        // 添加状态颜色
        const orderDetail = {
          ...res,
          statusColor: this.getStatusColor(res.order_status)
        };
        this.setData({
          orderDetail: orderDetail,
          loading: false
        });
      })
      .catch((err) => {
        console.error('加载订单详情失败:', err);
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
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
    if (!dateStr) return '-';
    return dateStr;
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(dateTime) {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 格式化金额
   */
  formatAmount(amount) {
    if (!amount) return '-';
    return `¥${Number(amount).toFixed(2)}`;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status) {
    const statusColors = {
      '待处理': '#faad14',
      '进行中': '#1890ff',
      '已完成': '#52c41a',
      '已下单': '#1890ff',
      '已取消': '#f5222d'
    };
    return statusColors[status] || '#8c8c8c';
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
            title: '已复制',
            icon: 'success'
          });
        }
      });
    }
  }
});

