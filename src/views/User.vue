<template>
  <div class="user-page-wrapper">
    <div class="user-center-page">
      <div class="container">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="user-card">
            <div class="avatar-wrap">
              <el-avatar :size="100" :src="userInfoRef.avatar" v-if="userInfoRef.avatar" />
              <div class="profile-avatar" v-else>{{ avatarText }}</div>
            </div>
            <div class="user-info">
              <h3 class="username">{{ userInfoRef.username || '用户' }}</h3>
              <p class="level" v-if="userInfoRef.level">
                <el-tag type="warning">{{ levelName }}</el-tag>
                积分：{{ userInfoRef.points || 0 }}
              </p>
              <el-button size="small" type="primary" plain @click="openEditProfile">修改资料</el-button>
            </div>
          </div>

          <!-- 侧边栏菜单（图标已缩小） -->
          <div class="sidebar-menu">
            <div 
              v-for="m in sidebarMenus" 
              :key="m.name" 
              :class="['menu-item', { active: activeMainTab === m.name }]" 
              @click="selectMainTab(m.name)"
            >
              <!-- 图标缩小到 80x80 -->
              <component :is="m.icon" style="width:80px; height:80px; font-size:80px; margin-right: 8px; display:flex; align-items:center; justify-content:center;" />
              <span>{{ m.label }}</span>
            </div>
          </div>

          <!-- 弹窗组件（位置正确，确保能弹出） -->
          <EditProfileDialog v-model="showEditProfile" :user="userInfoRef" @saved="onProfileSaved" />
          <AddressDialog v-model="showAddressModal" :address="editingAddress" @saved="onDialogSaved" />
        </aside>

        <section class="content">
          <!-- 我的订单 -->
          <div v-show="activeMainTab === 'orders'" class="tab-content">
            <h2 class="title">我的订单</h2>
            <div class="order-filters">
              <div v-for="s in orderStatuses" :key="s.code" :class="['status-tab', { active: selectedOrderStatus === s.code }]" @click="selectOrderStatus(s.code)">
                <span>{{ s.label }}</span>
                <small v-if="orderCounts[s.code] && orderCounts[s.code] > 0">({{ orderCounts[s.code] }})</small>
              </div>
            </div>

            <!-- 二级筛选：已收货（评价） / 售后 -->
            <div v-if="Number(selectedOrderStatus) === 4" class="order-filters" style="margin-bottom:12px">
              <div :class="['status-tab', { active: secondaryCommentFilter === 0 }]" @click="selectSecondaryCommentFilter(0)">全部 <small v-if="commentCounts[0]">({{ commentCounts[0] }})</small></div>
              <div :class="['status-tab', { active: secondaryCommentFilter === 1 }]" @click="selectSecondaryCommentFilter(1)">未评价 <small v-if="commentCounts[1]">({{ commentCounts[1] }})</small></div>
              <div :class="['status-tab', { active: secondaryCommentFilter === 2 }]" @click="selectSecondaryCommentFilter(2)">已评价 <small v-if="commentCounts[2]">({{ commentCounts[2] }})</small></div>
            </div>

            <div v-if="Number(selectedOrderStatus) === 5" class="order-filters" style="margin-bottom:12px">
              <div :class="['status-tab', { active: secondaryRefundFilter === 0 }]" @click="selectSecondaryRefundFilter(0)">全部 <small v-if="refundCounts[0]">({{ refundCounts[0] }})</small></div>
              <div :class="['status-tab', { active: secondaryRefundFilter === 1 }]" @click="selectSecondaryRefundFilter(1)">售后中 <small v-if="refundCounts[1]">({{ refundCounts[1] }})</small></div>
              <div :class="['status-tab', { active: secondaryRefundFilter === 2 }]" @click="selectSecondaryRefundFilter(2)">已完结 <small v-if="refundCounts[2]">({{ refundCounts[2] }})</small></div>
            </div>

            <div v-if="loadingOrders">
              <el-skeleton :rows="3" animated />
            </div>

            <div v-else>
              <template v-if="!viewingOrderId">
                <div v-if="filteredOrders.length > 0">
                <div v-for="o in filteredOrders" :key="o.id" class="order-card mb-12 new-order-card">
                  <!-- Header：时间 | 订单号 | 状态 -->
                  <div class="order-card-header">
                    <div class="header-left">{{ fmtDate(o.orderTime) }}</div>
                    <div class="header-center">订单号: {{ o.id }}</div>
                    <div class="header-right">
                      <el-tag type="info" effect="plain">{{ getOrderStatusLabel(o) }}</el-tag>
                    </div>
                  </div>

                  <!-- 可选商品摘要（若有） -->
                  <div class="order-card-body">
                    <div v-if="(o.orderItems || o.items || o.itemsVo || o.books) && (o.orderItems || o.items || o.itemsVo || o.books).length" class="body-item">
                      <img class="body-thumb" :src="((o.orderItems||o.items||o.itemsVo||o.books)[0].coverUrl || (o.orderItems||o.items||o.itemsVo||o.books)[0].cover || '/images/new.png')" alt="" />
                      <div class="body-info">
                        <div class="body-title">{{ (o.orderItems||o.items||o.itemsVo||o.books)[0].title || (o.orderItems||o.items||o.itemsVo||o.books)[0].bookName || '-' }}</div>
                        <div class="body-meta">数量: {{ (o.orderItems||o.items||o.itemsVo||o.books)[0].quantity || (o.orderItems||o.items||o.itemsVo||o.books)[0].number || 1 }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer：价格区（左）& 操作区（右） -->
                  <div class="order-card-footer">
                    <div class="price-info">
                      <div style="text-align:left">
                        <div class="paid-amount">¥{{ getPaidAmount(o).toFixed(2) }}</div>
                        <div class="freight-line" style="font-size:12px; color:#666; margin-top:4px">含运费: ¥{{ getFreight(o).toFixed(2) }}</div>
                      </div>
                      <div class="orig-amount">¥{{ getOriginalTotal(o).toFixed(2) }}</div>
                    </div>
                    <div class="ops">
                      <el-button link size="small" @click.stop="viewOrderDetails(o.id)">查看详情</el-button>
                      <el-button link size="small" @click.stop="reorder(o)">再来一单</el-button>
                      <el-button v-if="Number(o.orderStatus) === 1" type="primary" size="small" @click.stop="goPay(o)">去支付</el-button>
                      <el-button v-if="Number(o.orderStatus) === 2" type="warning" size="small" @click.stop="remindShipment(o)">催发货</el-button>
                      <!-- 取消 / 申请售后 按钮逻辑 -->
                      <!-- 未付款：可直接取消 -->
                      <el-button v-if="Number(o.orderStatus) === 1" type="danger" size="small" @click.stop="cancelOrderNow(o)">取消订单</el-button>
                      <!-- 已付款但未发货(2) 或 待收货(3)，且无售后(refundStatus==0)：用户可申请取消（需管理员同意） -->
                      <el-button v-if="(Number(o.orderStatus) === 2 || Number(o.orderStatus) === 3) && Number(o.refundStatus || 0) === 0" type="warning" size="small" @click.stop="applyCancel(o)">申请取消</el-button>
                      <!-- 已收货：可申请售后（仅申请售后，不能取消） -->
                      <el-button v-if="Number(o.orderStatus) === 4 && Number(o.refundStatus || 0) === 0" type="warning" size="small" @click.stop="applyAfterSale(o)">申请售后</el-button>
                      <el-button v-if="Number(o.orderStatus) === 3" type="success" size="small" @click.stop="confirmReceive(o)">确认收货</el-button>
                    </div>
                  </div>
                </div>
              </div>
                <el-empty v-else description="暂无订单" />
              </template>
            </div>

            <!-- 订单详情替换列表显示 -->
            <div v-if="viewingOrderId" class="order-detail-view">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                <div class="breadcrumb">
                  <span class="crumb link" @click="backToOrders">我的订单</span>
                  <span class="sep"> &gt; </span>
                  <span class="crumb">订单详情</span>
                </div>
                <el-button link @click="backToOrders">返回我的订单</el-button>
              </div>
              <div v-if="loadingOrderDetails">
                <el-skeleton :rows="4" animated />
              </div>
              <div v-else>
                <div v-if="orderDetails.length > 0">
                  <div v-for="it in orderDetails" :key="it.id || it.productId || it.bookId" class="order-card mb-8" style="padding:12px; display:flex; align-items:flex-start; justify-content:space-between">
                    <div style="display:flex; gap:12px; align-items:center; flex:1">
                      <img :src="it.productImage || it.coverUrl || it.cover || it.bookImage || '/images/new.png'" style="width:80px; height:80px; object-fit:cover; border-radius:6px" />
                      <div style="flex:1">
                        <div style="font-weight:600">{{ it.productName || it.bookName || it.title || '-' }}</div>
                        <div style="color:#666; margin:6px 0">{{ it.productDescription || it.description || it.bookDesc || '-' }}</div>
                        <div style="color:#333; font-weight:700">¥{{ (Number(it.price || it.unitPrice || it.bookPrice || 0)).toFixed(2) }} × {{ it.quantity || it.number || it.count || 1 }}</div>
                      </div>
                    </div>
                    <div style="margin-left:12px; display:flex; align-items:center">
                      <template v-if="isCurrentOrderUnreviewed">
                        <el-button v-if="Number(it.commentStatus || 0) === 0" type="primary" size="small" @click.stop="goToComment(it)">去评价</el-button>
                        <el-tag v-else type="success">已评价</el-tag>
                      </template>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无订单详情" />
              </div>
            </div>
          </div>

          <!-- 收货地址 -->
          <div v-show="activeMainTab === 'addresses'" class="tab-content">
            <h2 class="title">我的收货地址</h2>
            <div v-if="loadingAddresses">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else>
              <div v-if="addresses.length > 0">
                <div class="addr-table">
                  <div class="addr-row header">
                    <div class="col name">收货人</div>
                    <div class="col phone">电话/手机</div>
                    <div class="col address">所在地址</div>
                    <div class="col ops">操作</div>
                  </div>
                  <div v-for="a in addresses" :key="a.id" class="addr-row">
                    <div class="col name">{{ a.receiverName || '-' }}</div>
                    <div class="col phone">{{ a.phone || '-' }}</div>
                    <div class="col address">{{ ((a.provinceName||'') + (a.cityName?(' ' + a.cityName):'') + (a.districtName?(' ' + a.districtName):'') + (a.detailAddress ? (' ' + a.detailAddress) : '')) || '-' }}</div>
                    <div class="col ops">
                      <el-button link size="small" @click.stop="onEditAddress(a)">修改</el-button>
                      <el-button link size="small" @click.stop="onDeleteAddress(a.id)">删除</el-button>
                      <el-button v-if="!a.isDefault || a.isDefault === 0" link size="small" @click.stop="onSetDefault(a.id)">设为默认</el-button>
                      <el-tag v-else type="danger">默认地址</el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无收货地址" />
            </div>
          </div>

          <!-- 会员中心 -->
          <div v-show="activeMainTab === 'member'" class="tab-content">
            <h2 class="title">会员中心</h2>
            <div class="member-card">
              <div class="member-top">
                <div>
                  <div class="points">积分：{{ userInfoRef.points }}</div>
                  <div>等级：{{ levelName }}</div>
                </div>
                <div>
                  <div>等级经验：{{ userInfoRef.member_exp }} / {{ nextLevelExp }}</div>
                  <div class="exp-bar"><el-progress :percentage="expPercent" /></div>
                </div>
              </div>
              <!-- 会员权益（保留你要的可实现功能） -->
              <div class="rights">
                <div class="item">🎫 会员优惠券</div>
                <div class="item">💰 积分抵现</div>
                <div class="item">🚚 免运费特权</div>
              </div>
            </div>
          </div>

          <!-- 优惠券 -->
          <div v-show="activeMainTab === 'coupon'" class="tab-content">
            <h2 class="title">我的优惠券</h2>
            <div class="coupon-list">
              <div v-for="c in userCoupons" :key="c.id" class="coupon-item">
                <div class="left">
                  <div class="price">¥{{ c.reduceAmount }}</div>
                  <div class="rule">满{{ c.minAmount }}可用</div>
                </div>
                <div class="right">
                  <div class="name">{{ c.name }}</div>
                  <div class="time">{{ c.endTime }}</div>
                  <el-button size="small" type="primary">立即使用</el-button>
                </div>
              </div>
              <el-empty v-if="userCoupons.length === 0" description="暂无优惠券" />
            </div>
          </div>

          <!-- 浏览历史 -->
          <div v-show="activeMainTab === 'history'" class="tab-content">
            <div class="history-header">
              <h3>最近浏览</h3>
              <el-button link type="danger" @click="clearHistory">清空历史</el-button>
            </div>
            <div class="history-list">
              <div v-for="item in historyList" :key="item.id" class="history-item">
                <img :src="item.cover" alt="商品" />
                <div class="info">
                  <div class="name">{{ item.productName }}</div>
                  <div class="price">¥{{ item.price }}</div>
                </div>
                <el-button link type="danger" size="small" @click="delHistory(item.id)">删除</el-button>
              </div>
              <el-empty v-if="historyList.length === 0" description="暂无浏览记录" />
            </div>
          </div>
        </section>
      </div>
    </div>
    <!-- 评价弹窗（在订单页内直接评价，不跳转） -->
    <el-dialog v-model="showCommentDialog" title="评价商品" width="640px">
      <div style="display:flex; flex-direction:column; gap:12px">
        <div>
          <div style="margin-bottom:6px">评分：</div>
          <el-rate v-model="commentForm.score" :max="5" :texts="rateTexts" show-text />
        </div>
        <div>
          <div style="margin-bottom:6px">评价内容：</div>
          <el-input type="textarea" v-model="commentForm.content" placeholder="写下你的购买感受（必填）" rows="4" />
        </div>
        <div>
          <div style="margin-bottom:6px">上传图片（最多5张）：</div>
          <el-upload
            action="/user/upload/upload"
            list-type="picture-card"
            :headers="{ Authorization: 'Bearer ' + token, authentication: token }"
            :with-credentials="false"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveImage"
            :limit="5"
            accept="image/*"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <div style="color:#999; font-size:12px; margin-top:6px">请上传清晰的实拍图片，最多 5 张</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitComment">提交评价</el-button>
      </template>
    </el-dialog>

    <!-- 退款申请弹窗 -->
    <el-dialog v-model="showRefundDialog" title="申请退款" width="640px">
      <div style="display:flex; flex-direction:column; gap:16px">
        <!-- 订单信息 -->
        <div class="refund-order-info">
          <div class="info-item">
            <span class="label">订单号：</span>
            <span class="value">{{ refundForm.orderNumber }}</span>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="refund-product-list">
          <div v-for="(item, index) in refundForm.orderDetails" :key="index" class="product-item">
            <div class="product-info">
              <div class="product-name">{{ item.productName || item.bookName || item.title || '-' }}</div>
              <div class="product-meta">
                <span>数量：{{ item.quantity || item.number || item.count || 1 }}</span>
                <span class="product-price">¥{{ (Number(item.price || item.unitPrice || item.bookPrice || 0)).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 金额信息 -->
        <div class="refund-amount-info">
          <div class="amount-item">
            <span class="label">运费：</span>
            <span class="value">¥{{ refundForm.freight.toFixed(2) }}</span>
          </div>
          <div class="amount-item">
            <span class="label">优惠金额：</span>
            <span class="value">¥{{ refundForm.discount.toFixed(2) }}</span>
          </div>
          <div class="amount-item total">
            <span class="label">退款金额：</span>
            <span class="value">¥{{ refundForm.actualPay.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 退款原因 -->
        <div class="refund-reason">
          <div style="margin-bottom:6px">退款原因：</div>
          <el-input type="textarea" v-model="refundForm.reason" placeholder="请输入退款原因" rows="3" />
          <div style="margin-top:8px; display:flex; gap:10px">
            <el-button size="small" @click="refundForm.reason = '不想要了'">不想要了</el-button>
            <el-button size="small" @click="refundForm.reason = '商品质量有问题'">商品质量有问题</el-button>
            <el-button size="small" @click="refundForm.reason = '无理由'">无理由</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRefundDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, markRaw, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EditProfileDialog from '@/components/EditProfileDialog.vue'
import AddressDialog from '@/components/AddressDialog.vue'
import request from '@/utils/request'
import { loadAddressList, deleteAddress as apiDeleteAddress, setDefaultAddress as apiSetDefaultAddress } from '@/composables/useAddress'

const Document = markRaw(Icons.Document)
const Location = markRaw(Icons.Location)
const Medal = markRaw(Icons.Medal)
const Coupon = markRaw(Icons.Coupon || Icons.Document)
const Clock = markRaw(Icons.Clock)

// 用户信息（优先使用登录返回的用户信息）
const userInfoRef = reactive({
  username: '',
  level: 2,
  points: 0,
  member_exp: 0,
  avatar: '',
  phone: '',
  password: '',
  gender: 'male'
})

const loadCurrentUser = () => {
  try {
    const raw = sessionStorage.getItem('currentUser')
    if (raw) {
      const u = JSON.parse(raw)
      if (u) {
        userInfoRef.username = u.username || ''
        userInfoRef.avatar = u.avatar || ''
        userInfoRef.phone = u.phone || ''
        // 后端 gender 为数字 0/1/2
        userInfoRef.gender = u.gender === 1 ? 'male' : (u.gender === 2 ? 'female' : 'male')
      }
    }
  } catch (e) { console.error('parse currentUser failed', e) }
}

// 声明可能从父组件传入的自定义事件，避免 extraneous non-emits 警告
const emit = defineEmits(['addToCart'])

// 上传需要的 token（用于 el-upload headers）
// 使用项目统一的 key：`token`
const token = ref(sessionStorage.getItem('token') || '')

onMounted(async () => {
  // 每次进入或刷新个人中心，主动从后端拉取用户信息与订单列表
  loadCurrentUser()
  try {
    await fetchUserFromServer()
    await fetchOrders()
  } catch (e) {
    console.error('[User] onMounted error:', e)
  }
  window.addEventListener('user-updated', loadCurrentUser)
})

onBeforeUnmount(() => {
  window.removeEventListener('user-updated', loadCurrentUser)
})

const avatarText = computed(() => (userInfoRef.username ? userInfoRef.username.charAt(0) : '用'))

// 编辑资料弹窗（逻辑修复，确保能弹出）
const showEditProfile = ref(false)
const fetchUserFromServer = async () => {
  try {
    const res = await request.get('/user/user/get')
    // 期望返回 user 对象或封装的 data
    const u = res && res.id ? res : (res && res.data ? res.data : null)
    if (u) {
      userInfoRef.username = u.username || ''
      userInfoRef.avatar = u.avatar || ''
      userInfoRef.phone = u.phone || ''
      userInfoRef.gender = u.gender === 1 ? 'male' : (u.gender === 2 ? 'female' : 'male')
      // 更新 sessionStorage 以便其他页面使用
      try { sessionStorage.setItem('currentUser', JSON.stringify({ username: userInfoRef.username, avatar: userInfoRef.avatar, phone: userInfoRef.phone, gender: u.gender })) } catch (e) {}
    }
    return u
  } catch (e) {
    console.error('fetchUserFromServer failed', e)
    return null
  }
}

const openEditProfile = async () => { 
  console.log('[User] openEditProfile -> fetching user from server')
  await fetchUserFromServer()
  showEditProfile.value = true
}
const onProfileSaved = async (payload) => {
  try {
    // 先尝试从后端重新拉取最新的用户信息并回显
    const u = await fetchUserFromServer()
    if (u) {
      // fetchUserFromServer 已经更新了 userInfoRef 与 sessionStorage
      window.dispatchEvent(new Event('user-updated'))
      ElMessage.success('资料已更新')
      return
    }

    // 若未能从后端拉取，则回退为使用前端传回的 payload 更新缓存
    Object.assign(userInfoRef, payload)
    const save = {
      username: userInfoRef.username,
      avatar: userInfoRef.avatar,
      phone: userInfoRef.phone || payload.phone || '',
      gender: (payload && payload.gender) ? payload.gender : (userInfoRef.gender === 'male' ? 1 : 2)
    }
    sessionStorage.setItem('currentUser', JSON.stringify(save))
    window.dispatchEvent(new Event('user-updated'))
    ElMessage.success('资料已保存（本地）')
  } catch (e) {
    console.error('onProfileSaved failed', e)
    ElMessage.error('保存后更新用户信息失败')
  }
}

// 侧边栏菜单
const sidebarMenus = ref([
  { name: 'orders', label: '我的订单', icon: Document },
  { name: 'addresses', label: '收货地址', icon: Location },
  { name: 'member', label: '会员中心', icon: Medal },
  { name: 'coupon', label: '我的优惠券', icon: Coupon },
  { name: 'history', label: '浏览历史', icon: Clock },
])

const activeMainTab = ref('orders')

// 订单与地址数据
const orders = ref([])
const loadingOrders = ref(false)
const addresses = ref([])
const loadingAddresses = ref(false)

const fetchOrders = async () => {
  loadingOrders.value = true
  try {
    const res = await request.get('/user/order/historyOrders')
    console.log('[User] fetchOrders response ->', res)
    orders.value = Array.isArray(res) ? res : (res || [])
  } catch (e) { console.error('fetchOrders failed', e); orders.value = [] }
  finally { loadingOrders.value = false }
}

const orderStatusMap = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '已收货',
  5: '售后',
  6: '已取消'
}

const fmtDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    if (isNaN(dt)) return d
    return dt.toLocaleString()
  } catch (e) { return d }
}

// 订单状态筛选与操作
const router = useRouter()
const orderStatuses = [
  { code: 0, label: '全部' },
  { code: 1, label: '待付款' },
  { code: 2, label: '待发货' },
  { code: 3, label: '待收货' },
  { code: 4, label: '已收货' },
  { code: 5, label: '售后' },
  { code: 6, label: '已取消' },
]
const selectedOrderStatus = ref(0)
// 二级筛选：售后与评价
const secondaryRefundFilter = ref(0) // 0 全部, 1 售后中 (refundStatus=1), 2 已完结 (refundStatus=2)
const secondaryCommentFilter = ref(0) // 0 全部, 1 未评价 (commentStatus=1), 2 已评价 (commentStatus=2)

const filteredOrders = computed(() => {
  if (selectedOrderStatus.value === 0) return orders.value
  const s = Number(selectedOrderStatus.value)
  if (s === 5) {
    // 售后主筛选
    if (secondaryRefundFilter.value === 0) return orders.value.filter(o => Number(o.orderStatus) === 5)
    return orders.value.filter(o => Number(o.orderStatus) === 5 && Number(o.refundStatus) === Number(secondaryRefundFilter.value))
  }
  if (s === 4) {
    // 已收货（评价）主筛选
    if (secondaryCommentFilter.value === 0) return orders.value.filter(o => Number(o.orderStatus) === 4)
    return orders.value.filter(o => Number(o.orderStatus) === 4 && Number(o.commentStatus) === Number(secondaryCommentFilter.value))
  }
  return orders.value.filter(o => Number(o.orderStatus) === s)
})

const orderCounts = computed(() => {
  const counts = { 0: orders.value.length }
  orderStatuses.forEach(s => { if (s.code !== 0) counts[s.code] = 0 })
  orders.value.forEach(o => {
    const k = Number(o.orderStatus)
    if (counts[k] === undefined) counts[k] = 0
    counts[k]++
  })
  return counts
})

const refundCounts = computed(() => {
  const c = { 0: 0, 1: 0, 2: 0 }
  orders.value.forEach(o => { if (Number(o.orderStatus) === 5) { const r = Number(o.refundStatus || 0); c[0]++; if (r === 1) c[1]++; if (r === 2) c[2]++ } })
  return c
})

const commentCounts = computed(() => {
  const c = { 0: 0, 1: 0, 2: 0 }
  orders.value.forEach(o => { if (Number(o.orderStatus) === 4) { const cm = Number(o.commentStatus || 0); c[0]++; if (cm === 1) c[1]++; if (cm === 2) c[2]++ } })
  return c
})

const getOrderStatusLabel = (o) => {
  const s = Number(o.orderStatus)
  if (s === 5) {
    const r = Number(o.refundStatus || 0)
    if (r === 1) return '售后中'
    if (r === 2) return '已完结'
    return orderStatusMap[5]
  }
  if (s === 4) {
    const cm = Number(o.commentStatus || 0)
    if (cm === 1) return '未评价'
    if (cm === 2) return '已评价'
    return orderStatusMap[4]
  }
  return orderStatusMap[s] || '-'
}

const computeProductTotal = (o) => {
  try {
    const items = o.orderItems || o.items || o.itemsVo || o.books || []
    if (Array.isArray(items) && items.length) {
      return items.reduce((s, it) => s + (Number(it.price || it.unitPrice || it.bookPrice || 0) * Number(it.quantity || it.number || it.count || 1)), 0)
    }
    const price = Number(o.price || o.productPrice || 0)
    const qty = Number(o.quantity || o.number || 1)
    return price * qty
  } catch (e) { return 0 }
}

const getPaidAmount = (o) => {
  try {
    const v = (o.actualPay != null) ? o.actualPay : (o.amount != null ? o.amount : (o.payAmount != null ? o.payAmount : 0))
    return Number(v) || 0
  } catch (e) { return 0 }
}

const getOriginalTotal = (o) => {
  try {
    const v = (o.originalTotal != null) ? o.originalTotal : computeProductTotal(o)
    return Number(v) || 0
  } catch (e) { return 0 }
}

const getFreight = (o) => {
  try {
    const v = (o.freight != null) ? o.freight : (o.shippingFee != null ? o.shippingFee : 0)
    return Number(v) || 0
  } catch (e) { return 0 }
}

const viewProduct = (item) => {
  const pid = item.productId || item.bookId || item.id
  if (pid) router.push({ name: 'BookDetail', params: { id: pid } })
}

const addOrderItemToCart = async (item) => {
  try {
    const productId = item.productId || item.bookId || item.id
    const number = Number(item.quantity || item.number || item.count || 1)
    if (!productId) {
      ElMessage.warning('商品ID缺失，无法加入购物车')
      return
    }
    await request.post('/user/shopping-cart/save', { productId, number })
    ElMessage.success('已加入购物车')
  } catch (e) {
    console.error('addOrderItemToCart failed', e)
    ElMessage.error('加入购物车失败')
  }
}

const reorder = async (order) => {
  try {
    const orderId = order.id || order.orderId || order.Id
    if (!orderId) {
      ElMessage.error('订单号缺失，无法再来一单')
      return
    }
    try {
      await request.post(`/user/order/repetition/${orderId}`)
      ElMessage.success('已将订单商品加入购物车')
    } catch (e) {
      console.warn('reorder API 调用失败，回退为本地提示', e)
      ElMessage.info('已将订单商品加入购物车（界面模拟）')
    }
  } catch (e) {
    console.error('reorder failed', e)
    ElMessage.error('再来一单失败')
  }
}

const goPay = (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id;
    const amount = getPaidAmount(o) || computeProductTotal(o) - (o.activityDiscount || o.discount || 0) + (o.freight || 0);
    if (!orderId) {
      ElMessage.error('订单号缺失，无法支付');
      return;
    }
    // 跳转到 Payment 页面，保持与 Checkout 发起支付时一致的 query
    router.push({ name: 'Payment', query: { orderId: String(orderId), amount: String(Number(amount).toFixed(2)) } });
  } catch (e) {
    console.error('goPay failed', e);
    ElMessage.error('无法跳转支付页面');
  }
}

const remindShipment = async (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id;
    if (!orderId) {
      ElMessage.error('订单号缺失，无法催单');
      return;
    }
    // 尝试调用后端催发货接口，若不存在则仅弹窗提示
    try {
      await request.get(`/user/order/remind/${orderId}`);
      ElMessage.success('已发送催单请求，商家会尽快处理');
    } catch (e) {
      console.warn('/user/order/remind/{id} 调用失败，回退为本地提示', e);
      ElMessage.info('已提醒商家发货（界面模拟）');
    }
  } catch (e) {
    console.error('remindShipment failed', e);
    ElMessage.error('催发货失败');
  }
}

// 立即取消（例如未付款可直接取消）
const cancelOrderNow = async (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id
    if (!orderId) { ElMessage.error('订单号缺失，无法取消'); return }
    const ok = window.confirm('确认直接取消该订单？此操作不可逆。')
    if (!ok) return
    try {
      await request.put(`/user/order/cancel/${orderId}`)
      ElMessage.success('订单已取消')
      await fetchOrders()
    } catch (e) {
      console.warn('cancel API 调用失败，回退为本地提示', e)
      ElMessage.info('已标记为取消（界面模拟）')
      await fetchOrders()
    }
  } catch (e) {
    console.error('cancelOrderNow failed', e)
    ElMessage.error('取消订单失败')
  }
}

// 申请取消（已付款但需管理员同意）
const applyCancel = async (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id
    if (!orderId) { ElMessage.error('订单号缺失，无法申请取消'); return }
    const ok = window.confirm('确认提交取消申请？商家/管理员同意后将取消订单。')
    if (!ok) return
    try {
      await request.post('/user/order/applyCancel', { orderId })
      ElMessage.success('取消申请已提交')
      await fetchOrders()
    } catch (e) {
      console.warn('applyCancel API 调用失败，回退为本地提示', e)
      ElMessage.info('已提交取消申请（界面模拟）')
      await fetchOrders()
    }
  } catch (e) {
    console.error('applyCancel failed', e)
    ElMessage.error('申请取消失败')
  }
}

// 申请售后（已收货可申请售后）
const applyAfterSale = async (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id
    if (!orderId) { ElMessage.error('订单号缺失，无法申请售后'); return }
    
    // 先获取订单详情
    try {
      const res = await request.get(`/user/order/orderDetial/${orderId}`)
      const orderDetails = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.orderDetails ? res.orderDetails : []))
      
      // 计算订单总金额、运费、优惠金额
      let totalAmount = 0
      let freight = Number(o.freight || o.shippingFee || 0)
      let discount = Number(o.activityDiscount || o.discount || 0)
      
      orderDetails.forEach(item => {
        const price = Number(item.price || item.unitPrice || item.bookPrice || 0)
        const quantity = Number(item.quantity || item.number || item.count || 1)
        totalAmount += price * quantity
      })
      
      const actualPay = totalAmount + freight - discount
      
      // 显示退款申请弹窗
      showRefundDialog.value = true
      
      // 直接修改 reactive 对象的属性
      refundForm.orderId = orderId
      refundForm.orderNumber = o.id || o.orderId || o.Id
      refundForm.orderDetails = orderDetails
      refundForm.totalAmount = totalAmount
      refundForm.freight = freight
      refundForm.discount = discount
      refundForm.actualPay = actualPay
      refundForm.reason = ''
    } catch (e) {
      console.error('获取订单详情失败', e)
      ElMessage.error('获取订单详情失败')
    }
  } catch (e) {
    console.error('applyAfterSale failed', e)
    ElMessage.error('申请售后失败')
  }
}

// 确认收货
const confirmReceive = async (o) => {
  try {
    const orderId = o.id || o.orderId || o.Id
    if (!orderId) { ElMessage.error('订单号缺失，无法确认收货'); return }
    const ok = window.confirm('确认已收到商品？')
    if (!ok) return
    try {
      await request.put(`/user/order/receive/${orderId}`)
      ElMessage.success('确认收货成功')
      await fetchOrders()
    } catch (e) {
      console.warn('confirmReceive API 调用失败，回退为本地提示', e)
      ElMessage.info('已确认收货（界面模拟）')
      await fetchOrders()
    }
  } catch (e) {
    console.error('confirmReceive failed', e)
    ElMessage.error('确认收货失败')
  }
}

// 订单详情状态与加载
const viewingOrderId = ref(null)
const orderDetails = ref([])
const loadingOrderDetails = ref(false)

const viewOrderDetails = async (id) => {
  try {
    viewingOrderId.value = id
    loadingOrderDetails.value = true
    const res = await request.get(`/user/order/orderDetial/${id}`)
    // 后端可能直接返回数组或封装在 data 中
    const arr = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.orderDetails ? res.orderDetails : []))
    orderDetails.value = Array.isArray(arr) ? arr : (arr || [])
    // 调试输出：显示订单与明细的 commentStatus 以便排查按钮显示问题
    console.log('[User] viewOrderDetails -> currentViewingOrder', currentViewingOrder.value)
    console.log('[User] viewOrderDetails -> orderDetails', orderDetails.value.map(it => ({ id: it.id || it.orderDetailId || it.bookId, commentStatus: it.commentStatus })))
  } catch (e) {
    console.error('viewOrderDetails failed', e)
    orderDetails.value = []
  } finally {
    loadingOrderDetails.value = false
  }
}

const backToOrders = () => {
  viewingOrderId.value = null
  orderDetails.value = []
}

// 当前正在查看的订单对象（便于判断是否可评价）
const currentViewingOrder = computed(() => {
  if (!viewingOrderId.value) return null
  return orders.value.find(o => String(o.id) === String(viewingOrderId.value)) || null
})

// 订单是否处于已收货且未评价的状态（兼容后端不同的 commentStatus 约定）
const isCurrentOrderUnreviewed = computed(() => {
  if (!currentViewingOrder.value) return false
  const s = Number(currentViewingOrder.value.orderStatus || currentViewingOrder.value.status || 0)
  if (s !== 4) return false
  const cm = Number(currentViewingOrder.value.commentStatus || currentViewingOrder.value.cm || 0)
  // 兼容 0/1 两种未评价标记：若后端使用 1 表示未评价或 0 表示未评价，都视为未评价
  return cm === 0 || cm === 1
})

// 切换主筛选（也清除订单详情视图）
const selectOrderStatus = (code) => {
  selectedOrderStatus.value = code
  viewingOrderId.value = null
  orderDetails.value = []
  // 重新拉取列表以保证数据同步
  fetchOrders()
}

const selectSecondaryCommentFilter = (n) => {
  secondaryCommentFilter.value = n
  viewingOrderId.value = null
  orderDetails.value = []
}

const selectSecondaryRefundFilter = (n) => {
  secondaryRefundFilter.value = n
  viewingOrderId.value = null
  orderDetails.value = []
}

// 跳转去评价（先跳到商品详情并携带参数以便在详情页打开评价窗）
const showCommentDialog = ref(false)
const commentForm = reactive({ orderDetailId: null, content: '', images: [], score: 5 })

// 退款申请相关
const showRefundDialog = ref(false)
const refundForm = reactive({
  orderId: null,
  orderNumber: '',
  orderDetails: [],
  totalAmount: 0,
  freight: 0,
  discount: 0,
  actualPay: 0,
  reason: ''
})

const handleUploadSuccess = (response, file) => {
  const path = (typeof response === 'string') ? response : (response && (response.data || response.filePath || response.url) ? (response.data || response.filePath || response.url) : null)
  if (path) {
    commentForm.images.push(path)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.success('图片上传完成（请确认返回值）')
  }
}

const handleRemoveImage = (file, fileList) => {
  // 尝试从 file.response 中找回路径并移除
  const resp = file.response
  const path = resp ? (typeof resp === 'string' ? resp : (resp.data || resp.filePath || resp.url)) : (file.url || null)
  if (path) commentForm.images = commentForm.images.filter(p => p !== path)
}

// 中文评分文本
const rateTexts = ['很差', '较差', '一般', '满意', '非常满意']

const submitComment = async () => {
  try {
    if (!commentForm.content || !commentForm.content.trim()) { ElMessage.error('评价内容不能为空'); return }
    if (!Array.isArray(commentForm.images) || commentForm.images.length === 0) { ElMessage.error('请上传至少一张图片'); return }
    const payload = {
      orderDetailId: Number(commentForm.orderDetailId),
      content: commentForm.content,
      images: commentForm.images,
      score: Number(commentForm.score || 5)
    }
    await request.post('/user/comment/submint', payload)
    ElMessage.success('提交评价成功')
    showCommentDialog.value = false
    // 尝试更新本地订单状态，以便统计刷新
    if (viewingOrderId.value) {
      const ord = orders.value.find(o => String(o.id) === String(viewingOrderId.value))
      if (ord) ord.commentStatus = 2
    }
    await fetchOrders()
  } catch (e) {
    console.error('submitComment failed', e)
    ElMessage.error('提交评价失败')
  }
}

const goToComment = (item) => {
  try {
    console.log('goToComment invoked with item:', item)
    const pid = item.productId || item.bookId || item.id
    const detailId = item.id || item.orderDetailId || item.bookId
    if (!pid) { ElMessage.error('商品ID缺失，无法评价'); return }
    if (!detailId) { ElMessage.error('订单项ID缺失，无法评价'); return }
    // 在当前页面直接打开评价弹窗
    commentForm.orderDetailId = Number(detailId)
    commentForm.content = ''
    commentForm.images = []
    commentForm.score = 5
    showCommentDialog.value = true
    console.log('showCommentDialog set true, orderDetailId=', commentForm.orderDetailId)
  } catch (e) {
    console.error('goToComment failed', e)
    ElMessage.error('打开评价弹窗失败')
  }
}

// 提交退款申请
const submitRefund = async () => {
  try {
    if (!refundForm.reason || !refundForm.reason.trim()) {
      ElMessage.error('退款原因不能为空')
      return
    }
    
    const ok = window.confirm('确定要退款吗？')
    if (!ok) return
    
    try {
      await request.put(`/user/order/refund?id=${refundForm.orderId}&reason=${encodeURIComponent(refundForm.reason)}`)
      ElMessage.success('退款申请已提交')
      showRefundDialog.value = false
      await fetchOrders()
    } catch (e) {
      console.warn('submitRefund API 调用失败，回退为本地提示', e)
      ElMessage.info('已提交退款申请（界面模拟）')
      showRefundDialog.value = false
      await fetchOrders()
    }
  } catch (e) {
    console.error('submitRefund failed', e)
    ElMessage.error('提交退款申请失败')
  }
}


const fetchAddresses = async () => {
  loadingAddresses.value = true
  try {
    const res = await loadAddressList()
    const arr = Array.isArray(res) ? res : (res || [])
    // 默认地址置顶
    addresses.value = arr.sort((a, b) => {
      const ba = (b.isDefault === 1 || b.isDefault === true) ? 1 : 0
      const aa = (a.isDefault === 1 || a.isDefault === true) ? 1 : 0
      return ba - aa
    })
  } catch (e) { console.error('fetchAddresses failed', e); addresses.value = [] }
  finally { loadingAddresses.value = false }
}

const selectMainTab = (name) => {
  activeMainTab.value = name
  if (name === 'orders') fetchOrders()
  if (name === 'addresses') fetchAddresses()
}

// 切换主筛选时，重置二级筛选
watch(selectedOrderStatus, () => {
  secondaryRefundFilter.value = 0
  secondaryCommentFilter.value = 0
})

// 地址弹窗与操作（与 Checkout 页保持一致的交互）
const showAddressModal = ref(false)
const editingAddress = ref(null)

const onEditAddress = (addr) => {
  editingAddress.value = addr
  showAddressModal.value = true
}

const onDialogSaved = async () => {
  await fetchAddresses()
}

const onDeleteAddress = async (id) => {
  try {
    const ok = window.confirm('确认删除该地址？')
    if (!ok) return
    await apiDeleteAddress(id)
    ElMessage.success('删除成功')
    await fetchAddresses()
  } catch (e) { console.error('删除地址失败', e) }
}

const onSetDefault = async (id) => {
  try {
    await apiSetDefaultAddress(id)
    ElMessage.success('已设为默认地址')
    await fetchAddresses()
  } catch (e) { console.error('设置默认地址失败', e) }
}

// ============== 会员等级 ==============
const levelName = computed(() => {
  const map = { 1: '普通会员', 2: '白银会员', 3: '黄金会员', 4: '钻石会员' }
  return map[userInfoRef.level] || '普通会员'
})

const nextLevelExp = computed(() => userInfoRef.level * 500)
const expPercent = computed(() => (userInfoRef.member_exp / nextLevelExp.value) * 100)

// ============== 优惠券 ==============
const userCoupons = ref([
  { id: 1, name: '满100减20', reduceAmount: 20, minAmount: 100, endTime: '2026-05-01' },
  { id: 2, name: '满200减50', reduceAmount: 50, minAmount: 200, endTime: '2026-05-10' },
])

// ============== 浏览历史 ==============
const historyList = ref([
  { id: 1, productName: 'Vue实战教程', price: 89.9, cover: 'https://via.placeholder.com/60x80' },
  { id: 2, productName: 'Java编程思想', price: 108.0, cover: 'https://via.placeholder.com/60x80' },
])

const delHistory = (id) => { historyList.value = historyList.value.filter(i => i.id !== id) }
const clearHistory = () => { historyList.value = [] }
</script>

<style scoped>
/* 布局样式 */
.user-center-page { background: #f5f7fa; min-height: 100vh; padding: 20px 0; }
.container { max-width: 1200px; margin: 0 auto; background: #fff; border-radius: 12px; display: flex; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.sidebar { width: 260px; border-right: 1px solid #eee; padding: 24px 0; }
.user-card { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
.profile-avatar { width: 100px; height: 100px; border-radius: 50%; background: #409eff; color: #fff; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.username { margin: 10px 0; }
.sidebar-menu { padding: 16px 0; }
/* 菜单样式：图标缩小，布局更紧凑 */
.menu-item { 
  display: flex; 
  align-items: center; 
  padding: 12px 24px; 
  cursor: pointer; 
  font-size: 16px;
}
.address-card { margin-bottom: 12px; }
.menu-item.active { background: #409eff; color: #fff; }
.content { flex: 1; padding: 32px; }
.title { font-size: 18px; margin-bottom: 20px; }
.member-card { background: linear-gradient(135deg, #ffec6e 0%, #ff9a8e 100%); color: #333; padding: 24px; border-radius: 12px; }
.member-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
.points { font-size: 16px; font-weight: bold; }
.exp-bar { margin: 16px 0; }
/* 会员权益样式 */
.rights {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
.rights .item {
  background: rgba(255,255,255,0.3);
  padding: 6px 12px;
  border-radius: 20px;
}
.coupon-list { margin-top: 16px; }
.coupon-item { display: flex; justify-content: space-between; padding: 16px; border: 1px dashed #ff6633; border-radius: 8px; margin-bottom: 12px; }
.coupon-item .left { text-align: center; }
.coupon-item .price { font-size: 22px; color: #ff6633; font-weight: bold; }

/* 退款申请弹窗样式 */
.refund-order-info {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.refund-product-list {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.product-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  font-weight: 600;
  font-size: 14px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.product-price {
  font-weight: 600;
  color: #f56c6c;
}

.refund-amount-info {
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.amount-item.total {
  font-weight: 600;
  color: #333;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.refund-reason {
  margin-top: 8px;
}

.refund-reason .el-button {
  margin-right: 8px;
}
.history-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { display: flex; align-items: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; }
.history-item img { width: 60px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 12px; }
.history-item .info { flex: 1; }
.history-item .name { font-size: 14px; margin-bottom: 4px; }
.history-item .price { color: #ff5000; font-weight: bold; }
/* 订单样式 */
.order-filters { display:flex; gap:12px; align-items:center; margin-bottom:12px }
.status-tab { padding:6px 12px; border-radius:18px; background:#fafafa; color:#666; cursor:pointer; font-weight:600 }
.status-tab.active { background:#fff3e8; color:#ff5000 }
.order-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px }
.order-header { display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px solid #f5f5f5 }
.order-header .left { display:flex; gap:12px; align-items:center }
.order-header .order-no { color:#999 }
.order-header .right { display:flex; gap:12px; align-items:center }
.order-body { display:flex; padding-top:12px }
.item-row { display:flex; flex:1; gap:12px; align-items:center }
.thumb-wrap img { width:80px; height:80px; object-fit:cover; border-radius:6px }
.info { flex:1 }
.info .title { font-weight:600; margin-bottom:6px }
.info .meta { color:#999; margin-bottom:6px }
.info .actions { display:flex; gap:8px }
.price-panel { width:200px; text-align:right; color:#333; font-weight:600 }
/* 地址表格样式 */
.addr-table { border: 1px solid #eef2f6; border-radius: 6px; overflow: hidden; }
.addr-row { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f3f6f9; }
.addr-row.header { background: #fbfbfb; font-weight: 600; color: #666; }
.addr-row.header .col { padding-top: 4px; padding-bottom: 4px; }
.addr-row .col { padding: 4px 6px; }
.addr-row .col.name { width: 160px; }
.addr-row .col.phone { width: 160px; }
.addr-row .col.address { flex: 1; color: #444; }
.addr-row .col.ops { width: 220px; text-align: right; display:flex; align-items:center; justify-content:flex-end; gap:6px }
.addr-row .col.ops .el-button { padding: 0 4px; }
.addr-row:last-child { border-bottom: none; }
/* 新订单卡片样式 */
.new-order-card { padding: 18px; border-radius: 8px; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.03); }
.order-card-header { display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:1px solid #f3f3f3 }
.order-card-header .header-left { color:#999; font-size:13px; width:160px }
.order-card-header .header-center { flex:1; text-align:center; color:#333; font-size:14px }
.order-card-header .header-right { width:120px; text-align:right }
.order-card-body { padding:12px 0 }
.body-item { display:flex; gap:12px; align-items:center }
.body-thumb { width:60px; height:80px; object-fit:cover; border-radius:6px }
.body-info .body-title { font-weight:600; color:#333 }
.body-info .body-meta { color:#777; font-size:13px }
.order-card-footer { display:flex; justify-content:space-between; align-items:center; padding-top:12px }
.price-info { display:flex; align-items:baseline; gap:8px }
.paid-amount { color:#ff4d4f; font-size:18px; font-weight:700 }
.orig-amount { color:#999; font-size:13px; text-decoration:line-through }
.ops { display:flex; gap:8px }
/* 面包屑样式 */
.breadcrumb { display:flex; align-items:center; gap:8px; font-size:14px }
.breadcrumb .link { color: #409eff; cursor: pointer }
.breadcrumb .sep { color:#999 }
</style>