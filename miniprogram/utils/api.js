// api.js - API请求封装
const config = require('./config.js');

/**
 * 封装微信小程序请求
 */
function request(options) {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    if (options.showLoading !== false) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      });
    }

    wx.request({
      url: config.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      timeout: config.timeout,
      success: (res) => {
        wx.hideLoading();
        
        // 处理HTTP状态码
        if (res.statusCode === 200) {
          // 检查响应格式
          // 如果响应有 code 字段，说明是标准格式 {code, message, data}
          if (res.data && typeof res.data === 'object' && 'code' in res.data) {
            // 标准格式：检查业务状态码
            if (res.data.code === 200) {
              resolve(res.data.data || res.data);
            } else {
              // 业务错误
              const errorMsg = res.data.message || '请求失败';
              if (options.showError !== false) {
                wx.showToast({
                  title: errorMsg,
                  icon: 'none',
                  duration: 2000
                });
              }
              reject(new Error(errorMsg));
            }
          } else {
            // 直接返回数据对象（FastAPI 直接返回模型对象的情况）
            resolve(res.data);
          }
        } else if (res.statusCode === 404) {
          const errorMsg = '请求的资源不存在';
          if (options.showError !== false) {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
          reject(new Error(errorMsg));
        } else if (res.statusCode >= 500) {
          const errorMsg = '服务器错误，请稍后重试';
          if (options.showError !== false) {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
          reject(new Error(errorMsg));
        } else {
          const errorMsg = res.data?.message || '请求失败';
          if (options.showError !== false) {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        
        // 网络错误处理
        let errorMsg = '网络连接失败，请检查网络';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请稍后重试';
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络请求失败';
          }
        }
        
        if (options.showError !== false) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
}

/**
 * POST请求
 */
function post(url, data, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
}

/**
 * PUT请求
 */
function put(url, data, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
}

/**
 * DELETE请求
 */
function del(url, data, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  delete: del
};

