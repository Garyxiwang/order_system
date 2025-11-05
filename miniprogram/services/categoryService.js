// categoryService.js - 类目服务
const api = require('../utils/api.js');

/**
 * 获取类目列表
 */
function getCategoryList() {
  return api.get('/categories/');
}

module.exports = {
  getCategoryList
};

