// pages/order-list/order-list.js
const orderService = require('../../services/orderService.js');
const authService = require('../../services/authService.js');
const config = require('../../utils/config.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    headerPaddingTop: 30,
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
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    // 计算header的padding-top（状态栏高度 + 30rpx，转换为rpx）
    const headerPaddingTop = statusBarHeight * 2 + 30; // 1px = 2rpx (在375px宽度下)
    this.setData({
      statusBarHeight: statusBarHeight,
      headerPaddingTop: headerPaddingTop
    });

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
    // 使用自定义导航栏，不需要设置标题
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
    // 订单进度（设计、拆单、生产）
    if (filters.orderProgress && filters.orderProgress.length > 0) {
      params.order_progress = filters.orderProgress;
    }

    this.setData({
      loading: true
    });

    orderService.getOrderList(params)
      .then((res) => {
        // 处理订单列表，添加状态颜色和格式化字段
        const items = res.items.map(item => {
          // 处理类目名称（可能是单个字符串或数组）
          let categoryNames = '';
          if (item.category_names) {
            categoryNames = Array.isArray(item.category_names) 
              ? item.category_names.join(', ') 
              : item.category_names;
          } else if (item.category_name) {
            categoryNames = item.category_name;
          }
          
          // 格式化金额
          let formattedAmount = '';
          if (item.order_amount) {
            formattedAmount = this.formatAmount(item.order_amount);
          }
          
          return {
            ...item,
            statusColor: this.getStatusColor(item.order_status),
            category_names: categoryNames,
            // 确保拆单员和报价状态字段存在
            splitter: item.splitter || '',
            quote_status: item.quote_status || '',
            formatted_amount: formattedAmount
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
   * 根据订单进度前缀（设计、拆单、生产）返回不同颜色
   */
  getStatusColor(status) {
    if (!status) return '#8c8c8c';
    
    // 根据进度前缀返回不同颜色
    if (status.startsWith('设计-')) {
      // 设计阶段：蓝色
      return '#1890ff';
    } else if (status.startsWith('拆单-')) {
      // 拆单阶段：紫色
      return '#722ed1';
    } else if (status.startsWith('生产-')) {
      // 生产阶段：绿色
      return '#52c41a';
    }
    
    // 默认颜色（兼容旧状态格式）
    return '#8c8c8c';
  },

  /**
   * 格式化金额
   * 添加千位分隔符，保留两位小数
   */
  formatAmount(amount) {
    if (!amount && amount !== 0) return '';
    
    // 转换为数字
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // 检查是否为有效数字
    if (isNaN(num)) return '';
    
    // 格式化为带千位分隔符的字符串，保留两位小数
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
});
