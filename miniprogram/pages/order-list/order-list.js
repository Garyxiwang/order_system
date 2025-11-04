// pages/order-list/order-list.js
const orderService = require('../../services/orderService.js');
const authService = require('../../services/authService.js');
const config = require('../../utils/config.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 订单列表
    orderList: [],
    // 分页信息
    page: 1,
    pageSize: config.pageSize,
    total: 0,
    totalPages: 0,
    // 加载状态
    loading: false,
    hasMore: true,
    // 筛选条件
    filters: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    if (!authService.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

    // 获取筛选条件
    if (options.filters) {
      try {
        const filters = JSON.parse(decodeURIComponent(options.filters));
        this.setData({
          filters: filters
        });
      } catch (e) {
        console.error('解析筛选条件失败:', e);
      }
    }

    this.loadOrderList(true);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '订单列表'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadOrderList(true, () => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  /**
   * 加载订单列表
   * @param {boolean} refresh - 是否刷新
   * @param {function} callback - 回调函数
   */
  loadOrderList(refresh = false, callback) {
    if (this.data.loading) {
      return;
    }

    if (!orderService) {
      wx.showToast({
        title: '服务未加载，请重试',
        icon: 'none'
      });
      if (callback) callback();
      return;
    }

    const page = refresh ? 1 : this.data.page;
    const filters = this.data.filters;

    // 构建查询参数
    const params = {
      page: page,
      page_size: this.data.pageSize
    };

    // 添加筛选条件
    if (filters.orderNumber) {
      params.order_number = filters.orderNumber;
    }
    if (filters.customerName) {
      params.customer_name = filters.customerName;
    }
    if (filters.designer) {
      params.designer = filters.designer;
    }
    if (filters.salesperson) {
      params.salesperson = filters.salesperson;
    }
    if (filters.splitter) {
      params.splitter = filters.splitter;
    }
    if (filters.orderStatus && filters.orderStatus.length > 0) {
      params.order_status = filters.orderStatus;
    }
    if (filters.orderType) {
      params.order_type = filters.orderType;
    }
    if (filters.orderCategory && filters.orderCategory.length > 0) {
      params.category_names = filters.orderCategory;
    }
    if (filters.quoteStatus && filters.quoteStatus.length > 0) {
      params.quote_status = filters.quoteStatus;
    }

    this.setData({
      loading: true
    });

    orderService.getOrderList(params)
      .then((res) => {
        // 处理订单列表，添加状态颜色
        const items = res.items.map(item => {
          return {
            ...item,
            statusColor: this.getStatusColor(item.order_status)
          };
        });
        const newList = refresh ? items : [...this.data.orderList, ...items];
        
        this.setData({
          orderList: newList,
          page: res.page,
          total: res.total,
          totalPages: res.total_pages,
          hasMore: res.page < res.total_pages,
          loading: false
        });

        if (callback) {
          callback();
        }
      })
      .catch((err) => {
        console.error('加载订单列表失败:', err);
        this.setData({
          loading: false
        });
        if (callback) {
          callback();
        }
      });
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadOrderList(false);
    }
  },

  /**
   * 跳转到筛选页
   */
  goToFilter() {
    const filters = this.data.filters;
    wx.redirectTo({
      url: `/pages/filter/filter?params=${encodeURIComponent(JSON.stringify(filters))}`
    });
  },

  /**
   * 跳转到订单详情
   */
  goToDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
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
  }
});
