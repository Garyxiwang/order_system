// authService.js - 认证服务
const api = require('../utils/api.js');

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
function login(username, password) {
  return api.post('/auth/login', {
    username: username,
    password: password
  });
}

/**
 * 退出登录
 */
function logout() {
  // 清除本地存储的用户信息
  try {
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  } catch (e) {
    console.error('清除存储失败:', e);
  }
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  try {
    const userInfo = wx.getStorageSync('userInfo');
    return userInfo;
  } catch (e) {
    return null;
  }
}

/**
 * 保存用户信息
 */
function saveUserInfo(userInfo) {
  try {
    wx.setStorageSync('userInfo', userInfo);
    return true;
  } catch (e) {
    console.error('保存用户信息失败:', e);
    return false;
  }
}

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  const userInfo = getCurrentUser();
  return userInfo && userInfo.username;
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  saveUserInfo,
  isLoggedIn
};

