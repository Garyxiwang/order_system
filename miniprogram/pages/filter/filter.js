// pages/filter/filter.js
const authService = require('../../services/authService.js');
const userService = require('../../services/userService.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: 0,
    headerPaddingTop: 30,
    // 筛选条件
    orderNumber: '',
    customerName: '',
    designer: '',
    salesperson: '',
    orderStatus: [],
    orderType: '',
    orderCategory: [],
    splitter: '',
    quoteStatus: [],
    // 人员列表
    designerList: [],
    salespersonList: [],
    splitterList: [],
    // Picker 显示状态
    showDesignerPicker: false,
    showSalespersonPicker: false,
    showSplitterPicker: false,
    showOrderTypePicker: false,
    showOrderStatusPicker: false,
    showQuoteStatusPicker: false,
    showOrderCategoryPicker: false,
    // 显示文本
    orderStatusDisplay: '',
    quoteStatusDisplay: '',
    orderCategoryDisplay: '',
    // 状态选项
    orderStatusOptions: [
      { label: '设计', value: '设计' },
      { label: '拆单', value: '拆单' },
      { label: '生产', value: '生产' }
    ],
    orderTypeOptions: [
      { label: '设计单', value: '设计单' },
      { label: '生产单', value: '生产单' },
      { label: '成品单', value: '成品单' }
    ],
    quoteStatusOptions: [
      { label: '未报价', value: '未报价' },
      { label: '已报价', value: '已报价' },
      { label: '报价已发未打款', value: '报价已发未打款' }
    ]
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

    // 加载用户列表
    this.loadUserList();

    // 如果有传入的筛选条件，恢复筛选状态
    if (options.params) {
      try {
        const params = JSON.parse(decodeURIComponent(options.params));
        this.restoreFilters(params);
      } catch (e) {
        console.error('恢复筛选条件失败:', e);
      }
    }
  },

  /**
   * 加载用户列表并根据角色分类
   */
  async loadUserList() {
    try {
      const res = await userService.getUserList();
      const users = res.users || [];
      
      // 根据角色分类
      const designerList = [];
      const salespersonList = [];
      const splitterList = [];
      
      users.forEach(user => {
        const username = user.username;
        const role = user.role;
        
        if (role === 'designer') {
          designerList.push(username);
        } else if (role === 'salesperson') {
          salespersonList.push(username);
        } else if (role === 'splitting') {
          splitterList.push(username);
        }
      });
      
      // 排序
      designerList.sort();
      salespersonList.sort();
      splitterList.sort();
      
      this.setData({
        designerList: designerList,
        salespersonList: salespersonList,
        splitterList: splitterList
      });
    } catch (error) {
      console.error('加载用户列表失败:', error);
      // 如果加载失败，使用空数组，不影响其他功能
    }
  },

  /**
   * 恢复筛选条件
   */
  restoreFilters(params) {
    const orderStatus = params.orderStatus || [];
    const quoteStatus = params.quoteStatus || [];
    const orderCategory = params.orderCategory || [];
    
    this.setData({
      orderNumber: params.orderNumber || '',
      customerName: params.customerName || '',
      designer: params.designer || '',
      salesperson: params.salesperson || '',
      orderStatus: orderStatus,
      orderType: params.orderType || '',
      orderCategory: orderCategory,
      splitter: params.splitter || '',
      quoteStatus: quoteStatus,
      orderStatusDisplay: orderStatus.length > 0 ? orderStatus.join(', ') : '',
      quoteStatusDisplay: quoteStatus.length > 0 ? quoteStatus.join(', ') : '',
      orderCategoryDisplay: orderCategory.length > 0 ? orderCategory.join(', ') : ''
    });
  },

  /**
   * 订单编号输入
   */
  onOrderNumberInput(e) {
    this.setData({
      orderNumber: e.detail.value || e.detail
    });
  },

  /**
   * 客户名称输入
   */
  onCustomerNameInput(e) {
    this.setData({
      customerName: e.detail.value || e.detail
    });
  },

  /**
   * 显示设计师选择器
   */
  showDesignerPicker() {
    this.setData({
      showDesignerPicker: true
    });
  },

  /**
   * 设计师选择
   */
  onDesignerConfirm(e) {
    const index = e.detail.value[0];
    const designer = this.data.designerList[index] || '';
    this.setData({
      designer: designer,
      showDesignerPicker: false
    });
  },

  /**
   * 关闭设计师选择器
   */
  onDesignerCancel() {
    this.setData({
      showDesignerPicker: false
    });
  },

  /**
   * 显示销售员选择器
   */
  showSalespersonPicker() {
    this.setData({
      showSalespersonPicker: true
    });
  },

  /**
   * 销售员选择
   */
  onSalespersonConfirm(e) {
    const index = e.detail.value[0];
    const salesperson = this.data.salespersonList[index] || '';
    this.setData({
      salesperson: salesperson,
      showSalespersonPicker: false
    });
  },

  /**
   * 关闭销售员选择器
   */
  onSalespersonCancel() {
    this.setData({
      showSalespersonPicker: false
    });
  },

  /**
   * 显示拆单员选择器
   */
  showSplitterPicker() {
    this.setData({
      showSplitterPicker: true
    });
  },

  /**
   * 拆单员选择
   */
  onSplitterConfirm(e) {
    const index = e.detail.value[0];
    const splitter = this.data.splitterList[index] || '';
    this.setData({
      splitter: splitter,
      showSplitterPicker: false
    });
  },

  /**
   * 关闭拆单员选择器
   */
  onSplitterCancel() {
    this.setData({
      showSplitterPicker: false
    });
  },

  /**
   * 订单状态选择
   */
  onOrderStatusChange(e) {
    this.setData({
      orderStatus: e.detail || e.detail.value || []
    });
  },

  /**
   * 切换订单状态
   */
  toggleOrderStatus(e) {
    const name = e.currentTarget.dataset.name;
    const orderStatus = [...this.data.orderStatus];
    const index = orderStatus.indexOf(name);
    
    if (index > -1) {
      orderStatus.splice(index, 1);
    } else {
      orderStatus.push(name);
    }
    
    this.setData({
      orderStatus: orderStatus
    });
  },

  /**
   * 显示订单类型选择器
   */
  showOrderTypePicker() {
    this.setData({
      showOrderTypePicker: true
    });
  },

  /**
   * 订单类型选择（单选）
   */
  onOrderTypeConfirm() {
    // 单选逻辑已经在 toggleOrderType 中处理
    this.setData({
      showOrderTypePicker: false
    });
  },

  /**
   * 关闭订单类型选择器
   */
  onOrderTypeCancel() {
    this.setData({
      showOrderTypePicker: false
    });
  },

  /**
   * 订单类型选择
   */
  onOrderTypeChange(e) {
    this.setData({
      orderType: e.detail || e.detail.value || ''
    });
  },

  /**
   * 切换订单类型（单选）
   */
  toggleOrderType(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    
    this.setData({
      orderType: name === this.data.orderType ? '' : name
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  },

  /**
   * 显示订单状态选择器
   */
  showOrderStatusPicker() {
    this.setData({
      showOrderStatusPicker: true
    });
  },

  /**
   * 订单状态选择（多选）
   */
  onOrderStatusConfirm() {
    // 多选逻辑已经在 toggleOrderStatus 中处理
    const displayText = this.data.orderStatus.length > 0 ? this.data.orderStatus.join(', ') : '';
    this.setData({
      orderStatusDisplay: displayText,
      showOrderStatusPicker: false
    });
  },

  /**
   * 关闭订单状态选择器
   */
  onOrderStatusCancel() {
    this.setData({
      showOrderStatusPicker: false
    });
  },

  /**
   * 显示报价状态选择器
   */
  showQuoteStatusPicker() {
    this.setData({
      showQuoteStatusPicker: true
    });
  },

  /**
   * 报价状态选择（多选）
   */
  onQuoteStatusConfirm() {
    // 多选逻辑已经在 toggleQuoteStatus 中处理
    const displayText = this.data.quoteStatus.length > 0 ? this.data.quoteStatus.join(', ') : '';
    this.setData({
      quoteStatusDisplay: displayText,
      showQuoteStatusPicker: false
    });
  },

  /**
   * 关闭报价状态选择器
   */
  onQuoteStatusCancel() {
    this.setData({
      showQuoteStatusPicker: false
    });
  },

  /**
   * 显示下单类目选择器
   */
  showOrderCategoryPicker() {
    this.setData({
      showOrderCategoryPicker: true
    });
  },

  /**
   * 下单类目选择（多选）
   */
  onOrderCategoryConfirm(e) {
    // TODO: 实现下单类目选择逻辑
    this.setData({
      showOrderCategoryPicker: false
    });
  },

  /**
   * 关闭下单类目选择器
   */
  onOrderCategoryCancel() {
    this.setData({
      showOrderCategoryPicker: false
    });
  },

  /**
   * 报价状态选择
   */
  onQuoteStatusChange(e) {
    this.setData({
      quoteStatus: e.detail || e.detail.value || []
    });
  },

  /**
   * 切换报价状态
   */
  toggleQuoteStatus(e) {
    const name = e.currentTarget.dataset.name;
    const quoteStatus = [...this.data.quoteStatus];
    const index = quoteStatus.indexOf(name);
    
    if (index > -1) {
      quoteStatus.splice(index, 1);
    } else {
      quoteStatus.push(name);
    }
    
    this.setData({
      quoteStatus: quoteStatus
    });
  },

  /**
   * 重置筛选条件
   */
  handleReset() {
    this.setData({
      orderNumber: '',
      customerName: '',
      designer: '',
      salesperson: '',
      orderStatus: [],
      orderType: '',
      orderCategory: [],
      splitter: '',
      quoteStatus: [],
      orderStatusDisplay: '',
      quoteStatusDisplay: '',
      orderCategoryDisplay: ''
    });
  },

  /**
   * 确认筛选
   */
  handleConfirm() {
    const filters = {
      orderNumber: this.data.orderNumber,
      customerName: this.data.customerName,
      designer: this.data.designer,
      salesperson: this.data.salesperson,
      orderStatus: this.data.orderStatus,
      orderType: this.data.orderType,
      orderCategory: this.data.orderCategory,
      splitter: this.data.splitter,
      quoteStatus: this.data.quoteStatus
    };
    console.log('handleConfirm :>> ', filters);
    // 跳转到列表页，传递筛选条件
    wx.redirectTo({
      url: `/pages/order-list/order-list?filters=${encodeURIComponent(JSON.stringify(filters))}`
    });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          authService.logout();
          
          wx.showToast({
            title: '已退出',
            icon: 'success',
            duration: 1500
          });

          // 延迟跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      }
    });
  }
});
