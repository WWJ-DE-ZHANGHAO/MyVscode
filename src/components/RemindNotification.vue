<template>
  <!-- 全局悬浮角标 -->
  <div class="remind-badge" @click="showDrawer = true">
    <el-badge :value="remindMsgList.length" :hidden="remindMsgList.length === 0" class="badge">
      <el-icon :size="24"><Bell /></el-icon>
    </el-badge>
  </div>

  <!-- 消息抽屉弹窗 -->
  <el-drawer
    v-model="showDrawer"
    title="催发货通知"
    size="400px"
    :close-on-click-modal="true"
  >
    <div class="remind-header">
      <h3>催发货通知</h3>
      <el-button type="text" @click="clearAll" :disabled="remindMsgList.length === 0">
        全部已读
      </el-button>
    </div>
    <div class="remind-list">
      <div v-for="msg in remindMsgList" :key="msg.orderId" class="remind-item">
        <div class="item-header">
          <span class="order-id">订单号：{{ msg.orderId }}</span>
          <span class="time">{{ formatTime(msg.createTime) }}</span>
        </div>
        <div class="item-content">
          <span class="user">{{ msg.userName || '用户' }} 请求催发货</span>
          <el-button type="primary" size="small" @click="handleProcess(msg)">
            去处理
          </el-button>
        </div>
      </div>
      <el-empty v-if="remindMsgList.length === 0" description="暂无催单通知" />
    </div>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { onMounted, onUnmounted } from 'vue'
import { connectWebSocket, disconnect, remindMsgList } from '@/hooks/useWebSocket'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const showDrawer = ref(false)

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

// 去处理：跳转到订单详情页
const handleProcess = (msg) => {
  router.push(`/order?orderId=${msg.orderId}`)
  showDrawer.value = false
}

// 全部已读
const clearAll = async () => {
  try {
    // 暂时清空本地消息列表，实际项目中需要调用后端接口
    remindMsgList.value = []
    ElMessage.success('已标记全部为已读')
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('标记失败')
  }
}

// 全局挂载WebSocket
onMounted(() => {
  // 只有在非客服中心页面才自动连接WebSocket
  const currentRoute = router.currentRoute.value
  if (currentRoute.path !== '/customer-service') {
    try {
      connectWebSocket()
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      // 连接失败不影响页面渲染
    }
  } else {
    console.log('客服中心页面，跳过WebSocket连接')
  }
})

onUnmounted(() => {
  try {
    disconnect()
  } catch (error) {
    console.error('WebSocket断开失败:', error)
  }
})
</script>

<style scoped>
.remind-badge {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  cursor: pointer;
  background: #fff;
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.remind-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.remind-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.remind-list {
  padding: 0 16px;
  max-height: 400px;
  overflow-y: auto;
}

.remind-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-id {
  font-weight: bold;
}

.time {
  color: #909399;
  font-size: 12px;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user {
  color: #606266;
}
</style>