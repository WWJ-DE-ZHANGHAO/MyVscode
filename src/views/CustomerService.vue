<template>
  <div class="admin-chat-container">
    <div class="chat-header">
      <h2>客服中心</h2>
    </div>

    <div class="chat-main-wrap">
      <!-- 左侧会话列表 -->
      <div class="session-left">
        <div class="session-title">
          <span class="active-tab">会话列表</span>
        </div>
        <div class="session-list">
          <div
            v-for="session in sessionList"
            :key="session.userId"
            class="session-item"
            :class="{ 'active': currentChatUserId === session.userId }"
            @click="switchSession(session)"
          >
            <div class="session-avatar"></div>
            <div class="session-info">
              <div class="session-top">
                <div class="session-user-name">用户{{ session.userId }}</div>
                <div v-if="session.adminUnreadCount > 0" class="unread-badge">
                  {{ session.adminUnreadCount }}
                </div>
              </div>
              <div class="session-last-msg">{{ session.lastMessage }}</div>
              <div class="session-time">{{ formatTime(session.lastMessageTime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间聊天窗口 -->
      <div class="chat-middle">
        <div class="chat-middle-header" v-if="currentChatUserId">
          <span>用户{{ currentChatUserId }}</span>
          <span class="connection-status" :class="connectionStatus">
            {{ connectionText }}
          </span>
        </div>

        <div class="chat-message-box" ref="msgBoxRef">
          <div v-if="!currentChatUserId" class="empty-tip">请从左侧选择聊天用户</div>

          <div v-for="msg in messageList" :key="msg.id" class="msg-item" :class="msg.senderType">
            <!-- 用户消息 -->
            <div v-if="msg.senderType === 'USER'" class="msg-left">
              <div class="msg-avatar"></div>
              <div class="msg-content-wrap">
                <div v-if="msg.msgType === 'TEXT'" class="msg-text">
                  {{ msg.content }}
                </div>
                <div v-if="msg.msgType === 'IMAGE'" class="msg-img">
                  <img :src="msg.content" alt="图片消息" />
                </div>
                <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
              </div>
            </div>

            <!-- 客服消息 -->
            <div v-if="msg.senderType === 'ADMIN'" class="msg-right">
              <div class="msg-content-wrap">
                <div v-if="msg.msgType === 'TEXT'" class="msg-text">
                  {{ msg.content }}
                </div>
                <div v-if="msg.msgType === 'IMAGE'" class="msg-img">
                  <img :src="msg.content" alt="图片消息" />
                </div>
                <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
              </div>
              <div class="msg-avatar"></div>
            </div>
          </div>
        </div>

        <!-- 底部输入栏 -->
        <div class="chat-bottom-input" v-if="currentChatUserId">
          <div class="input-tool">
            <label class="img-upload-btn">
              📷
              <input type="file" accept="image/*" @change="handleImgUpload" hidden />
            </label>
          </div>
          <textarea
            v-model="sendContent"
            placeholder="请输入消息，Enter快捷发送"
            @keydown.enter.prevent="sendMessage"
          ></textarea>
          <button class="send-btn" @click="sendMessage">发送</button>
        </div>
      </div>

      <!-- 右侧用户信息面板 -->
      <div class="info-right" v-if="currentChatUserId">
        <div class="info-tab">
          <span class="active">客户信息</span>
        </div>
        <div class="info-form">
          <div class="info-item">
            <span class="label">称呼：</span>
            <input class="input" disabled :value="`用户${currentChatUserId}`" />
          </div>
          <div class="info-item">
            <span class="label">备注：</span>
            <input class="input" placeholder="请修改客户信息" />
          </div>
          <div class="info-item">
            <span class="label">姓名：</span>
            <input class="input" placeholder="请修改客户信息" />
          </div>
          <div class="info-item">
            <span class="label">地区：</span>
            <input class="input" placeholder="请修改客户信息" />
          </div>
          <div class="info-item">
            <span class="label">其他信息：</span>
            <textarea class="textarea" placeholder="请修改客户信息"></textarea>
          </div>
          <button class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getChatHistory, getChatSessionList, markMsgRead } from '@/api/chat'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 全局变量
const sessionList = ref([])
const currentChatUserId = ref(null)
const messageList = ref([])
const sendContent = ref('')
const msgBoxRef = ref(null)
let stompClient = null
const isConnected = ref(false)
const connectionStatus = ref('disconnected')
const connectionText = ref('未连接')
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

// 获取 token 的函数
const getToken = () => {
  let token = sessionStorage.getItem('token')
  if (!token) {
    token = localStorage.getItem('token')
  }
  return token
}

// 解析 adminId
const getAdminId = () => {
  const token = getToken()
  if (!token) return 1
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.adminId || payload.id || 1
  } catch (e) {
    console.error('解析token失败', e)
    return 1
  }
}

const adminId = ref(getAdminId())

// 初始化 WebSocket 连接
const initStompConnection = () => {
  const token = getToken()
  
  if (!token) {
    console.error('未找到管理员token，请先登录')
    connectionStatus.value = 'disconnected'
    connectionText.value = '未登录'
    ElMessage.error('请先登录')
    return
  }

  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  console.log('开始建立客服端 WebSocket 连接...')
  connectionStatus.value = 'connecting'
  connectionText.value = '连接中...'

  // 重要：token 通过 URL 参数传递（SockJS 不支持自定义 headers）
  const wsUrl = `http://localhost:8080/ws?token=${encodeURIComponent(token)}`
  console.log('连接URL:', wsUrl.replace(token, 'token=***'))
  
  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: {},  // 清空，不使用 headers
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    debug: (str) => {
      // 只打印重要信息，避免日志过多
      if (str.includes('CONNECTED') || str.includes('ERROR')) {
        console.log('STOMP:', str)
      }
    }
  })

  stompClient.onConnect = (frame) => {
    console.log('✅ 客服端 WebSocket 连接成功！', frame)
    isConnected.value = true
    connectionStatus.value = 'connected'
    connectionText.value = '在线'
    reconnectAttempts = 0

    // 订阅所有用户发来的全局广播消息
    stompClient.subscribe('/topic/admin.messages', (message) => {
      const msgData = JSON.parse(message.body)
      console.log('📨 收到用户消息:', msgData)
      
      // 刷新会话列表更新未读数
      getSessionList()
      
      // 统一转换为数字比较
      const currentId = Number(currentChatUserId.value)
      const senderId = Number(msgData.senderId)
      
      // 如果是当前聊天用户，消息追加到窗口
      if (currentChatUserId.value && currentId === senderId) {
        messageList.value.push(msgData)
        scrollToBottom()
      }
      // 如果没有当前聊天用户，自动切换到该用户
      else if (!currentChatUserId.value && msgData.senderType === 'USER') {
        currentChatUserId.value = msgData.senderId
        loadChatHistory(msgData.senderId)
      }
    })
    
    console.log('✅ 已订阅 /topic/admin.messages')
  }

  stompClient.onStompError = (error) => {
    console.error('STOMP 错误:', error)
    connectionStatus.value = 'disconnected'
    connectionText.value = '连接失败'
    isConnected.value = false
    scheduleReconnect()
  }

  stompClient.onWebSocketError = (error) => {
    console.error('WebSocket 错误:', error)
    connectionStatus.value = 'disconnected'
    connectionText.value = '连接错误'
    isConnected.value = false
    scheduleReconnect()
  }

  stompClient.onDisconnect = () => {
    console.log('WebSocket 连接已断开')
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    connectionText.value = '已断开'
    scheduleReconnect()
  }

  stompClient.activate()
}

// 重连逻辑
const scheduleReconnect = () => {
  if (reconnectTimer) return
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('重连次数已达上限，请手动刷新页面')
    ElMessage.error('连接失败，请刷新页面重试')
    return
  }
  
  reconnectAttempts++
  const delay = Math.min(5000 * reconnectAttempts, 30000)
  console.log(`${delay/1000}秒后进行第${reconnectAttempts}次重连...`)
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initStompConnection()
  }, delay)
}

// 加载会话列表
const getSessionList = async () => {
  try {
    const res = await getChatSessionList()
    
    if (Array.isArray(res.data)) {
      sessionList.value = res.data.map(session => ({
        ...session,
        userId: Number(session.userId)
      }))
      console.log('✅ 会话列表加载成功', sessionList.value.length, '个会话')
    } else if (res.data && res.data.code === 1 && res.data.data) {
      sessionList.value = res.data.data.map(session => ({
        ...session,
        userId: Number(session.userId)
      }))
      console.log('✅ 会话列表加载成功', sessionList.value.length, '个会话')
    } else {
      sessionList.value = []
    }
  } catch (err) {
    console.error('会话列表加载失败', err)
    sessionList.value = []
  }
}

// 加载聊天历史
const loadChatHistory = async (userId) => {
  try {
    const res = await getChatHistory(userId, adminId.value)
    
    if (Array.isArray(res.data)) {
      messageList.value = res.data
      console.log('✅ 历史消息加载成功', messageList.value.length, '条消息')
      scrollToBottom()
    } else if (res.data && res.data.code === 1 && res.data.data) {
      messageList.value = res.data.data
      console.log('✅ 历史消息加载成功', messageList.value.length, '条消息')
      scrollToBottom()
    } else {
      messageList.value = []
    }
  } catch (error) {
    console.error('加载历史消息失败', error)
    messageList.value = []
  }
}

// 切换用户会话
const switchSession = async (session) => {
  if (!session || !session.userId) return
  
  // 确保 userId 是数字
  const userId = Number(session.userId)
  console.log('切换到用户会话:', userId)
  
  currentChatUserId.value = userId
  
  // 如果 WebSocket 未连接，则建立连接
  if (!stompClient || !isConnected.value) {
    initStompConnection()
    // 等待连接成功后再加载数据
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 加载历史消息
  await loadChatHistory(userId)
  
  // 标记消息为已读
  try {
    await markMsgRead(userId, adminId.value)
    await getSessionList()
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

// 发送消息
const sendMessage = async () => {
  const content = sendContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!currentChatUserId.value) {
    ElMessage.warning('请先选择聊天用户')
    return
  }

  // 确保 receiverId 是数字
  const receiverId = Number(currentChatUserId.value)
  console.log('========== 发送消息 ==========')
  console.log('接收者用户ID:', receiverId)
  console.log('管理员ID:', adminId.value)

  const sendMsgData = {
    receiverId: receiverId,
    msgType: 'TEXT',
    content: content,
    isRead: 0
  }

  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(sendMsgData)
    })
    console.log('✅ 消息已发送到 /app/chat.send')
  } else {
    console.error('WebSocket未连接，尝试重新连接...')
    ElMessage.warning('连接已断开，正在重连...')
    initStompConnection()
    return
  }

  // 本地消息回显
  const localMessage = {
    id: Date.now(),
    receiverId: receiverId,
    senderId: adminId.value,
    senderType: 'ADMIN',
    msgType: 'TEXT',
    content: content,
    createTime: new Date().toISOString()
  }
  messageList.value.push(localMessage)

  sendContent.value = ''
  scrollToBottom()
}

// 图片上传
const handleImgUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (!currentChatUserId.value) {
    ElMessage.warning('请先选择聊天用户')
    return
  }
  
  // 检查文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过5MB')
    return
  }
  
  try {
    // 1. 先上传图片到服务器
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadRes = await request.post('/admin/upload/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (uploadRes.code === 1 && uploadRes.data) {
      const imageUrl = uploadRes.data  // 获取图片URL
      
      // 2. 通过WebSocket发送图片URL
      const sendMsgData = {
        receiverId: Number(currentChatUserId.value),
        msgType: 'IMAGE',
        content: imageUrl,
        isRead: 0
      }

      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(sendMsgData)
        })
        console.log('✅ 图片消息已发送，URL:', imageUrl)
      }

      messageList.value.push({
        id: Date.now(),
        ...sendMsgData,
        senderId: adminId.value,
        senderType: 'ADMIN',
        createTime: new Date().toISOString()
      })

      scrollToBottom()
      ElMessage.success('图片发送成功')
    } else {
      ElMessage.error('图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败', error)
    ElMessage.error('图片上传失败')
  }
  
  e.target.value = ''
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (msgBoxRef.value) {
    msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
  }
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('HH:mm')
}

// 页面挂载
onMounted(() => {
  getSessionList()
})

// 页面卸载
onUnmounted(() => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
})
</script>

<style scoped>
/* 样式保持不变 */
.admin-chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.chat-header {
  height: 60px;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
}

.chat-header h2 {
  font-size: 18px;
  font-weight: 500;
}

.chat-main-wrap {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.session-left {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.session-title {
  height: 50px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.session-title span {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.session-title .active-tab {
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
  font-weight: 500;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #e6f7ff;
}

.session-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1890ff;
  margin-right: 12px;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.session-user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.unread-badge {
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.session-last-msg {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.session-time {
  font-size: 11px;
  color: #bbb;
}

.chat-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-middle-header {
  height: 50px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 500;
}

.connection-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.connection-status.connected {
  background: #52c41a;
  color: #fff;
}

.connection-status.disconnected {
  background: #ff4d4f;
  color: #fff;
}

.connection-status.connecting {
  background: #faad14;
  color: #fff;
}

.chat-message-box {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.msg-item {
  margin-bottom: 20px;
}

.msg-left {
  display: flex;
  align-items: flex-start;
}

.msg-right {
  display: flex;
  align-items: flex-start;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1890ff;
  flex-shrink: 0;
}

.msg-right .msg-avatar {
  background: #52c41a;
}

.msg-content-wrap {
  max-width: 60%;
  margin: 0 10px;
}

.msg-text {
  background: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.msg-right .msg-text {
  background: #1890ff;
  color: #fff;
}

.msg-img img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
}

.msg-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  text-align: center;
}

.chat-bottom-input {
  height: 120px;
  border-top: 1px solid #e8e8e8;
  padding: 15px 20px;
  display: flex;
  align-items: flex-end;
  background: #fff;
}

.input-tool {
  margin-right: 10px;
}

.img-upload-btn {
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
}

.chat-bottom-input textarea {
  flex: 1;
  height: 60px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px 12px;
  resize: none;
  font-size: 14px;
  outline: none;
}

.chat-bottom-input textarea:focus {
  border-color: #1890ff;
}

.send-btn {
  width: 60px;
  height: 60px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:hover {
  background: #40a9ff;
}

.info-right {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.info-tab {
  height: 50px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.info-tab span {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.info-tab .active {
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
  font-weight: 500;
}

.info-form {
  flex: 1;
  padding: 20px 15px;
  overflow-y: auto;
}

.info-item {
  margin-bottom: 15px;
}

.label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.input, .textarea {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 14px;
  outline: none;
}

.input:focus, .textarea:focus {
  border-color: #1890ff;
}

.textarea {
  height: 60px;
  resize: none;
}

.save-btn {
  width: 100%;
  height: 36px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.save-btn:hover {
  background: #40a9ff;
}
</style>