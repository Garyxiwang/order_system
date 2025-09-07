import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据，保持后端返回的完整结构
    return response.data;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          message.error(data.detail || '请求参数错误');
          break;
        case 401:
          message.error('未授权，请重新登录');
          // 可以在这里处理登录跳转
          break;
        case 403:
          message.error('拒绝访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data.detail || '网络错误');
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error('请求失败');
    }
    return Promise.reject(error);
  }
);

export default api;