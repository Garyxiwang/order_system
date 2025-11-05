// pages/login/login.js
const authService = require('../../services/authService.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    password: '',
    loading: false,
    statusBarHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    });

    // 检查是否已登录
    if (authService.isLoggedIn()) {
      this.redirectToFilter();
    }
  },

  /**
   * 用户名输入
   */
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value || e.detail
    });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value || e.detail
    });
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    const { username, password } = this.data;

    // 验证输入
    if (!username || !username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!password || !password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loading: true
    });

    try {
      const res = await authService.login(username.trim(), password);
      
      // 保存用户信息
      const userInfo = {
        username: res.username,
        role: res.role
      };
      authService.saveUserInfo(userInfo);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectToFilter();
      }, 1500);
    } catch (error) {
      console.error('登录失败:', error);
      // 错误提示已经在api.js中处理
      this.setData({
        loading: false
      });
    }
  },

  /**
   * 跳转到筛选页
   */
  redirectToFilter() {
    wx.redirectTo({
      url: '/pages/filter/filter'
    });
  }
});

