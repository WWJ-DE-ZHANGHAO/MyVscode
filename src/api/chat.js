import axios from 'axios'

const chatRequest = axios.create({
  baseURL: import.meta.env.VITE_BASE_API + '/api'
})

export const getChatHistory = (userId, adminId) => {
  return chatRequest.get('/chat/history', {
    params: { userId, adminId }
  })
}

export const getChatSessionList = () => {
  return chatRequest.get('/chat/sessions')
}

export const markMsgRead = (senderId, receiverId) => {
  return chatRequest.put('/chat/read', {
    senderId, receiverId
  })
}

export const sendChatMessage = (message) => {
  return chatRequest.post('/chat/send', message)
}

export default chatRequest
