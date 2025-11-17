// pages/filter/filter.js
const authService = require('../../services/authService.js');
const userService = require('../../services/userService.js');
const categoryService = require('../../services/categoryService.js');

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
    orderStatus: '',
    orderStatusDetail: [], // 订单状态详情（二级选择，多选）
    orderType: '',
    orderCategory: [],
    splitter: '',
    quoteStatus: [],
    // 人员列表
    designerList: [],
    salespersonList: [],
    splitterList: [],
    // 类目列表
    categoryList: [],
    // Picker 显示状态
    showDesignerPicker: false,
    showSalespersonPicker: false,
    showSplitterPicker: false,
    showOrderTypePicker: false,
    showOrderStatusPicker: false,
    showOrderStatusDetailPicker: false, // 订单状态详情选择器
    showQuoteStatusPicker: false,
    showOrderCategoryPicker: false,
    quoteStatusDisplay: '',
    orderCategoryDisplay: '',
    orderStatusDetailDisplay: '', // 订单状态详情显示文本
    // 全选状态
    isAllOrderStatusDetailSelected: false,
    isAllQuoteStatusSelected: false,
    isAllOrderCategorySelected: false,
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
    ],
    // 订单状态详情选项（根据订单进度动态显示）
    orderStatusDetailOptions: [],
    // 设计管理状态列表
    designStatusOptions: [
      '量尺',
      '初稿',
      '公司对方案',
      '线上对方案',
      '改图',
      '客户确认图',
      '客户硬装阶段',
      '出内部结构图',
      '出下单图',
      '复尺',
      '报价',
      '打款',
      '下单',
      '暂停',
      '已下单',
      '已撤销',
      '其他'
    ],
    // 拆单管理状态列表
    splitStatusOptions: [
      '未开始',
      '拆单中',
      '撤销中',
      '未审核',
      '已审核',
      '已下单'
    ],
    // 生产管理状态列表
    productionStatusOptions: [
      '未齐料',
      '已齐料',
      '已下料',
      '已入库',
      '已发货',
      '已完成'
    ],
    // 默认状态配置（根据订单进度）
    defaultStatusByProgress: {
      '设计': [
        '量尺',
        '初稿',
        '公司对方案',
        '线上对方案',
        '改图',
        '客户确认图',
        '客户硬装阶段',
        '出内部结构图',
        '出下单图',
        '复尺',
        '报价',
        '打款',
        '下单',
        '其他'
      ],
      '拆单': [
        '未开始',
        '拆单中',
        '撤销中',
        '未审核',
        '已审核'
      ],
      '生产': [
        '未齐料',
        '已齐料',
        '已下料',
        '已入库',
        '已发货'
      ]
    }
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

    // 加载类目列表
    this.loadCategoryList();

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
      console.log(res)
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
      
      // 在每个列表前面添加"清空"选项，用于取消选择
      this.setData({
        designerList: ['清空', ...designerList],
        salespersonList: ['清空', ...salespersonList],
        splitterList: ['清空', ...splitterList]
      });
      
      // 加载用户列表后，检查是否需要设置默认销售员
      this.setDefaultSalesperson();
    } catch (error) {
      console.error('加载用户列表失败:', error);
      // 如果加载失败，使用空数组，不影响其他功能
    }
  },

  /**
   * 根据当前用户角色设置默认销售员
   */
  setDefaultSalesperson() {
    // 如果已经有销售员选择，不覆盖（可能是从列表页返回时保留的筛选条件）
    if (this.data.salesperson) {
      return;
    }
    
    // 获取当前用户信息
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.role === 'salesperson' && currentUser.username) {
      // 检查销售员列表中是否包含当前用户（排除"清空"选项）
      const salespersonList = this.data.salespersonList;
      // 过滤掉"清空"选项，检查是否包含当前用户
      const validSalespersonList = salespersonList.filter(name => name !== '清空');
      
      if (validSalespersonList.length > 0 && validSalespersonList.includes(currentUser.username)) {
        // 如果列表已加载且包含当前用户，则自动选中
        this.setData({
          salesperson: currentUser.username
        });
      }
    }
  },

  /**
   * 加载类目列表
   */
  async loadCategoryList() {
    try {
      const res = await categoryService.getCategoryList();
      // API 返回格式: { categories: [...], total: number }
      const categories = res.categories || res || [];
      
      // 提取类目名称列表
      const categoryList = categories.map(category => {
        return typeof category === 'string' ? category : category.name;
      });
      
      // 排序
      categoryList.sort();
      
      this.setData({
        categoryList: categoryList
      });
    } catch (error) {
      console.error('加载类目列表失败:', error);
      // 如果加载失败，使用空数组，不影响其他功能
      this.setData({
        categoryList: []
      });
    }
  },

  /**
   * 格式化状态显示文本（将"下单"显示为"待下单"）
   */
  formatStatusDisplay(statusArray) {
    if (!statusArray || statusArray.length === 0) {
      return '';
    }
    return statusArray.map(status => status === '下单' ? '待下单' : status).join(', ');
  },

  /**
   * 恢复筛选条件
   */
  restoreFilters(params) {
    // 处理订单状态：如果是数组，取第一个元素；如果是字符串，直接使用；否则为空字符串
    let orderStatus = '';
    if (Array.isArray(params.orderStatus) && params.orderStatus.length > 0) {
      orderStatus = params.orderStatus[0];
    } else if (typeof params.orderStatus === 'string' && params.orderStatus) {
      orderStatus = params.orderStatus;
    }
    
    const quoteStatus = params.quoteStatus || [];
    const orderCategory = params.orderCategory || [];
    
    this.setData({
      orderNumber: params.orderNumber || '',
      customerName: params.customerName || '',
      designer: params.designer || '',
      salesperson: params.salesperson || '',
      orderStatus: orderStatus,
      orderStatusDetail: params.orderStatusDetail || [],
      orderType: params.orderType || '',
      orderCategory: orderCategory,
      splitter: params.splitter || '',
      quoteStatus: quoteStatus,
      quoteStatusDisplay: quoteStatus.length > 0 ? quoteStatus.join(', ') : '',
      orderCategoryDisplay: orderCategory.length > 0 ? orderCategory.join(', ') : '',
      orderStatusDetailDisplay: (params.orderStatusDetail && params.orderStatusDetail.length > 0) ? this.formatStatusDisplay(params.orderStatusDetail) : ''
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
    const selectedValue = e.detail.value;
    // 如果选择的是"清空"，则设置为空字符串
    this.setData({
      designer: selectedValue === '清空' ? '' : selectedValue,
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
    const selectedValue = e.detail.value;
    // 如果选择的是"清空"，则设置为空字符串
    this.setData({
      salesperson: selectedValue === '清空' ? '' : selectedValue,
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
    const selectedValue = e.detail.value;
    // 如果选择的是"清空"，则设置为空字符串
    this.setData({
      splitter: selectedValue === '清空' ? '' : selectedValue,
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
      orderStatus: e.detail || e.detail.value || ''
    });
  },

  /**
   * 切换订单状态（单选）
   */
  toggleOrderStatus(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    
    const oldStatus = this.data.orderStatus;
    const newStatus = name === oldStatus ? '' : name;
    this.setData({
      orderStatus: newStatus
    });
    
    // 如果清空了订单进度，也清空二级状态
    if (!newStatus) {
      this.setData({
        orderStatusDetail: [],
        orderStatusDetailDisplay: ''
      });
    } else if (newStatus !== oldStatus) {
      // 如果切换了订单进度，更新默认状态
      this.updateOrderStatusDetailOptions(newStatus);
      const defaultStatus = this.data.defaultStatusByProgress[newStatus] || [];
      const displayText = this.formatStatusDisplay(defaultStatus);
      this.setData({
        orderStatusDetail: defaultStatus,
        orderStatusDetailDisplay: displayText
      });
    }
  },
  
  /**
   * 根据订单进度更新状态详情选项
   */
  updateOrderStatusDetailOptions(orderStatus) {
    let options = [];
    if (orderStatus === '设计') {
      options = this.data.designStatusOptions;
    } else if (orderStatus === '拆单') {
      options = this.data.splitStatusOptions;
    } else if (orderStatus === '生产') {
      options = this.data.productionStatusOptions;
    }
    
    // 为了显示，将"下单"转换为"待下单"，但实际值保持"下单"
    // 注意：这里我们保持原值，只在显示时转换
    this.setData({
      orderStatusDetailOptions: options
    });
  },
  
  /**
   * 获取状态显示文本（用于选择器显示）
   */
  getStatusDisplayText(status) {
    return status === '下单' ? '待下单' : status;
  },
  
  /**
   * 显示订单状态详情选择器
   */
  showOrderStatusDetailPicker() {
    const orderStatus = this.data.orderStatus;
    if (!orderStatus) {
      wx.showToast({
        title: '请先选择订单进度',
        icon: 'none'
      });
      return;
    }
    
    this.updateOrderStatusDetailOptions(orderStatus);
    
    // 如果还没有选择状态，设置默认状态
    if (this.data.orderStatusDetail.length === 0) {
      const defaultStatus = this.data.defaultStatusByProgress[orderStatus] || [];
      const displayText = this.formatStatusDisplay(defaultStatus);
      this.setData({
        orderStatusDetail: defaultStatus,
        orderStatusDetailDisplay: displayText
      });
    }
    
    // 更新全选状态
    this.updateOrderStatusDetailSelectAllState();
    
    this.setData({
      showOrderStatusDetailPicker: true
    });
  },
  
  /**
   * 更新订单状态详情全选状态
   */
  updateOrderStatusDetailSelectAllState() {
    const options = this.data.orderStatusDetailOptions || [];
    const selected = this.data.orderStatusDetail || [];
    const isAllSelected = options.length > 0 && options.every(option => selected.includes(option));
    this.setData({
      isAllOrderStatusDetailSelected: isAllSelected
    });
  },
  
  /**
   * 切换订单状态详情全选
   */
  toggleSelectAllOrderStatusDetail() {
    const options = this.data.orderStatusDetailOptions || [];
    const isAllSelected = this.data.isAllOrderStatusDetailSelected;
    
    if (isAllSelected) {
      // 取消全选
      this.setData({
        orderStatusDetail: []
      });
    } else {
      // 全选
      this.setData({
        orderStatusDetail: [...options]
      });
    }
    
    this.updateOrderStatusDetailSelectAllState();
  },
  
  /**
   * 订单状态详情选择变化
   */
  onOrderStatusDetailChange(e) {
    this.setData({
      orderStatusDetail: e.detail || e.detail.value || []
    });
    // 更新全选状态
    this.updateOrderStatusDetailSelectAllState();
  },
  
  /**
   * 切换订单状态详情
   */
  toggleOrderStatusDetail(e) {
    const name = e.currentTarget.dataset.name;
    const orderStatusDetail = [...this.data.orderStatusDetail];
    const index = orderStatusDetail.indexOf(name);
    
    if (index > -1) {
      orderStatusDetail.splice(index, 1);
    } else {
      orderStatusDetail.push(name);
    }
    
    this.setData({
      orderStatusDetail: orderStatusDetail
    });
    
    // 更新全选状态
    this.updateOrderStatusDetailSelectAllState();
  },
  
  /**
   * 确认订单状态详情选择
   */
  onOrderStatusDetailConfirm() {
    const displayText = this.formatStatusDisplay(this.data.orderStatusDetail);
    this.setData({
      orderStatusDetailDisplay: displayText,
      showOrderStatusDetailPicker: false
    });
  },
  
  /**
   * 关闭订单状态详情选择器
   */
  onOrderStatusDetailCancel() {
    this.setData({
      showOrderStatusDetailPicker: false
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
   * 订单状态选择（单选）
   */
  onOrderStatusConfirm() {
    // 单选逻辑已经在 toggleOrderStatus 中处理
    const orderStatus = this.data.orderStatus;
    this.setData({
      showOrderStatusPicker: false
    });
    
    // 如果选择了订单进度，自动设置默认状态（不弹出选择器）
    if (orderStatus) {
      this.updateOrderStatusDetailOptions(orderStatus);
      // 获取默认状态
      const defaultStatus = this.data.defaultStatusByProgress[orderStatus] || [];
      // 设置默认状态和显示文本
      const displayText = this.formatStatusDisplay(defaultStatus);
      this.setData({
        orderStatusDetail: defaultStatus,
        orderStatusDetailDisplay: displayText
      });
    } else {
      // 如果清空了订单进度，也清空二级状态
      this.setData({
        orderStatusDetail: [],
        orderStatusDetailDisplay: ''
      });
    }
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
    // 更新全选状态
    this.updateQuoteStatusSelectAllState();
    this.setData({
      showQuoteStatusPicker: true
    });
  },
  
  /**
   * 更新报价状态全选状态
   */
  updateQuoteStatusSelectAllState() {
    const options = this.data.quoteStatusOptions || [];
    const selected = this.data.quoteStatus || [];
    const isAllSelected = options.length > 0 && options.every(option => selected.includes(option.value));
    this.setData({
      isAllQuoteStatusSelected: isAllSelected
    });
  },
  
  /**
   * 切换报价状态全选
   */
  toggleSelectAllQuoteStatus() {
    const options = this.data.quoteStatusOptions || [];
    const isAllSelected = this.data.isAllQuoteStatusSelected;
    
    if (isAllSelected) {
      // 取消全选
      this.setData({
        quoteStatus: []
      });
    } else {
      // 全选
      this.setData({
        quoteStatus: options.map(option => option.value)
      });
    }
    
    this.updateQuoteStatusSelectAllState();
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
    // 更新全选状态
    this.updateOrderCategorySelectAllState();
    this.setData({
      showOrderCategoryPicker: true
    });
  },
  
  /**
   * 更新下单类目全选状态
   */
  updateOrderCategorySelectAllState() {
    const options = this.data.categoryList || [];
    const selected = this.data.orderCategory || [];
    const isAllSelected = options.length > 0 && options.every(option => selected.includes(option));
    this.setData({
      isAllOrderCategorySelected: isAllSelected
    });
  },
  
  /**
   * 切换下单类目全选
   */
  toggleSelectAllOrderCategory() {
    const options = this.data.categoryList || [];
    const isAllSelected = this.data.isAllOrderCategorySelected;
    
    if (isAllSelected) {
      // 取消全选
      this.setData({
        orderCategory: []
      });
    } else {
      // 全选
      this.setData({
        orderCategory: [...options]
      });
    }
    
    this.updateOrderCategorySelectAllState();
  },

  /**
   * 下单类目选择变化
   */
  onOrderCategoryChange(e) {
    this.setData({
      orderCategory: e.detail || e.detail.value || []
    });
    // 更新全选状态
    this.updateOrderCategorySelectAllState();
  },

  /**
   * 切换下单类目
   */
  toggleOrderCategory(e) {
    const name = e.currentTarget.dataset.name;
    const orderCategory = [...this.data.orderCategory];
    const index = orderCategory.indexOf(name);
    
    if (index > -1) {
      orderCategory.splice(index, 1);
    } else {
      orderCategory.push(name);
    }
    
    this.setData({
      orderCategory: orderCategory
    });
    
    // 更新全选状态
    this.updateOrderCategorySelectAllState();
  },

  /**
   * 确认下单类目选择
   */
  onOrderCategoryConfirm(e) {
    // 多选逻辑已经在 toggleOrderCategory 中处理
    const displayText = this.data.orderCategory.length > 0 ? this.data.orderCategory.join(', ') : '';
    this.setData({
      orderCategoryDisplay: displayText,
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
    // 更新全选状态
    this.updateQuoteStatusSelectAllState();
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
    
    // 更新全选状态
    this.updateQuoteStatusSelectAllState();
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
      orderStatus: '',
      orderStatusDetail: [],
      orderType: '',
      orderCategory: [],
      splitter: '',
      quoteStatus: [],
      quoteStatusDisplay: '',
      orderCategoryDisplay: '',
      orderStatusDetailDisplay: '',
      // 重置全选状态
      isAllOrderStatusDetailSelected: false,
      isAllQuoteStatusSelected: false,
      isAllOrderCategorySelected: false
    });
    this.setDefaultSalesperson();
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
      orderStatus: this.data.orderStatus ? [this.data.orderStatus] : [],
      orderProgress: this.data.orderStatus ? [this.data.orderStatus] : [], // 订单进度（设计、拆单、生产）
      orderStatusDetail: this.data.orderStatusDetail, // 订单状态详情（二级选择）
      orderType: this.data.orderType,
      orderCategory: this.data.orderCategory,
      splitter: this.data.splitter,
      quoteStatus: this.data.quoteStatus
    };
    console.log('handleConfirm :>> ', filters);
    // 跳转到列表页，传递筛选条件
    wx.navigateTo({
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
