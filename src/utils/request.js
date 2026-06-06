// utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

// 创建 axios 实例
const instance = axios.create({
  baseURL: '',
  timeout: 10000,
});

// ========== Token 存储 Key 配置 ==========
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',      // 短期token
  REFRESH_TOKEN: 'refreshToken',    // 长期token（用于刷新）
  TOKEN_TYPE: 'tokenType'           // admin 或 user
};

// ========== Token 管理工具 ==========
const TokenManager = {
  // 存储双Token
  setTokens(accessToken, refreshToken, tokenType = 'user') {
    if (accessToken) sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (tokenType) sessionStorage.setItem(STORAGE_KEYS.TOKEN_TYPE, tokenType);
  },
  
  // 获取Access Token
  getAccessToken() {
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  // 获取Refresh Token
  getRefreshToken() {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  // 获取Token类型
  getTokenType() {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN_TYPE) || 'user';
  },
  
  // 清除所有Token
  clearTokens() {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
    sessionStorage.removeItem('token');  // 兼容旧版
    sessionStorage.removeItem('userInfo');
  },
  
  // 更新Access Token（刷新时使用）
  updateAccessToken(newAccessToken) {
    if (newAccessToken) {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      console.log('Access Token已更新');
    }
  }
};

// ========== 刷新Token状态管理（防止并发刷新）==========
let isRefreshing = false;           // 是否正在刷新
let refreshSubscribers = [];        // 等待队列

// 添加等待队列
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// 通知所有等待的请求
function onTokenRefreshed(newAccessToken) {
  refreshSubscribers.forEach(callback => callback(newAccessToken));
  refreshSubscribers = [];
}

// 执行刷新Token
async function refreshAccessToken() {
  const refreshToken = TokenManager.getRefreshToken();
  const tokenType = TokenManager.getTokenType();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    // 调用刷新接口
    const response = await axios({
      method: 'POST',
      url: '/refresh-token',
      headers: {
        'refresh-token': refreshToken,
        'x-token-type': tokenType
      },
      timeout: 10000
    });
    
    // 根据你的后端响应格式调整
    const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
    
    if (newAccessToken) {
      TokenManager.updateAccessToken(newAccessToken);
      return newAccessToken;
    }
    
    return null;
  } catch (error) {
    console.error('刷新Token失败', error);
    return null;
  }
}

// ========== 请求拦截器：携带双Token ==========
instance.interceptors.request.use(
  (config) => {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();
    const tokenType = TokenManager.getTokenType();
    
    // 根据tokenType决定使用哪个header（与后端约定）
    if (tokenType === 'admin') {
      // 管理端使用 admin-token
      if (accessToken) config.headers['admin-token'] = accessToken;
      if (refreshToken) config.headers['admin-refresh-token'] = refreshToken;
    } else {
      // 用户端使用 authentication（与后端配置一致）
      if (accessToken) config.headers['authentication'] = accessToken;
      if (refreshToken) config.headers['refresh-token'] = refreshToken;
    }
    
    // 同时携带tokenType，方便后端识别
    if (tokenType) config.headers['x-token-type'] = tokenType;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== 响应拦截器：处理Token自动刷新 ==========
instance.interceptors.response.use(
  (response) => {
    // 1. 检查响应头是否有新Token（后端自动刷新时返回）
    // 后端 UserRefreshTokenInterceptor 通过 response.setHeader(userTokenName, newAccessToken) 返回
    const newAccessToken = 
      response.headers['authentication'] || 
      response.headers['Authorization'] ||
      response.headers['new-access-token'] || 
      response.headers['new-admin-token'] ||
      response.headers['new-user-token'];
    
    if (newAccessToken) {
      TokenManager.updateAccessToken(newAccessToken);
      console.log('Token已自动刷新（响应头）');
    }
    
    // 2. 处理登录响应的Token（首次登录）
    const res = response.data;
    
    // 假设登录响应格式：{ code: 1, data: { accessToken, refreshToken } }
    if (res && res.code === 1) {
      const data = res.data;
      if (data?.accessToken && data?.refreshToken) {
        // 登录成功，保存双Token
        const tokenType = data.tokenType || (window.location.pathname.startsWith('/admin') ? 'admin' : 'user');
        TokenManager.setTokens(data.accessToken, data.refreshToken, tokenType);
        console.log('登录成功，双Token已保存');
      }
    }
    
    // 3. 兼容旧版单Token响应
    const oldToken = res?.token || res?.data?.token;
    if (oldToken && !res?.accessToken) {
      // 兼容模式：将旧token作为accessToken保存
      TokenManager.setTokens(oldToken, null, 'user');
    }
    
    // 返回数据（解包Result格式）
    if (res && typeof res.code !== 'undefined') {
      return res.code === 1 ? res.data : Promise.reject(new Error(res.msg || '请求失败'));
    }
    
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 防止无限循环
    if (originalRequest._retry) {
      TokenManager.clearTokens();
      router.push('/login');
      return Promise.reject(error);
    }
    
    // 处理401未授权
    if (error.response?.status === 401) {
      // 先检查响应头是否有后端自动刷新的新Token
      const newAccessToken = 
        error.response.headers['authentication'] || 
        error.response.headers['Authorization'];
      
      if (newAccessToken) {
        // 后端已自动刷新，更新Token并重试
        TokenManager.updateAccessToken(newAccessToken);
        console.log('收到后端自动刷新的Token，重试请求');
        
        originalRequest._retry = true;
        originalRequest.headers['authentication'] = newAccessToken;
        return instance(originalRequest);
      }
      
      // 没有新Token，说明Refresh Token也过期了，需要重新登录
      ElMessage.error('登录已过期，请重新登录');
      TokenManager.clearTokens();
      router.push('/login');
      return Promise.reject(error);
    }
    
    // 其他错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 403) {
        ElMessage.error('没有权限访问');
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error('服务器错误，请稍后重试');
      } else if (status === 401) {
        // 已在上面处理，这里不再重复
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