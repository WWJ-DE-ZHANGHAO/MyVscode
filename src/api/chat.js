import axios from 'axios'

const chatRequest = axios.create({
  baseURL: import.meta.env.VITE_BASE_API + '/api'
})

// 添加请求拦截器，自动添加token
chatRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('ADMIN_TOKEN') || sessionStorage.getItem('token')
    if (token) {
      config.headers.token = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 获取聊天历史
export const getChatHistory = (userId, adminId) => {
  return chatRequest.get('/chat/history', {
    params: { userId, adminId }
  })
}

// 获取全部会话列表（客服专用）
export const getChatSessionList = () => {
  return chatRequest.get('/chat/sessions')
}

// 标记消息已读
export const markMsgRead = (senderId, receiverId) => {
  return chatRequest.put('/chat/read', {
    senderId, receiverId
  })
}

export default chatRequest