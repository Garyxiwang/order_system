// app.js
const authService = require('./services/authService.js');

App({
  onLaunch() {
    // 小程序启动时执行
    console.log('订单助手小程序启动');
    
    // 检查网络状态
    this.checkNetwork();
    
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 小程序显示时执行
  },

  onHide() {
    // 小程序隐藏时执行
  },

  onError(msg) {
    // 错误处理
    console.error('小程序错误:', msg);
  },

  // 检查网络状态
  checkNetwork() {
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType);
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = authService.getCurrentUser();
    if (userInfo) {
      console.log('用户已登录:', userInfo.username);
      this.globalData.userInfo = userInfo;
    } else {
      console.log('用户未登录');
    }
  },

  // 全局数据
  globalData: {
    userInfo: null
  }
});
