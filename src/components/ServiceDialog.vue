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
          <div v-if="msg.msgType === 'ORDER'" class="msg-order">
            <div class="order-card">
              <div class="order-card-header">
                <span class="order-card-title">订单信息</span>
                <span class="order-card-status" :class="'status-' + msg.content.orderStatus">
                  {{ getOrderStatusText(msg.content.orderStatus) }}
                </span>
              </div>
              <div class="order-card-body">
                <div class="order-card-row">
                  <span class="label">订单号：</span>
                  <span class="value">{{ msg.content.id }}</span>
                </div>
                <div class="order-card-row">
                  <span class="label">下单时间：</span>
                  <span class="value">{{ msg.content.orderTime }}</span>
                </div>
                <div class="order-card-row">
                  <span class="label">订单金额：</span>
                  <span class="value price">¥{{ msg.content.actualPay.toFixed(2) }}</span>
                </div>
                <div class="order-card-row">
                  <span class="label">收货人：</span>
                  <span class="value">{{ msg.content.consigneeName }}</span>
                </div>
                <div class="order-card-row">
                  <span class="label">联系电话：</span>
                  <span class="value">{{ maskPhone(msg.content.phone) }}</span>
                </div>
              </div>
            </div>
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
    
    <div class="chat-bottom">
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
          <span class="img-upload-btn" @click="showOrderDialog = true">📦</span>
        </div>
        <textarea 
          v-model="inputMessage" 
          placeholder="请输入消息..." 
          @keyup.enter.prevent="sendMessage"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim()">发送</button>
      </div>
    </div>
    
    <!-- 订单选择侧边面板 -->
    <div class="order-panel-mask" v-show="showOrderDialog" @click="showOrderDialog = false">
      <div class="order-panel" @click.stop>
        <div class="order-panel-header">
          <span class="panel-title">订单问题</span>
          <el-icon class="close-icon" @click="showOrderDialog = false"><Close /></el-icon>
        </div>
        <div class="order-panel-tip">
          <span class="tip-icon">🐵</span>
          <div class="tip-content">
            <div class="tip-title">带着订单咨询，问题解决快人一步</div>
            <div class="tip-desc">预计可为您节省 30秒 咨询时间</div>
          </div>
        </div>
        <div class="order-panel-list" v-loading="orderLoading">
          <div 
            v-for="order in filteredOrders" 
            :key="order.id"
            class="order-panel-item"
          >
            <div class="order-panel-item-header">
              <span class="order-id">订单号：{{ order.id.slice(-6) }}</span>
              <span class="order-status" :class="'status-' + order.orderStatus">
                {{ getOrderStatusText(order.orderStatus) }}
              </span>
            </div>
            <div class="order-panel-item-body">
              <div class="order-panel-row">
                <span class="time">{{ order.orderTime }}</span>
                <span class="divider">|</span>
                <span class="price">¥{{ order.actualPay.toFixed(2) }}</span>
              </div>
              <div class="order-panel-row">
                <span>收货人：{{ order.consigneeName }} {{ maskPhone(order.phone) }}</span>
              </div>
            </div>
            <div class="order-panel-item-footer">
              <button class="send-order-btn" @click="sendOrderDirectly(order)">发送</button>
            </div>
          </div>
          <div v-if="filteredOrders.length === 0 && !orderLoading" class="empty-order">
            暂无可发送的订单
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onUnmounted, computed } from 'vue';
import { Close, ChatRound, Search } from '@element-plus/icons-vue';
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
  '😀', '😃', '', '😁', '', '😅', '', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '', '😙', '', '😋', '', '😝', '',
  '🤪', '🤨', '', '🤓', '😎', '🤩', '🥳', ''
];

// 客服ID
const ADMIN_ID = 2;

// 订单相关
const showOrderDialog = ref(false);
const orderLoading = ref(false);
const orders = ref([]);
const selectedOrderId = ref(null);

// 过滤订单：只展示状态为 1、2、3、4 的订单
const filteredOrders = computed(() => {
  return orders.value.filter(order => [1, 2, 3, 4].includes(order.orderStatus));
});

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const statusMap = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '已收货',
    5: '售后中',
    6: '已取消'
  };
  return statusMap[status] || '未知';
};

// 手机号脱敏
const maskPhone = (phone) => {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
};

// 获取订单列表
const fetchOrders = async () => {
  const token = getToken();
  if (!token) {
    ElMessage.error('请先登录');
    return;
  }
  
  orderLoading.value = true;
  try {
    const response = await fetch('http://localhost:8080/user/order/historyOrders', {
      method: 'GET',
      headers: {
        'token': token,
        'authentication': token,
        'Authorization': token
      }
    });
    
    const result = await response.json();
    
    if (result.code === 1) {
      orders.value = result.data || [];
    } else {
      ElMessage.error(result.msg || '获取订单列表失败');
    }
  } catch (error) {
    console.error('获取订单列表失败', error);
    ElMessage.error('获取订单列表失败');
  } finally {
    orderLoading.value = false;
  }
};

// 发送订单消息
const sendOrder = () => {
  if (!selectedOrderId.value) {
    ElMessage.warning('请选择一个订单');
    return;
  }
  
  const selectedOrder = orders.value.find(order => order.id === selectedOrderId.value);
  if (!selectedOrder) {
    ElMessage.error('订单不存在');
    return;
  }
  
  sendOrderDirectly(selectedOrder);
};

// 直接发送订单（点击发送按钮）
const sendOrderDirectly = (order) => {
  // 本地显示订单消息
  messages.value.push({
    id: Date.now(),
    content: order,
    time: new Date().toLocaleTimeString(),
    senderType: 'USER',
    msgType: 'ORDER'
  });
  scrollToBottom();
  
  // 通过WebSocket发送订单消息
  const sendMsgData = {
    receiverId: ADMIN_ID,
    msgType: 'ORDER',
    content: JSON.stringify(order)
  };
  
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(sendMsgData)
    });
    console.log('✅ 订单消息已发送', order);
  } else {
    console.error('WebSocket 未连接');
    ElMessage.warning('连接已断开，订单已本地显示');
  }
  
  showOrderDialog.value = false;
  selectedOrderId.value = null;
};

// 监听订单弹窗打开，加载订单列表
watch(showOrderDialog, (newVal) => {
  if (newVal) {
    fetchOrders();
  }
});

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

.chat-bottom {
  position: relative;
}

.emoji-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.emoji-item {
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  text-align: center;
}

.emoji-item:hover {
  background-color: #f0f0f0;
}

/* 订单侧边面板样式 */
.order-panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-panel {
  width: 380px;
  max-height: 500px;
  background-color: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.order-panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #165DFF;
}

.order-panel .close-icon {
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.order-panel .close-icon:hover {
  color: #333;
}

.order-panel-tip {
  padding: 12px 20px;
  background-color: #e6f7ff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tip-icon {
  font-size: 24px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 13px;
  color: #165DFF;
  font-weight: 500;
}

.tip-desc {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.order-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.order-panel-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: border-color 0.2s;
}

.order-panel-item:hover {
  border-color: #165DFF;
}

.order-panel-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-id {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.order-panel-item-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.order-panel-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.order-panel-row .time {
  color: #999;
}

.order-panel-row .divider {
  margin: 0 8px;
  color: #ddd;
}

.order-panel-row .price {
  color: #ff4d4f;
  font-weight: 600;
}

.order-panel-item-footer {
  display: flex;
  justify-content: flex-end;
}

.send-order-btn {
  padding: 6px 20px;
  background-color: #165DFF;
  color: #fff;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.send-order-btn:hover {
  background-color: #4080ff;
}

.empty-order {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* 订单消息卡片样式 */
.msg-order {
  max-width: 280px;
}

.order-card {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.order-card-header {
  padding: 10px 12px;
  background-color: #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.order-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.order-card-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.order-card-status.status-1 {
  background-color: #fff7e6;
  color: #fa8c16;
}

.order-card-status.status-2 {
  background-color: #e6f7ff;
  color: #1890ff;
}

.order-card-status.status-3 {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-card-status.status-4 {
  background-color: #f0f0f0;
  color: #666;
}

.order-card-body {
  padding: 12px;
}

.order-card-row {
  display: flex;
  font-size: 12px;
  margin-bottom: 6px;
}

.order-card-row:last-child {
  margin-bottom: 0;
}

.order-card-row .label {
  color: #999;
  min-width: 70px;
}

.order-card-row .value {
  color: #333;
}

.order-card-row .price {
  color: #ff4d4f;
  font-weight: 600;
}

/* 订单状态样式 */
.order-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.order-status.status-1 {
  background-color: #fff7e6;
  color: #fa8c16;
}

.order-status.status-2 {
  background-color: #e6f7ff;
  color: #1890ff;
}

.order-status.status-3 {
  background-color: #f6ffed;
  color: #52c41a;
}

.order-status.status-4 {
  background-color: #f0f0f0;
  color: #666;
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
