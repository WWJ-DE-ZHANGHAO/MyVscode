<template>
  <div class="user-page">
    <div class="container">
      <aside class="sidebar">
        <div class="avatar-wrap">
          <el-avatar :size="96" :src="userInfoRef.avatar" v-if="userInfoRef.avatar" />
          <div class="profile-avatar" v-else>{{ avatarText }}</div>
        </div>
        <div class="profile-info">
          <h2>{{ userInfoRef.username || '欢迎用户' }}</h2>
          <p v-if="defaultAddress">{{ defaultAddress.detail }}</p>
        </div>
        <el-button type="primary" plain @click="openEditProfile">修改资料</el-button>
      </aside>

      <section class="content">
        <el-tabs v-model="activeMainTab">
          <el-tab-pane label="我的订单" name="orders">
            <div class="orders-area">
              <el-tabs v-model="activeOrderTab" type="border-card">
                <el-tab-pane v-for="(label, key) in orderStatusMap" :key="key" :label="label" :name="key"></el-tab-pane>
              </el-tabs>

              <div class="order-list">
                <div v-for="order in filteredOrders" :key="order.id" class="order-item">
                  <div class="order-header">
                    <span>订单号：{{ order.orderNo }}</span>
                    <span class="order-status" :style="{ color: 'red' }">{{ order.statusLabel }}</span>
                  </div>
                  <div class="order-body">
                    <img class="prod-cover" :src="order.items[0].cover" alt="封面" />
                    <div class="prod-info">
                      <div class="prod-name">{{ order.items[0].name }}</div>
                      <div class="prod-qty">数量：{{ order.items[0].qty }}</div>
                      <div class="order-address">收货地址：{{ order.address.detail }}</div>
                    </div>
                    <div class="order-total">合计：¥{{ order.total.toFixed(2) }}</div>
                  </div>
                  <div class="order-actions">
                    <el-button size="small" @click="viewOrder(order)">查看详情</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="我的收货地址" name="addresses">
            <div class="addresses-area">
              <div class="address-list">
                <div v-for="(addr, idx) in addresses" :key="idx" class="address-item">
                  <div class="address-header">
                    <span class="address-name">{{ addr.name }}</span>
                    <span class="address-phone">{{ addr.phone }}</span>
                  </div>
                  <div class="address-detail">{{ addr.detail }}</div>
                  <div class="address-actions">
                    <el-button size="small" @click="openEditAddress(idx)">编辑</el-button>
                    <el-button size="small" @click="deleteAddress(idx)" type="danger">删除</el-button>
                    <el-button size="small" @click="setDefault(idx)" :type="addr.default ? 'primary' : 'default'">设为默认</el-button>
                    <span v-if="addr.default" class="default-tag">默认地址</span>
                  </div>
                </div>
              </div>

              <div class="add-address-btn">
                <el-button type="primary" @click="openAddAddress">添加新地址</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog title="修改资料" v-model:visible="editProfileVisible">
      <el-form :model="profileForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        <el-form-item label="头像 URL">
          <el-input v-model="profileForm.avatar" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProfileVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑地址弹窗 -->
    <el-dialog :title="addressEditIndex === null ? '添加地址' : '编辑地址'" v-model:visible="addressDialogVisible">
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="addressForm.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.phone" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detail" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.default">设为默认</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const raw = sessionStorage.getItem('currentUser');
let userInfo = {};
try { userInfo = raw ? JSON.parse(raw) : {}; } catch (e) { userInfo = {}; }

const avatarText = ref((userInfo.username && userInfo.username[0]) || '用户');
const defaultAddress = ref(userInfo.defaultAddress || null);

const userInfoRef = ref(userInfo);

// 主区域控制
  // persist
const activeMainTab = ref('orders');
const activeOrderTab = ref('all');

// 订单状态映射
const orderStatusMap = {
  all: '全部',
  pending_pay: '待付款',
  pending_ship: '待发货',
  pending_receive: '待收货',
  pending_review: '待评价',
  completed: '已完成',
  refunding: '退款中',
  refunded: '已退款',
  canceled: '已取消'
};

// mock 订单数据
const orders = reactive([
  { id: 1, orderNo: '202603290001', status: 'pending_pay', statusLabel: '待付款', total: 199.00, address: { detail: '湖南省-长沙市-望城区' }, items: [{ cover: '/public/images/book.png', name: 'Vue 入门', qty: 1 }] },
  { id: 2, orderNo: '202603290002', status: 'completed', statusLabel: '已完成', total: 59.99, address: { detail: '山东省-烟台市' }, items: [{ cover: '/public/images/book.png', name: 'Java 编程思想', qty: 1 }] }
]);

const filteredOrders = computed(() => {
  if (activeOrderTab.value === 'all') return orders;
  return orders.filter(o => o.status === activeOrderTab.value);
});

// 地址数据
const addresses = reactive(userInfo.addresses || [
  { name: '小罗', phone: '13632733462', detail: '湖南省-长沙市-望城区', default: true },
  { name: '张先生', phone: '13632733462', detail: '山东省-烟台市-莱州市-冰河时代小区404街道', default: false }
]);

// 编辑资料
const editProfileVisible = ref(false);
const profileForm = reactive({ username: userInfo.username || '', email: userInfo.email || '', avatar: userInfo.avatar || '' });

const openEditProfile = () => {
  profileForm.username = userInfoRef.value.username || '';
  profileForm.email = userInfoRef.value.email || '';
  profileForm.avatar = userInfoRef.value.avatar || '';
  editProfileVisible.value = true;
};

const saveProfile = () => {
  userInfoRef.value.username = profileForm.username;
  userInfoRef.value.email = profileForm.email;
  userInfoRef.value.avatar = profileForm.avatar;
  avatarText.value = (profileForm.username && profileForm.username[0]) || '用户';
    sessionStorage.setItem('currentUser', JSON.stringify(userInfoRef.value));
  editProfileVisible.value = false;
  window.dispatchEvent(new Event('user-updated'));
  ElMessage.success('资料已保存');
};

// 地址弹窗
const addressDialogVisible = ref(false);
const addressEditIndex = ref(null);
const addressForm = reactive({ name: '', phone: '', detail: '', default: false });

const openAddAddress = () => {
  addressEditIndex.value = null;
  addressForm.name = '';
  addressForm.phone = '';
  addressForm.detail = '';
  addressForm.default = false;
  addressDialogVisible.value = true;
};

const openEditAddress = (i) => {
  addressEditIndex.value = i;
  const a = addresses[i];
  addressForm.name = a.name;
  addressForm.phone = a.phone;
  addressForm.detail = a.detail;
  addressForm.default = !!a.default;
  addressDialogVisible.value = true;
};

const saveAddress = () => {
  if (!addressForm.name || !addressForm.phone || !addressForm.detail) { ElMessage.warning('请完整填写地址信息'); return; }
  if (addressForm.default) addresses.forEach(a => a.default = false);
  const newAddr = { name: addressForm.name, phone: addressForm.phone, detail: addressForm.detail, default: !!addressForm.default };
  if (addressEditIndex.value === null) {
    addresses.push(newAddr);
  } else {
    Object.assign(addresses[addressEditIndex.value], newAddr);
  }
    // 同步默认地址到 userInfo
  const def = addresses.find(a => a.default) || null;
  userInfoRef.value.defaultAddress = def;
    sessionStorage.setItem('currentUser', JSON.stringify(userInfoRef.value));
  addressDialogVisible.value = false;
  defaultAddress.value = def;
  window.dispatchEvent(new Event('user-updated'));
  ElMessage.success('保存成功');
};

const deleteAddress = (i) => {
  if (!confirm('确认删除该地址？')) return;
  const wasDefault = addresses[i].default;
  addresses.splice(i, 1);
  if (wasDefault && addresses.length) addresses[0].default = true;
  userInfoRef.value.defaultAddress = addresses.find(a => a.default) || null;
    sessionStorage.setItem('currentUser', JSON.stringify(userInfoRef.value));
  defaultAddress.value = userInfoRef.value.defaultAddress || null;
  window.dispatchEvent(new Event('user-updated'));
  ElMessage.success('已删除');
};

const setDefault = (i) => {
  addresses.forEach((a, idx) => a.default = idx === i);
  userInfoRef.value.defaultAddress = addresses[i];
    sessionStorage.setItem('currentUser', JSON.stringify(userInfoRef.value));
  defaultAddress.value = addresses[i];
  window.dispatchEvent(new Event('user-updated'));
  ElMessage.success('已设置为默认地址');
};

const viewOrder = (order) => {
  // 简单示例：跳转到订单详情页或弹窗
  ElMessage.info('查看订单：' + order.orderNo);
};

const onUserUpdated = () => {
    const raw2 = sessionStorage.getItem('currentUser');
  try { userInfoRef.value = raw2 ? JSON.parse(raw2) : {}; } catch (e) { userInfoRef.value = {}; }
  avatarText.value = (userInfoRef.value.username && userInfoRef.value.username[0]) || '用户';
  defaultAddress.value = userInfoRef.value.defaultAddress || (addresses.find(a => a.default) || null);
};

onMounted(() => {
  onUserUpdated();
  window.addEventListener('user-updated', onUserUpdated);
  // 若未登录，跳转登录
  if (!raw) router.push('/login');
});

onBeforeUnmount(() => {
  window.removeEventListener('user-updated', onUserUpdated);
});
</script>

<style scoped>
.container { max-width: 1100px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; overflow: hidden; }
.sidebar { width: 260px; background: #fff; border-right: 1px solid #f0f0f0; padding: 30px 20px; text-align: center; }
.avatar-wrap { margin-bottom: 12px; }
.profile-avatar { width: 96px; height: 96px; border-radius: 50%; background-color: #f0f0f0; display:flex; align-items:center; justify-content:center; margin: 0 auto; color:#999; font-weight:600; font-size:28px; }
.profile-info h2 { font-size: 18px; margin: 8px 0; color: #333; }
.profile-info p { color: #666; font-size: 13px; margin-bottom: 16px; }
.content { flex: 1; padding: 20px 24px; }
.orders-area { display:flex; flex-direction:column; gap:12px; }
.order-list { display:flex; flex-direction:column; gap:12px; margin-top:12px; }
.order-item { border:1px solid #f0f0f0; padding:12px; border-radius:6px; background:#fff; }
.order-header { display:flex; justify-content:space-between; margin-bottom:8px; }
.order-body { display:flex; gap:12px; align-items:center; }
.prod-cover { width:72px; height:90px; object-fit:cover; border:1px solid #eee; }
.prod-info { flex:1; }
.order-total { font-weight:700; }
.order-actions { margin-top:8px; display:flex; gap:8px; justify-content:flex-end; }
.address-list { display:flex; flex-direction:column; gap:12px; }
.address-item { border:1px solid #f6f6f6; padding:12px; border-radius:6px; background:#fff; }
.address-header { display:flex; justify-content:space-between; font-weight:600; margin-bottom:8px; }
.address-actions { display:flex; gap:8px; align-items:center; }
.default-tag { background:#409EFF; color:#fff; padding:2px 6px; border-radius:4px; font-size:12px; margin-left:8px; }
.add-address-btn { margin-top:18px; }
</style>
