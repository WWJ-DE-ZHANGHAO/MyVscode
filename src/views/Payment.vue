<template>
  <div class="checkout-container">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <div class="info-item">
        <span class="label">支付金额：</span>
        <span class="amount">¥{{ amount }}</span>
      </div>
      <div class="info-item">
        <span class="label">订单号：</span>
        <span class="order-id">{{ orderId }}</span>
      </div>
    </div>

    <!-- 支付主体内容 -->
    <div class="main-content">
      <div class="payment-section">
        <h3 class="section-title">选择支付方式</h3>

        <!-- 支付方式列表 -->
        <div class="payment-list">
          <!-- 支付宝 -->
          <div
            class="payment-item"
            :class="{ active: paymentMethod === 'alipay' }"
            @click="paymentMethod = 'alipay'"
          >
            <div class="radio-circle">
              <div class="inner-dot" v-if="paymentMethod === 'alipay'"></div>
            </div>
            <img src="/images/zhifubao.png" alt="支付宝" class="logo" />
            <el-tag size="small" type="danger" class="recommend-tag">推荐</el-tag>
          </div>

          <!-- 微信支付 -->
          <div
            class="payment-item"
            :class="{ active: paymentMethod === 'wechat' }"
            @click="paymentMethod = 'wechat'"
          >
            <div class="radio-circle">
              <div class="inner-dot" v-if="paymentMethod === 'wechat'"></div>
            </div>
            <img src="/images/weixin.png" alt="微信支付" class="logo" />
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-action">
        <el-button type="danger" size="large" class="pay-btn" @click="handlePay">
          立即支付
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 接收路由参数或从 sessionStorage 回退（支持 query.orderId 或 query.Id）
const orderId = ref(route.query.orderId || route.query.Id || sessionStorage.getItem('lastOrderId') || null)
const amount = ref(route.query.amount || sessionStorage.getItem('lastOrderAmount') || null)

// 选中的支付方式
const paymentMethod = ref('alipay')

// 真实支付处理：调用后端支付接口
const pad = (n) => String(n).padStart(2, '0')
const makeLocalDateTime = (d) => {
  const Y = d.getFullYear()
  const M = pad(d.getMonth() + 1)
  const D = pad(d.getDate())
  const h = pad(d.getHours())
  const m = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

const handlePay = async () => {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }

  try {
    await ElMessageBox.confirm(
      `即将使用【${paymentMethod.value === 'alipay' ? '支付宝' : '微信支付'}】支付 ${amount.value} 元，是否继续？`,
      '支付确认',
      { confirmButtonText: '确认支付', cancelButtonText: '再想想', type: 'warning' }
    )

    const idStr = orderId.value ? String(orderId.value) : ''
    if (!idStr) {
      ElMessage.error('无法获取订单号（请返回订单列表或重试下单）')
      return
    }

    const paymentMethodCode = paymentMethod.value === 'wechat' ? 1 : 2 // 1=微信,2=支付宝
    const payload = {
      id: idStr,
      checkoutTime: makeLocalDateTime(new Date()),
      paymentMethod: paymentMethodCode,
    }

    console.log('pay payload:', payload)
    await request.put('/user/order/payment', payload)
    ElMessage.success('支付成功')
    router.push({ name: 'PaymentSuccess', query: { orderId: orderId.value } })
  } catch (e) {
    if (e === false) { // 用户取消
      ElMessage.info('已取消支付')
      return
    }
    console.error('支付失败', e)
    try { console.warn('error response data:', e.response && e.response.data ? e.response.data : null) } catch (ee) {}
    ElMessage.error('支付失败，请稍后重试')
  }
}

onMounted(() => {
  const sessionId = sessionStorage.getItem('lastOrderId')
  const sessionAmt = sessionStorage.getItem('lastOrderAmount')
  console.log('Payment mounted, route.query:', route.query, 'session lastOrderId:', sessionId, 'session lastOrderAmount:', sessionAmt)
  // 优先使用路由上的 orderId/Id，否则使用 sessionStorage 的值
  if (!route.query.orderId && !route.query.Id && sessionId) {
    orderId.value = sessionId
  }
  if (!route.query.amount && sessionAmt) {
    amount.value = sessionAmt
  }
})
</script>

<style scoped>
.checkout-container {
  max-width: 800px;
  margin: 20px auto;
  background: #fff;
  border: 1px solid #e5e5e5;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 顶部信息栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
}

.info-item {
  font-size: 16px;
  color: #333;
}

.label {
  color: #666;
  margin-right: 8px;
}

.amount {
  color: #ff2200;
  font-size: 20px;
  font-weight: bold;
}

.order-id {
  color: #0066cc; /* 模仿截图中的蓝色链接 */
  cursor: pointer;
}

/* 主体内容 */
.main-content {
  padding: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: normal;
  color: #333;
  margin-bottom: 20px;
  border-left: 4px solid #ff2200;
  padding-left: 10px;
}

/* 支付列表 */
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.payment-item:hover {
  border-color: #ff2200;
  background-color: #fff9f9;
}

.payment-item.active {
  border-color: #ff2200;
  background-color: #fff9f9;
  box-shadow: 0 0 8px rgba(255, 34, 0, 0.1);
}

/* 自定义单选圆点 */
.radio-circle {
  width: 18px;
  height: 18px;
  border: 1px solid #999;
  border-radius: 50%;
  margin-right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.payment-item.active .radio-circle {
  border-color: #ff2200;
}

.inner-dot {
  width: 10px;
  height: 10px;
  background-color: #ff2200;
  border-radius: 50%;
}

/* Logo 和 文字 */
.logo {
  width: 140px;
  height: 40px;
  margin-right: 18px;
  object-fit: contain;
}

.method-name {
  display: none; /* 文本移除，保留类以防其它样式依赖 */
}

.recommend-tag {
  margin-left: auto; /* 推到最右边 */
}

/* 底部按钮 */
.bottom-action {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.pay-btn {
  width: 160px;
  height: 45px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 4px;
  background-color: #ff2200;
  border-color: #ff2200;
}

.pay-btn:hover {
  background-color: #ff4422;
  border-color: #ff4422;
}
</style>