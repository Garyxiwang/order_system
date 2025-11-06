// orderService.js - 订单服务
const api = require('../utils/api.js');

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，默认1
 * @param {number} params.page_size - 每页数量，默认10
 * @param {string} params.order_number - 订单编号（可选）
 * @param {string} params.customer_name - 客户名称（可选）
 * @param {string} params.designer - 设计师（可选）
 * @param {string} params.salesperson - 销售员（可选）
 * @param {Array} params.order_status - 订单状态（可选）
 * @param {string} params.order_type - 订单类型（可选）
 */
function getOrderList(params = {}) {
  const queryParams = {
    page: params.page || 1,
    page_size: params.page_size || 10,
    ...params
  };
  
  return api.post('/miniprogram-orders/list', queryParams);
}

/**
 * 获取订单详情
 * @param {number} orderId - 订单ID
 */
function getOrderDetail(orderId) {
  return api.get(`/orders/${orderId}`);
}

module.exports = {
  getOrderList,
  getOrderDetail
};

