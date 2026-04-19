<template>
  <div class="admin-chat-container">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <h2>全渠道客服中心</h2>
    </div>

    <div class="chat-main-wrap">
      <!-- ==================== 左侧：会话列表栏 ==================== -->
      <div class="session-left">
        <div class="session-title">
          <span class="active-tab">会话</span>
          <span>历史</span>
        </div>
        <div class="session-list">
          <!-- 遍历所有用户会话 -->
          <div
            v-for="session in sessionList"
            :key="session.userId"
            class="session-item"
            :class="{ 'active': currentChatUserId === session.userId }"
            @click="switchSession(session)"
          >
            <!-- 用户头像 -->
            <div class="session-avatar"></div>
            <div class="session-info">
              <div class="session-top">
                <div class="session-user-name">用户{{ session.userId }}</div>
                <!-- 未读消息红点 -->
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

      <!-- ==================== 中间：聊天内容窗口 ==================== -->
      <div class="chat-middle">
        <div class="chat-middle-header" v-if="currentChatUserId">
          <span>用户{{ currentChatUserId }}</span>
        </div>

        <div class="chat-message-box" ref="msgBoxRef">
          <div v-if="!currentChatUserId" class="empty-tip">请从左侧选择聊天用户</div>

          <!-- 消息气泡遍历 -->
          <div v-for="msg in messageList" :key="msg.id" class="msg-item" :class="msg.senderType">
            <!-- 用户发来的消息（左侧气泡） -->
            <div v-if="msg.senderType === 'USER'" class="msg-left">
              <div class="msg-avatar"></div>
              <div class="msg-content-wrap">
                <div v-if="splitContent(msg.content).text" class="msg-text">
                  {{ splitContent(msg.content).text }}
                </div>
                <div v-if="splitContent(msg.content).imgUrl" class="msg-img">
                  <img :src="splitContent(msg.content).imgUrl" alt="图片消息" />
                </div>
                <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
              </div>
            </div>

            <!-- 客服自己发送的消息（右侧气泡） -->
            <div v-if="msg.senderType === 'ADMIN'" class="msg-right">
              <div class="msg-content-wrap">
                <div v-if="splitContent(msg.content).text" class="msg-text">
                  {{ splitContent(msg.content).text }}
                </div>
                <div v-if="splitContent(msg.content).imgUrl" class="msg-img">
                  <img :src="splitContent(msg.content).imgUrl" alt="图片消息" />
                </div>
                <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
              </div>
              <div class="msg-avatar"></div>
            </div>
          </div>
        </div>

        <!-- 底部输入发送栏 -->
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

      <!-- ==================== 右侧：用户信息面板 ==================== -->
      <div class="info-right" v-if="currentChatUserId">
        <div class="info-tab">
          <span class="active">客户信息</span>
          <span>工单</span>
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
import { ref, onMounted, nextTick } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client' // 【关键】SockJS适配后端
import { getChatHistory, getChatSessionList, markMsgRead } from '@/api/chat'
import dayjs from 'dayjs'

// 客服固定自身ID
const ADMIN_ID = 1

// 全局变量
const sessionList = ref([]) // 左侧所有用户会话
const currentChatUserId = ref(null) // 当前选中聊天的用户ID
const messageList = ref([]) // 当前窗口消息列表
const sendContent = ref('')
const imgUrl = ref('')
const msgBoxRef = ref(null)
let stompClient = null

// 页面挂载初始化
onMounted(async () => {
  // 1. 加载全部用户会话列表（解决左侧空白无数据问题）
  await getSessionList()
  // 2. 初始化客服端WebSocket正确连接
  initStompConnect()
})

// 加载会话列表（修复304缓存+数据渲染）
const getSessionList = async () => {
  try {
    const res = await getChatSessionList()
    if (res.data.code === 1 && res.data.data) {
      sessionList.value = res.data.data
    }
    console.log('✅ 会话列表数据', sessionList.value)
  } catch (err) {
    console.error('会话列表加载失败', err)
  }
}

// ====================== 【核心修复】客服端SockJS正确连接 ======================
const initStompConnect = () => {
  const adminToken = localStorage.getItem('ADMIN_TOKEN')
  console.log('客服端Token', adminToken)

  stompClient = new Client({
    webSocketFactory: () => {
      return new SockJS('http://localhost:8080/ws')
    },
    connectHeaders: {
      token: adminToken // 客服端专属请求头token，完全匹配后端拦截器
    },
    debug: (str) => {
      console.log('客服端STOMP日志', str)
    }
  })

  stompClient.onConnect = (frame) => {
    console.log('✅ 客服端WebSocket连接成功！', frame)
    // 订阅所有用户发来的全局广播消息
    stompClient.subscribe('/topic/admin.messages', (message) => {
      const msgData = JSON.parse(message.body)
      console.log('收到用户新消息', msgData)
      // 新消息进来，刷新会话列表更新未读数
      getSessionList()
      // 如果是当前聊天用户，消息追加到窗口
      if (currentChatUserId.value === msgData.senderId) {
        messageList.value.push(msgData)
        scrollToBottom()
      }
    })
  }

  stompClient.onStompError = (frame) => {
    console.error('❌ 客服端连接失败', frame.headers['message'])
  }

  stompClient.activate()
}

// 切换用户会话
const switchSession = async (session) => {
  currentChatUserId.value = session.userId
  // 加载历史消息
  try {
    const res = await getChatHistory(session.userId, ADMIN_ID)
    if (res.data.code === 1 && res.data.data) {
      messageList.value = res.data.data
    }
    // 打开会话自动标记消息已读
    await markMsgRead(session.userId, ADMIN_ID)
    // 刷新会话未读数
    await getSessionList()
  } catch (error) {
    console.error('切换会话失败:', error)
  }
  nextTick(() => scrollToBottom())
}

// 图片上传
const handleImgUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  imgUrl.value = 'https://picsum.photos/300/200'
}

// 客服发送消息
const sendMessage = () => {
  if (!currentChatUserId.value) return
  if (!sendContent.value && !imgUrl.value) {
    alert('请输入文字或上传图片')
    return
  }

  let content = sendContent.value
  if (imgUrl.value) {
    content += `|${imgUrl.value}`
  }

  const sendMsgData = {
    receiverId: currentChatUserId.value,
    msgType: imgUrl.value ? 'IMAGE' : 'TEXT',
    content: content,
    isRead: 0
  }

  console.log('客服发送消息', sendMsgData)
  if (stompClient) {
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(sendMsgData)
    })
  }

  // 本地消息回显
  messageList.value.push({
    ...sendMsgData,
    senderType: 'ADMIN',
    createTime: new Date()
  })

  sendContent.value = ''
  imgUrl.value = ''
  scrollToBottom()
}

// 工具函数
const splitContent = (content) => {
  if (!content) return { text: '', imgUrl: '' }
  const arr = content.split('|')
  return {
    text: arr[0],
    imgUrl: arr.length > 1 ? arr[1] : ''
  }
}
const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
const scrollToBottom = () => {
  if (msgBoxRef.value) {
    msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
  }
}
</script>

<style scoped>
.admin-chat-container {
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}
.chat-header {
  height: 60px;
  background-color: #0f172a;
  color: #fff;
  line-height: 60px;
  padding-left: 20px;
}
.chat-main-wrap {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧会话列表 */
.session-left {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}
.session-title {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
}
.session-title span {
  margin-right: 20px;
  cursor: pointer;
}
.session-title .active-tab {
  color: #165DFF;
  font-weight: 600;
  border-bottom: 2px solid #165DFF;
}
.session-list {
  flex: 1;
  overflow-y: auto;
}
.session-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  gap: 12px;
}
.session-item.active {
  background-color: #eef4ff;
}
.session-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #d3dce6;
  flex-shrink: 0;
}
.session-info {
  flex: 1;
  overflow: hidden;
}
.session-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.session-user-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}
.unread-badge {
  min-width: 18px;
  height: 18px;
  background-color: #ff4d4f;
  color: #fff;
  border-radius: 9px;
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  padding: 0 5px;
}
.session-last-msg {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.session-time {
  font-size: 11px;
  color: #999;
  align-self: flex-start;
}

/* 中间聊天窗口 */
.chat-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}
.chat-middle-header {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  background-color: #fff;
  font-weight: 600;
  color: #333;
}
.chat-message-box {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.empty-tip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
.msg-item {
  display: flex;
  max-width: 70%;
}
.msg-left {
  align-self: flex-start;
  flex-direction: row;
  gap: 10px;
}
.msg-right {
  align-self: flex-end;
  flex-direction: row-reverse;
  gap: 10px;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #165DFF;
  flex-shrink: 0;
}
.msg-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg-text {
  padding: 10px 14px;
  border-radius: 12px;
  word-break: break-all;
}
.msg-left .msg-text {
  background-color: #fff;
  border: 1px solid #eee;
}
.msg-right .msg-text {
  background-color: #165DFF;
  color: #fff;
}
.msg-img img {
  max-width: 220px;
  border-radius: 12px;
}
.msg-time {
  font-size: 11px;
  color: #bbb;
}

/* 底部输入栏 */
.chat-bottom-input {
  padding: 15px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #fff;
}
.input-tool {
  display: flex;
  gap: 10px;
}
.img-upload-btn {
  font-size: 20px;
  cursor: pointer;
}
.chat-bottom-input textarea {
  height: 80px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px;
  resize: none;
  outline: none;
}
.send-btn {
  align-self: flex-end;
  padding: 6px 20px;
  background-color: #165DFF;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 右侧用户信息面板 */
.info-right {
  width: 320px;
  border-left: 1px solid #eee;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}
.info-tab {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 30px;
}
.info-tab span {
  cursor: pointer;
  font-size: 14px;
  color: #666;
  padding-bottom: 10px;
}
.info-tab .active {
  color: #165DFF;
  font-weight: 600;
  border-bottom: 2px solid #165DFF;
}
.info-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.info-item .label {
  width: 60px;
  color: #666;
  font-size: 14px;
}
.info-item .input {
  flex: 1;
  height: 36px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0 10px;
  outline: none;
}
.info-item .textarea {
  flex: 1;
  height: 100px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  resize: none;
  outline: none;
}
.save-btn {
  margin-top: 10px;
  padding: 8px 0;
  background-color: #165DFF;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>