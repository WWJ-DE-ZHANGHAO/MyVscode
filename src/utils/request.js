// utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建 axios 实例
const instance = axios.create({
  baseURL: '',
  timeout: 10000,
});

// 请求拦截器：自动添加 authentication 请求头
instance.interceptors.request.use(
  (config) => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.authentication = token;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理 Result<T> 响应格式
instance.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // 如果响应是 Result<T> 格式（有 code 字段）
    if (res && typeof res.code !== 'undefined') {
      // code === 1 表示成功
      if (res.code === 1) {
        // 如果响应数据中包含 token，自动保存
        if (res.data && res.data.token) {
          sessionStorage.setItem('authToken', res.data.token);
        }
        // 返回 data 部分
        return res.data;
      } 
      // code !== 1 表示失败
      else {
        const errorMsg = res.msg || res.message || '请求失败';
        ElMessage.error(errorMsg);
        
        // 如果是未授权，跳转登录
        if (res.code === 401) {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userInfo');
          router.push('/login');
        }
        
        return Promise.reject(new Error(errorMsg));
      }
    }
    
    // 如果不是 Result<T> 格式，直接返回
    return res;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userInfo');
        router.push('/login');
      } else if (status === 403) {
        ElMessage.error('没有权限访问');
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error('服务器错误，请稍后重试');
      } else {
        ElMessage.error(data?.msg || data?.message || '请求失败');
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络');
    } else {
      ElMessage.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

export default instance;