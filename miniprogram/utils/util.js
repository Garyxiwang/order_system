// util.js - 工具函数

/**
 * 格式化日期
 * @param {string} date - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
  if (!date) return '-';
  return date;
}

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateTime) {
  if (!dateTime) return '-';
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化金额
 * @param {number|string} amount - 金额
 * @returns {string} 格式化后的金额
 */
function formatAmount(amount) {
  if (!amount) return '-';
  return `¥${Number(amount).toFixed(2)}`;
}

/**
 * 获取状态颜色
 * @param {string} status - 状态
 * @returns {string} 颜色值
 */
function getStatusColor(status) {
  const statusColors = {
    '待处理': '#faad14',
    '进行中': '#1890ff',
    '已完成': '#52c41a',
    '已下单': '#1890ff',
    '已取消': '#f5222d'
  };
  return statusColors[status] || '#8c8c8c';
}

module.exports = {
  formatDate,
  formatDateTime,
  formatAmount,
  getStatusColor
};

