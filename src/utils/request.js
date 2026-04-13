import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  // 直接使用相对路径，后端接口路径以 '/admin' 开头
  baseURL: '',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    console.log('请求拦截器 - 请求配置:', config)
    // 从sessionStorage中获取token
    const token = sessionStorage.getItem('token')
    console.log('请求拦截器 - token:', token)
    // 如果token存在，添加到请求头
    if (token) {
      config.headers.token = token
    }
    console.log('请求拦截器 - 请求头:', config.headers)
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('响应拦截器 - 原始响应:', response)
    console.log('响应拦截器 - 响应数据:', response.data)
    console.log('响应拦截器 - 响应状态码:', response.status)
    console.log('响应拦截器 - 响应内容类型:', response.headers['content-type'])
    
    // 检查响应是否是JSON格式
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
      // 后端使用code=1表示成功，code=0表示失败
      if (response.data && response.data.code === 1) {
        // 成功，直接返回response.data，这样其他页面就不需要再写response.data了
        console.log('响应拦截器 - 成功，返回数据')
        return response.data
      } else {
        // 业务逻辑失败，显示错误信息
        const errorMsg = response.data.msg || '请求失败'
        console.log('响应拦截器 - 业务失败:', errorMsg)
        // 创建一个新的Error对象，保留原始响应数据
        const error = new Error(errorMsg)
        error.response = response
        return Promise.reject(error)
      }
    } else {
      // 响应不是JSON格式，可能是HTML页面（比如登录页）
      console.log('响应拦截器 - 非JSON响应，可能是HTML页面')
      // 直接返回响应，不做处理
      return response
    }
  },
  error => {
    console.log('响应拦截器 - 错误:', error)
    console.log('响应拦截器 - 错误响应:', error.response)
    if (error.response) {
      console.log('响应拦截器 - 错误状态码:', error.response.status)
      console.log('响应拦截器 - 错误内容类型:', error.response.headers['content-type'])
      console.log('响应拦截器 - 错误数据:', error.response.data)
    }
    // 处理401错误（未授权）
    if (error.response && error.response.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      // 清除本地存储的token
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('username')
      // 跳转到登录页
      window.location.href = '/login'
    } else if (error.message && error.message.includes('Network Error')) {
      // 网络错误，可能是后端API不可用
      console.log('响应拦截器 - 网络错误，后端API可能不可用')
      // 不显示错误信息，避免页面被错误提示淹没
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request