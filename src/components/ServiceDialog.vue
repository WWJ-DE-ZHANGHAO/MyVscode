<template>
  <div class="service-chat" v-show="visible">
    <div class="chat-header">
      <div class="header-left">
        <el-icon class="service-icon"><ChatRound /></el-icon>
        <span class="header-title">在线客服</span>
      </div>
      <div class="connection-status" :class="connectionStatus">
        {{ connectionText }}
      </div>
      <el-icon class="close-icon" @click="close"><Close /></el-icon>
    </div>
    
    <div class="chat-content" ref="chatContent">
      <div class="message system-message">
        <span>欢迎咨询，客服将在30秒内回复您</span>
      </div>
      
      <div 
        v-for="(msg, index) in messages" 
        :key="msg.id"
        :class="[
          'message',
          msg.senderType === 'ADMIN' ? 'msg-left' : 'msg-right'
        ]"
      >
        <div v-if="msg.senderType === 'ADMIN'" class="msg-avatar">客</div>
        <div class="msg-content-wrap">
          <div v-if="msg.msgType === 'TEXT'" class="msg-text">{{ msg.content }}</div>
          <div v-if="msg.msgType === 'IMAGE'" class="msg-img">
            <img :src="msg.content" alt="图片" />
          </div>
          <div class="msg-time">
            {{ msg.time }}
            <span v-if="msg.senderType === 'USER'" class="msg-status">
              {{ getMessageStatus(msg) }}
            </span>
          </div>
        </div>
        <div v-if="msg.senderType === 'USER'" class="msg-avatar">我</div>
      </div>
    </div>
    
    <div class="emoji-panel" v-show="showEmoji">
      <div class="emoji-grid">
        <span 
          v-for="(emoji, index) in emojis" 
          :key="index"
          class="emoji-item"
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </span>
      </div>
    </div>
    
    <div class="chat-bottom-input">
      <div class="input-tool">
        <span class="img-upload-btn" @click="showEmoji = !showEmoji">😊</span>
        <label class="img-upload-btn" for="file-input">🖼️</label>
        <input 
          type="file" 
          id="file-input" 
          accept="image/*" 
          style="display: none" 
          @change="handleImageUpload"
        />
      </div>
      <textarea 
        v-model="inputMessage" 
        placeholder="请输入消息..." 
        @keyup.enter.prevent="sendMessage"
      ></textarea>
      <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim()">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onUnmounted } from 'vue';
import { Close, ChatRound } from '@element-plus/icons-vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible']);

const inputMessage = ref('');
const showEmoji = ref(false);
const chatContent = ref(null);
let stompClient = null;
const isConnected = ref(false);
const connectionStatus = ref('disconnected');
const connectionText = ref('未连接');

const messages = ref([
  {
    id: 1,
    content: '您好，欢迎来到云图书城客服中心，请问有什么可以帮助您的？',
    time: new Date().toLocaleTimeString(),
    senderType: 'ADMIN',
    msgType: 'TEXT'
  }
]);

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'
];

// 客服ID
const ADMIN_ID = 2;

// 获取 token 的函数
const getToken = () => {
  let token = sessionStorage.getItem('authentication');
  if (!token) {
    token = sessionStorage.getItem('token');
  }
  if (!token) {
    token = localStorage.getItem('authentication');
  }
  if (!token) {
    token = localStorage.getItem('token');
  }
  return token;
};

// 获取当前用户信息
const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId || payload.id,
      role: 'USER'
    };
  } catch (e) {
    console.error('解析token失败', e);
    return null;
  }
};

const currentUser = getCurrentUser();

// 初始化 WebSocket 连接
const initStompConnection = () => {
  const token = getToken();
  
  if (!token) {
    console.error('未登录，无法建立连接');
    connectionStatus.value = 'disconnected';
    connectionText.value = '未登录';
    ElMessage.warning('请先登录后再使用客服功能');
    return;
  }

  if (!currentUser) {
    console.error('无法获取用户信息');
    return;
  }

  console.log('开始建立用户端 WebSocket 连接...');
  console.log('用户ID:', currentUser.userId);
  connectionStatus.value = 'connecting';
  connectionText.value = '连接中...';

  const socketUrl = `http://localhost:8080/ws?token=${encodeURIComponent(token)}`;
  console.log('连接地址:', socketUrl.replace(token, 'token=***'));
  
  const socket = new SockJS(socketUrl);
  
  stompClient = new Client({
    webSocketFactory: () => socket,
    connectHeaders: {
      token: token,
      login: currentUser.userId.toString(),
      passcode: token
    },
    debug: (str) => {
      console.log('STOMP调试:', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0
  });

  stompClient.onConnect = (frame) => {
    console.log('✅ 用户端 WebSocket 连接成功！', frame);
    console.log('📡 连接 frame headers:', frame.headers);
    console.log('📡 当前用户ID:', currentUser.userId);
    isConnected.value = true;
    connectionStatus.value = 'connected';
    connectionText.value = '在线';

    // 订阅点对点消息队列
    // 后端使用 convertAndSendToUser(receiverId, "/queue/messages", message)
    // 这会发送到 /user/{receiverId}/queue/messages
    // 前端订阅 /user/queue/messages，STOMP会自动解析为 /user/{login}/queue/messages
    const subscription = stompClient.subscribe('/user/queue/messages', (message) => {
      console.log('📥 收到原始消息:', message);
      console.log('📥 消息 headers:', message.headers);
      console.log('📥 消息 destination:', message.headers.destination);
      const msgData = JSON.parse(message.body);
      console.log('📨 解析后的消息数据:', msgData);
      console.log('📨 消息 senderType:', msgData.senderType);
      console.log('📨 消息 senderId:', msgData.senderId);
      console.log('📨 消息 receiverId:', msgData.receiverId);
      console.log('📨 当前用户ID:', currentUser.userId);
      console.log('📨 消息是否应该显示给当前用户:', msgData.receiverId === currentUser.userId);
      
      messages.value.push({
        id: msgData.id || Date.now(),
        content: msgData.content,  // 直接保存base64数据，不要包装成HTML
        time: new Date().toLocaleTimeString(),
        senderType: msgData.senderType,
        msgType: msgData.msgType
      });
      scrollToBottom();
    });
    
    console.log('✅ 已订阅 /user/queue/messages，subscription id:', subscription);
    
    // 同时订阅广播消息（以防后端使用广播）
    stompClient.subscribe('/topic/messages', (message) => {
      console.log('📢 收到广播消息:', message);
    });
    
    // 也尝试订阅不带 /user 前缀的路径
    stompClient.subscribe('/queue/messages', (message) => {
      console.log('📬 收到 /queue/messages 消息:', message);
    });
  };

  stompClient.onStompError = (error) => {
    console.error('STOMP 错误:', error);
    connectionStatus.value = 'disconnected';
    connectionText.value = '连接失败';
    isConnected.value = false;
    ElMessage.error('客服连接失败');
  };

  stompClient.onWebSocketError = (error) => {
    console.error('WebSocket 错误:', error);
    connectionStatus.value = 'disconnected';
    connectionText.value = '连接错误';
    isConnected.value = false;
  };

  stompClient.onDisconnect = () => {
    console.log('WebSocket 连接已断开');
    isConnected.value = false;
    connectionStatus.value = 'disconnected';
    connectionText.value = '已断开';
  };

  stompClient.activate();
};

// 发送消息
const sendMessage = () => {
  const content = inputMessage.value.trim();
  if (!content) return;

  const token = getToken();
  if (!token) {
    ElMessage.error('请先登录');
    return;
  }

  // 检查连接状态
  if (!stompClient || !stompClient.connected) {
    console.warn('WebSocket 连接已断开，正在重新连接...');
    ElMessage.warning('连接已断开，正在重新连接...');
    initStompConnection();
    // 等待连接建立后再发送消息
    setTimeout(() => {
      if (stompClient && stompClient.connected) {
        sendMessage();
      }
    }, 2000);
    return;
  }

  const tempId = Date.now();
  
  messages.value.push({
    id: tempId,
    content: content,
    time: new Date().toLocaleTimeString(),
    senderType: 'USER',
    msgType: 'TEXT'
  });
  
  inputMessage.value = '';
  showEmoji.value = false;
  scrollToBottom();

  const msgData = {
    receiverId: ADMIN_ID,
    msgType: 'TEXT',
    content: content
  };

  stompClient.publish({
    destination: '/app/chat.send',
    body: JSON.stringify(msgData)
  });
  console.log('消息已发送:', msgData);
};

// 发送图片消息
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const token = getToken();
  if (!token) {
    ElMessage.error('请先登录');
    return;
  }
  
  // 检查文件大小（限制 5MB）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    ElMessage.warning(`图片大小不能超过 5MB，当前大小：${(file.size / 1024 / 1024).toFixed(1)}MB`);
    e.target.value = '';
    return;
  }
  
  try {
    // 1. 先上传图片到服务器
    const formData = new FormData();
    formData.append('file', file);
    
    ElMessage.info('正在上传图片...');
    
    const response = await fetch('http://localhost:8080/user/upload/upload', {
      method: 'POST',
      headers: {
        'token': token,
        'authentication': token,
        'Authorization': token
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.code !== 1) {
      ElMessage.error('图片上传失败');
      e.target.value = '';
      return;
    }
    
    const imageUrl = result.data; // 获取图片URL
    console.log('✅ 图片上传成功，URL:', imageUrl);
    
    // 2. 本地显示图片
    messages.value.push({
      id: Date.now(),
      content: imageUrl,
      time: new Date().toLocaleTimeString(),
      senderType: 'USER',
      msgType: 'IMAGE'
    });
    scrollToBottom();
    
    // 3. 通过WebSocket发送图片URL
    const sendMsgData = {
      receiverId: ADMIN_ID,
      msgType: 'IMAGE',
      content: imageUrl
    };
    
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(sendMsgData)
      });
      console.log('✅ 图片消息已发送，URL:', imageUrl);
    } else {
      console.error('WebSocket 未连接');
      ElMessage.warning('连接已断开，图片已本地显示');
    }
  } catch (error) {
    console.error('图片上传失败', error);
    ElMessage.error('图片上传失败：' + error.message);
  }
  
  e.target.value = '';
};

const getMessageStatus = (msg) => {
  return '';
};

const close = () => {
  emit('update:visible', false);
  if (stompClient && isConnected.value) {
    stompClient.deactivate();
    stompClient = null;
  }
  isConnected.value = false;
};

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value;
};

const insertEmoji = (emoji) => {
  inputMessage.value += emoji;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight;
    }
  });
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (!stompClient || !isConnected.value) {
        initStompConnection();
      }
      scrollToBottom();
    });
  } else {
    if (stompClient && isConnected.value) {
      stompClient.deactivate();
      stompClient = null;
    }
  }
});

onUnmounted(() => {
  if (stompClient && isConnected.value) {
    stompClient.deactivate();
    stompClient = null;
  }
});
</script>

<style scoped>
.service-chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  max-width: 90vw;
  height: 500px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #165DFF;
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-icon {
  font-size: 16px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
}

.connection-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.connection-status.connected {
  background: #52c41a;
}

.connection-status.disconnected {
  background: #ff4d4f;
}

.connection-status.connecting {
  background: #faad14;
}

.close-icon {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.close-icon:hover {
  color: #ffd6d6;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
}

.message {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.msg-left {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.msg-right {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #165DFF;
  color: #fff;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.msg-right .msg-avatar {
  background-color: #52c41a;
}

.msg-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
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
  max-width: 200px;
  max-height: 150px;
  border-radius: 12px;
}

.msg-time {
  font-size: 11px;
  color: #bbb;
}

.system-message {
  justify-content: center;
  margin: 8px 0;
}

.system-message span {
  background-color: #e6f7ff;
  color: #165DFF;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.chat-bottom-input {
  padding: 12px;
  border-top: 1px solid #eee;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.input-tool {
  display: flex;
  gap: 15px;
}

.img-upload-btn {
  font-size: 20px;
  cursor: pointer;
}

.chat-bottom-input textarea {
  height: 70px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  resize: none;
  outline: none;
  font-size: 14px;
}

.chat-bottom-input textarea:focus {
  border-color: #165DFF;
}

.send-btn {
  align-self: flex-end;
  padding: 8px 24px;
  background-color: #165DFF;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.emoji-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-radius: 12px 12px 0 0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  text-align: center;
}

.emoji-item:hover {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .service-chat {
    width: 95vw;
    height: 450px;
    bottom: 10px;
    right: 10px;
  }
  
  .msg-content-wrap {
    max-width: 80%;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
