// userService.js - 用户服务
const api = require('../utils/api.js');

/**
 * 获取所有用户列表
 */
function getUserList() {
  return api.get('/users/');
}

module.exports = {
  getUserList
};

