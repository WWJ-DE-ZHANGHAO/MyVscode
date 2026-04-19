// 全局对象兼容处理
if (typeof window !== 'undefined' && !window.global) {
  window.global = window
}

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const stompClient = ref(null)
const remindMsgList = ref([])
let isConnected = false

// 连接
export function connectWebSocket() {
  // 如果已经连接，不再重复连接
  if (isConnected && stompClient.value && stompClient.value.connected) {
    console.log('WebSocket 已连接，跳过重复连接')
    return
  }
  
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('ADMIN_TOKEN')
    
    // 如果没有token，不建立连接
    if (!token) {
      console.log('未找到token，跳过WebSocket连接')
      return
    }
    
    stompClient.value = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        token: token
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      onConnect: (frame) => {
        console.log('WebSocket 连接成功', frame)
        isConnected = true

        // 订阅催发货消息
        stompClient.value.subscribe('/topic/admin/order/remind', (res) => {
          try {
            const msg = JSON.parse(res.body)
            remindMsgList.value.unshift(msg)
            
            // 1. Element Plus 全局弹窗提示
            ElMessage({
              message: `新催单：订单${msg.orderId}`,
              type: 'warning',
              duration: 5000,
              showClose: true
            })
            
            // 2. 浏览器通知（需用户授权）
            if (Notification.permission === 'granted') {
              new Notification('催发货通知', {
                body: `订单${msg.orderId} 用户请求催发货`,
                icon: '/Favicon.png'
              })
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission()
            }
            
            // 3. 声音提醒
            try {
              const audio = new Audio('/remind.mp3') // 项目public下放提示音
              audio.play()
            } catch (error) {
              console.log('播放提示音失败:', error)
            }
          } catch (error) {
            console.error('处理WebSocket消息失败:', error)
          }
        })

        // 上线拉取 Redis 未读消息
        loadUnreadRemind()
      },
      onStompError: (error) => {
        console.error('WebSocket连接失败:', error)
        isConnected = false
        // 连接失败不影响页面渲染
      },
      onDisconnect: () => {
        console.log('WebSocket 连接已断开')
        isConnected = false
      }
    })
    
    stompClient.value.activate()
  } catch (error) {
    console.error('WebSocket初始化失败:', error)
    // 初始化失败不影响页面渲染
  }
}

// 拉取未读
async function loadUnreadRemind() {
  try {
    const token = sessionStorage.getItem('token')
    const res = await fetch('/admin/order/getUnreadMessage', {
      headers: {
        'token': token || ''
      }
    })
    const data = await res.json()
    if (data.code === 1 && data.data) {
      remindMsgList.value.unshift(...data.data)
    }
  } catch (error) {
    console.error('拉取未读消息失败:', error)
  }
}

// 断开
export function disconnect() {
  if (stompClient.value) {
    stompClient.value.deactivate()
    isConnected = false
  }
}

export { remindMsgList }