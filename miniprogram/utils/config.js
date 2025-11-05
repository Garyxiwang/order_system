// config.js - 配置文件
const config = {
  // API基础地址 - 根据实际情况修改
  // 开发环境
  baseURL: 'http://192.168.31.141:8000/api/v1',
  
  // 生产环境 - 根据实际部署的地址修改
  // baseURL: 'http://106.54.235.3/api/v1',
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 分页配置
  pageSize: 10,
  
  // 状态码映射
  statusCode: {
    SUCCESS: 200,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  }
};

module.exports = config;

