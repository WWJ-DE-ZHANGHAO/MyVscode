<template>
  <div class="checkout-page">
    <!-- 1. 顶部收货地址管理（修改：卡片横向布局、悬停浮现操作、展开/新增按钮） -->
    <div class="section address-section">
      <div class="section-header">
        <h2>确认收货地址</h2>
      </div>

      <div class="address-cards-wrap">
        <div class="address-list">
          <div
            v-for="(addr, index) in visibleAddresses"
            :key="addr.id"
            class="address-card"
            :class="{ 'is-default': addr.isDefault, 'is-active': activeCardId === addr.id }"
            @click="selectAddress(addr); activeCardId = addr.id"
            @mouseenter="hoveredCardId = addr.id"
            @mouseleave="hoveredCardId = null"
          >
            <div class="card-top">
              <div class="left">
                <div class="address-name">{{ addr.consignee }}</div>
              </div>
              <div class="right">
                <div class="address-phone">{{ formatPhone(addr.phone) }}</div>
              </div>
            </div>
            <div class="address-detail">
              <div class="location">{{ addr.fullLocation }}</div>
              <div class="detail">{{ addr.detailAddress }}</div>
            </div>
            <div class="station" v-if="addr.station">驿站：{{ addr.station }}</div>

            <div class="card-footer">
              <div class="card-actions" :class="{ visible: hoveredCardId === addr.id || activeCardId === addr.id }">
                <el-button type="link" size="small" @click.stop="editAddress(addr)">编辑</el-button>
                <el-button type="link" size="small" @click.stop="deleteAddress(addr)">删除</el-button>
                <el-button v-if="!addr.isDefault" type="link" size="small" @click.stop="setDefault(addr)">设为默认地址</el-button>
              </div>

              <div class="default-indicator" v-if="addr.isDefault">
                <i class="el-icon-location"></i>
                <span>默认地址</span>
              </div>
            </div>
          </div>
        </div>

        <div class="address-controls">
          <el-button v-if="addressList.length > 4" type="default" size="small" class="btn-expand" @click="toggleExpand">
            <span>{{ expanded ? '收起地址' : '展开地址' }}</span>
            <i :class="expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:6px"></i>
          </el-button>

          <el-button type="primary" size="small" @click="addAddress()">
            <i class="el-icon-plus" style="margin-right:6px"></i>新增收货地址
          </el-button>
        </div>
      </div>

      <!-- 新增 / 编辑 弹窗（抽离为组件 AddressDialog） -->
      <AddressDialog v-model="showAddressModal" :address="editingAddress" @saved="onDialogSaved" />
    </div>

    <!-- 2. 中间内容：商品清单 + 金额信息 -->
    <div class="section order-content">
      <!-- 左侧：商品信息 -->
      <div class="content-left">
        <div class="order-summary-header">
          <span>以下商品 预计{{ estimateDate }}送达</span>
          <span class="freight">运费:{{ freight.toFixed(2) }}</span>
        </div>
        <div class="product-table">
          <div class="table-header">
            <span class="col-name">商品名称</span>
            <span class="col-price">单价</span>
            <span class="col-qty">数量</span>
            <span class="col-total">总价</span>
          </div>
          <div v-for="item in cartItems" :key="item.id" class="product-row">
            <div class="col-name">
              <div class="product-info">
                <img :src="item.cover || '/images/new.png'" alt="" class="thumb" @error="(e)=>e.target.src='/images/new.png'" />
                <div class="info-text">
                  <div class="title">{{ item.title }}</div>
                  <div class="product-desc" v-if="item.description">{{ item.description }}</div>
                  <div class="desc">{{ item.sku || '' }}</div>
                </div>
              </div>
            </div>
            <div class="col-price">¥{{ item.price.toFixed(2) }}</div>
            <div class="col-qty">{{ item.quantity }}</div>
            <div class="col-total">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
          </div>
        </div>
        <div class="order-summary-footer">
          <div class="left-info">
            <span class="package-count">1个包裹</span>
          </div>
        </div>
      </div>

      <!-- 右侧：金额信息 -->
      <div class="content-right">
        <div class="payment-details">
          <h3>付款详情</h3>
          <div class="detail-item">
            <span>商品总价</span>
            <span class="price">¥{{ displayedOriginalTotal.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span>运费</span>
            <span class="price">¥{{ freight.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span>活动优惠</span>
            <span class="price negative">-¥{{ displayedDiscount.toFixed(2) }}</span>
          </div>
          <div class="detail-item coupon-detail">
            <span>礼券优惠</span>
            <div class="coupon-section" @click="toggleCouponDropdown">
              <span class="coupon-value">-¥{{ selectedCouponValue.toFixed(2) }}</span>
              <i :class="['el-icon-arrow-down', 'coupon-arrow', { 'rotated': showCouponDropdown }]"></i>
            </div>
          </div>
          <div class="detail-item points-item" @click="usePoints = !usePoints" :class="{ 'points-disabled': pointsAvailable < 100 }">
            <div class="points-section">
              <span>积分抵扣</span>
              <span class="points-value" v-if="usePoints">使用积分抵扣 ¥{{ pointsValue.toFixed(2) }}</span>
              <span class="points-value" v-else>未使用积分</span>
            </div>
            <div class="points-switch">
              <div class="switch-track" :class="{ 'switch-active': usePoints && pointsAvailable >= 100 }">
                <div class="switch-thumb"></div>
              </div>
            </div>
          </div>
          <!-- 优惠券下拉框（后端未实现） -->
          <div class="coupon-dropdown" v-if="showCouponDropdown">
            <div class="coupon-list">
              <div v-if="coupons.length === 0" class="coupon-empty">
                优惠券为空
              </div>
              <div v-else class="coupon-item" v-for="(coupon, index) in coupons" :key="index" :class="{ 'coupon-disabled': !coupon.available }">
                  <div class="coupon-select">
                    <el-radio v-model="selectedCoupon" :label="coupon.value" :disabled="!coupon.available"></el-radio>
                  </div>
                  <div class="coupon-content">
                    <div class="coupon-header">
                      <span class="coupon-amount">{{ coupon.value }}</span>
                      <span class="coupon-type">{{ coupon.type }}</span>
                    </div>
                    <div class="coupon-desc">{{ coupon.desc }}</div>
                    <div class="coupon-expiry">有效期: {{ coupon.expiry }}</div>
                  </div>
                </div>
            </div>
          </div>
          <div class="detail-item total-discount">
            <span>合计优惠</span>
            <span class="price negative">-¥{{ (displayedDiscount + selectedCouponValue).toFixed(2) }}</span>
          </div>
          <div class="detail-item total-amount">
            <span>合计</span>
            <span class="price">¥{{ finalPayAmount.toFixed(2) }}</span>
          </div>
          <el-button type="danger" class="btn-submit" @click="handlePay">提交订单</el-button>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import AddressDialog from '@/components/AddressDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request';
import { loadAddressList as apiLoadAddressList, deleteAddress as apiDeleteAddress, setDefaultAddress as apiSetDefaultAddress } from '@/composables/useAddress';

// 地址列表（从后端加载）
const addressList = ref([]);

// 购物车商品
const cartItems = ref([
  { id: 101, title: '听说读唱早教全能发声书大早教多主题宝宝儿童', sku: '早教启蒙学习点读书0-9岁 (充电款)', description: '', price: 49.9, quantity: 1, cover: '/images/new.png' },
]);

// --- 状态与逻辑 ---
const selectedAddress = ref(null);
const freight = ref(0); // 运费金额
const activityDiscount = ref(null); // 优惠金额（后端可能返回 null）
const originalTotal = ref(null); // 后端返回的商品总价（可能用于展示）
const hoveredCardId = ref(null);
const activeCardId = ref(null);
const expanded = ref(false);
const showAddressModal = ref(false);
const editingAddress = ref(null);
const showCouponDropdown = ref(false);
const selectedCoupon = ref(null);
const selectedCouponValue = ref(0); // 选中的优惠券折扣金额
const selectedCouponRecordId = ref(null); // 选中的优惠券记录ID
const usePoints = ref(false);
const pointsAvailable = ref(1000); // 假设用户有1000积分
const pointsValue = ref(10); // 假设1000积分可以抵扣10元
const usedPoints = ref(0); // 实际使用的积分
const shippingFee = ref(0); // 运费
const coupons = ref([]);
const visibleAddresses = computed(() => (expanded.value ? addressList.value : addressList.value.slice(0, 4)));

const toggleCouponDropdown = async () => {
  showCouponDropdown.value = !showCouponDropdown.value;
  if (showCouponDropdown.value) {
    await fetchCoupons();
  }
};

// 获取未使用的优惠券
const fetchCoupons = async () => {
  try {
    // 准备请求参数
    const params = cartItems.value.map(item => ({
      productId: item.id,
      totalprice: item.price * item.quantity
    }));
    
    // 发送请求
    const res = await request.post('/user/user-coupon-record/get', params);
    
    // 处理响应数据
    if (Array.isArray(res)) {
      coupons.value = res.map(coupon => ({
        id: coupon.id,
        value: coupon.type === 1 ? `¥${coupon.discountValue.toFixed(2)}` : `${coupon.discountValue}折`,
        type: coupon.type === 1 ? '满减券' : '折扣券',
        desc: `满${coupon.minOrderAmount.toFixed(2)}元可用`,
        expiry: `${formatDate(coupon.validStartTime)}至${formatDate(coupon.validEndTime)}`,
        available: coupon.status === 1,
        couponRecordId: coupon.couponRecordId
      }));
    } else {
      // 当响应数据为null或非数组时，设置为空数组
      coupons.value = [];
    }
  } catch (e) {
    console.error('获取优惠券失败', e);
    ElMessage.error('获取优惠券失败，请稍后重试');
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

// 监听选中的优惠券变化
import { watch } from 'vue';

watch(selectedCoupon, (newValue) => {
  if (newValue) {
    // 找到对应的优惠券对象，获取couponRecordId
    const selectedCouponObj = coupons.value.find(coupon => coupon.value === newValue);
    if (selectedCouponObj) {
      selectedCouponRecordId.value = selectedCouponObj.couponRecordId;
    }
    // 提取折扣金额
    if (newValue.startsWith('¥')) {
      selectedCouponValue.value = parseFloat(newValue.replace('¥', '')) || 0;
    } else if (newValue.endsWith('折')) {
      // 折扣券计算折扣金额
      const discountRate = parseFloat(newValue.replace('折', '')) / 10;
      selectedCouponValue.value = displayedOriginalTotal.value * (1 - discountRate);
    }
  } else {
    selectedCouponValue.value = 0;
    selectedCouponRecordId.value = null;
  }
});

const toggleExpand = () => { expanded.value = !expanded.value; };

const switchRegion = () => { ElMessage.info('切换配送地区（占位）'); };

// 使用积分抵扣
const usePointsDeduction = async () => {
  if (!usePoints.value) {
    pointsValue.value = 0;
    usedPoints.value = 0;
    return;
  }
  try {
    const res = await request.post('/user/pointsLog/use');
    if (res) {
      pointsValue.value = Number(res.amount) || 0;
      usedPoints.value = Number(res.points) || 0;
    }
  } catch (e) {
    console.error('获取积分抵扣失败', e);
    ElMessage.error('获取积分抵扣失败，请稍后重试');
    usePoints.value = false;
    pointsValue.value = 0;
    usedPoints.value = 0;
  }
};

// 监听积分抵扣开关变化
watch(usePoints, async (newValue) => {
  if (newValue) {
    await usePointsDeduction();
  } else {
    pointsValue.value = 0;
    usedPoints.value = 0;
  }
});

const editAddress = (addr) => {
  editingAddress.value = addr;
  showAddressModal.value = true;
};

const addAddress = () => {
  editingAddress.value = null;
  showAddressModal.value = true;
};

const loadAddressList = async () => {
  try {
    const res = await apiLoadAddressList();
    if (Array.isArray(res)) {
      const mapped = res.map(item => ({
        ...item,
        id: item.id,
        receiverName: item.receiverName || item.consignee || '',
        consignee: item.receiverName || item.consignee || '',
        provinceName: item.provinceName || '',
        cityName: item.cityName || '',
        districtName: item.districtName || '',
        fullLocation: [item.provinceName, item.cityName, item.districtName].filter(Boolean).join(' '),
        detailAddress: item.detailAddress || '',
        isDefault: !!(item.isDefault === 1 || item.isDefault === true),
        phone: item.phone || '',
        station: item.station || ''
      }));
      addressList.value = mapped.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      selectedAddress.value = addressList.value.find(a => a.isDefault) || addressList.value[0] || null;
    }
  } catch (e) {
    console.error('拉取地址列表失败', e);
  }
};



// 计算运费：发送 addressBookId，后端返回金额
const calcShippingCost = async (addressBookId) => {
  if (!addressBookId) {
    freight.value = 0;
    return;
  }
  try {
    // 后端映射为 GET /cost，使用 query 参数
    const params = { addressBookId: Number(addressBookId) };
    console.log('calcShippingCost -> request params:', params);
    const res = await request.get('/user/shipping-template/cost', { params });
    console.log('calcShippingCost -> response:', res);
    const v = Number(res || 0) || 0;
    freight.value = v;
  } catch (e) {
    // 打印后端返回体以便排查（若存在）
    console.error('计算运费失败', e);
    try {
      console.warn('error response data:', e.response && e.response.data ? e.response.data : null);
    } catch (ee) {}
    freight.value = 0;
    ElMessage.error('计算运费失败，请稍后重试');
  }
};

// 将后端地址数组映射为页面需要的字段并设置到 state（供预加载和常规加载共用）
const applyAddressData = (arr) => {
  if (!Array.isArray(arr)) return;
  const mapped = arr.map(item => ({
    ...item,
    id: item.id,
    receiverName: item.receiverName || item.consignee || '',
    consignee: item.receiverName || item.consignee || '',
    provinceName: item.provinceName || '',
    cityName: item.cityName || '',
    districtName: item.districtName || '',
    fullLocation: [item.provinceName, item.cityName, item.districtName].filter(Boolean).join(' '),
    detailAddress: item.detailAddress || '',
    isDefault: !!(item.isDefault === 1 || item.isDefault === true),
    phone: item.phone || '',
    station: item.station || ''
  }));
  addressList.value = mapped.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  selectedAddress.value = addressList.value.find(a => a.isDefault) || addressList.value[0] || null;
};

const onDialogSaved = async () => {
  await loadAddressList();
};

const deleteAddress = async (addr) => {
  const ok = window.confirm('确认删除该地址？');
  if (!ok) return;
  try {
    await apiDeleteAddress(addr.id);
    ElMessage.success('删除成功');
    await loadAddressList();
  } catch (e) {
    console.error('删除地址失败', e);
  }
};

const setDefault = async (addr) => {
  try {
    await apiSetDefaultAddress(addr.id);
    ElMessage.success('已设为默认地址');
    await loadAddressList();
  } catch (e) {
    console.error('设置默认地址失败', e);
  }
};

// packageUpgrade removed
// 动态计算时间：当前时间半小时后，预计送达为当前日期三天后
const pad = (n) => String(n).padStart(2, '0');
const getHalfHourLaterStr = () => {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const getThreeDaysLaterStr = () => {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`;
};

const currentDate = ref(getHalfHourLaterStr());
const estimateDate = ref(getThreeDaysLaterStr());

const totalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const totalQuantity = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));

const displayedOriginalTotal = computed(() => {
  // 优先使用后端返回的 originalTotal（若非 null），否则使用本地计算的 totalPrice
  return (originalTotal.value != null) ? Number(originalTotal.value) : Number(totalPrice.value);
});

const displayedDiscount = computed(() => {
  return (activityDiscount.value != null) ? Number(activityDiscount.value) : 0;
});

const finalPayAmount = computed(() => {
  const v = Number(displayedOriginalTotal.value) - Number(displayedDiscount.value) - Number(selectedCouponValue.value) + Number(freight.value || 0) - (usePoints.value ? Number(pointsValue.value) : 0);
  return v;
});

const selectAddress = async (addr) => {
  selectedAddress.value = addr;
  // 重新计算运费
  if (selectedAddress.value && selectedAddress.value.id) {
    await calcShippingCost(selectedAddress.value.id);
  }
};

const handleUseNewAddress = () => { ElMessage.info('跳转到新增地址页面'); };
const handleManageAddress = () => { ElMessage.info('跳转到地址管理页面'); };

const route = useRoute();
const router = useRouter();

const handlePay = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请先选择收货地址');
    return;
  }
  try {
    // 获取source参数，优先使用URL中的source参数，统一处理大小写
    const rawSource = route.query.source || 'buynow';
    const source = rawSource.toLowerCase() === 'buynow' ? 'buyNow' : rawSource;
    // 使用本地时间格式 "YYYY-MM-DD HH:mm:ss"（空格分隔），预计送达取三天后的整点（向上取整到下一个整点）
    const makeLocalDateTime = (d) => {
      const Y = d.getFullYear();
      const M = pad(d.getMonth() + 1);
      const D = pad(d.getDate());
      const h = pad(d.getHours());
      const m = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    };
    const getEstimatedDeliveryDateTime = () => {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const hour = nextHour.getHours();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, hour, 0, 0);
      return makeLocalDateTime(target);
    };
    const estimated = getEstimatedDeliveryDateTime();
    const amountNum = Number((finalPayAmount.value).toFixed(2));

    // 构建符合UserOrderSubmit实体类的payload
    const payload = {
      source,
      couponRecordId: selectedCouponRecordId.value ? Number(selectedCouponRecordId.value) : null,
      usedPoints: usePoints.value && usedPoints.value > 0 ? usedPoints.value : null,
      addressBookId: Number(selectedAddress.value.id),
      estimatedDeliveryTime: estimated,
      consigneeName: selectedAddress.value.consignee || selectedAddress.value.receiverName || '',
      phone: selectedAddress.value.phone || '',
      actualPay: amountNum,
      originalTotal: originalTotal.value != null ? Number(originalTotal.value) : null,
      freight: freight.value != null ? Number(freight.value) : null,
      activityDiscount: activityDiscount.value != null ? Number(activityDiscount.value) : null,
      productId: null,
      quantity: null,
      shoppingCartIds: null
    };
    
    if (source === 'buyNow') {
      // 商品详情页下单：需要传递productId和quantity
      if (Array.isArray(cartItems.value) && cartItems.value.length > 0) {
        const it = cartItems.value[0];
        payload.productId = Number(it.productId || it.id); // 优先使用productId字段
        payload.quantity = Number(it.quantity || 1);
      } else if (route.query.bookId) {
        payload.productId = Number(route.query.bookId);
        payload.quantity = route.query.quantity ? Number(route.query.quantity) : 1;
      } else {
        // 尝试从sessionStorage中获取checkoutItems作为最后备用
        let checkoutItems = null;
        try {
          const raw = sessionStorage.getItem('checkoutItems');
          if (raw) checkoutItems = JSON.parse(raw);
        } catch (e) { checkoutItems = null; }

        if (checkoutItems && checkoutItems.buyNows && Array.isArray(checkoutItems.buyNows) && checkoutItems.buyNows.length > 0) {
          const it = checkoutItems.buyNows[0];
          payload.productId = Number(it.productId || it.id);
          payload.quantity = Number(it.quantity || it.number || 1);
        } else if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          const it = checkoutItems[0];
          payload.productId = Number(it.productId || it.id);
          payload.quantity = Number(it.quantity || it.number || 1);
        } else {
          ElMessage.error('缺少商品信息，无法提交订单');
          return;
        }
      }
      // 确保购物车ID列表为null
      payload.shoppingCartIds = null;
    } else {
      // 购物车下单：需要传递shoppingCartIds，不需要传递productId和quantity
      // 只有在非buyNow模式下才从sessionStorage读取购物车ID
      let shoppingCartIds = null;
      try {
        const raw = sessionStorage.getItem('checkoutShoppingCartIds');
        if (raw) shoppingCartIds = JSON.parse(raw);
      } catch (e) {
        shoppingCartIds = null;
      }
      
      if (Array.isArray(shoppingCartIds) && shoppingCartIds.length > 0) {
        // 购物车下单：传递购物车 id 列表（确保为数字数组）
        payload.shoppingCartIds = shoppingCartIds.map(id => Number(id));
      } else {
        ElMessage.error('缺少购物车信息，无法提交订单');
        return;
      }
      // 确保商品ID和数量为null
      payload.productId = null;
      payload.quantity = null;
    }

    console.log('submit order payload:', payload);

    const res = await request.post('/user/order/submit', payload);
    // res 由响应拦截器解包，应为后端返回的 UserOrderSubmitVo
    // 后端返回的订单号字段可能为 Id（大写）、id 或 orderId，优先使用后端返回的真实值
    const orderId = res && (res.Id || res.id || res.orderId) ? String(res.Id || res.id || res.orderId) : String(Date.now());
    // 后端可能返回 actualPay、amount 或 payAmount
    const payAmount = (res && (res.actualPay || res.amount || res.payAmount)) ? (res.actualPay || res.amount || res.payAmount) : amountNum;
    // 保存返回的订单号，确保支付页能正确读取到（优先使用 query，再退回 sessionStorage）
    try { sessionStorage.setItem('lastOrderId', orderId); } catch (ee) {}
    try { sessionStorage.setItem('lastOrderAmount', String(payAmount)); } catch (ee) {}
    ElMessage.success('订单提交成功，正在进入支付');
    router.push({ name: 'Payment', query: { orderId, amount: String(payAmount), addressId: selectedAddress.value.id } });
  } catch (e) {
    console.error('提交订单失败', e);
    try { console.warn('error response data:', e.response && e.response.data ? e.response.data : null); } catch (ee) {}
    ElMessage.error('提交订单失败，请重试');
  }
};

const formatPhone = (phone = '') => {
  return String(phone).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

onMounted(async () => {
  // 重置购物车商品列表，确保每次刷新都重新获取数据
  cartItems.value = [];
  
  // 如果有预加载的地址数据（来自 BookDetail 或 Cart 的跳转前预取），优先使用以加快渲染
  try {
    const pref = sessionStorage.getItem('prefetchedAddressList');
    if (pref) {
      const parsed = JSON.parse(pref);
      applyAddressData(parsed);
      sessionStorage.removeItem('prefetchedAddressList');
    }
  } catch (e) {
    console.warn('解析预加载地址失败', e);
  }

  // 尝试从sessionStorage中读取checkoutItems（仅作为备用）
  let hasSessionData = false;
  try {
    const raw = sessionStorage.getItem('checkoutItems');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // parsed 可能来自两个来源：BuyNowVo 列表或 UserCartVo.buynows 列表
        // 尝试从 parsed 或同层级对象里读取 activityDiscount / originalTotal
        // 支持两种结构： { buyNows: [...], activityDiscount, originalTotal } 或直接数组并伴随外层字段
        if (parsed.activityDiscount != null || parsed.originalTotal != null) {
          activityDiscount.value = parsed.activityDiscount || null;
          originalTotal.value = parsed.originalTotal || null;
          if (typeof parsed.freight !== 'undefined') freight.value = Number(parsed.freight) || 0;
        } else if (parsed[0] && (parsed[0].activityDiscount != null || parsed[0].originalTotal != null)) {
          activityDiscount.value = parsed[0].activityDiscount || null;
          originalTotal.value = parsed[0].originalTotal || null;
          if (typeof parsed[0].freight !== 'undefined') freight.value = Number(parsed[0].freight) || 0;
        }

        cartItems.value = parsed.map(i => ({
          id: i.id || i.productId,
          productId: i.productId || i.id, // 保留productId字段
          title: i.title || i.bookName || i.productName || '商品',
          description: i.description || i.bookName || i.productDescription || '',
          sku: i.sku || '',
          price: Number(i.price || i.totalPrice || 0) || 0,
          quantity: Number(i.quantity) || Number(i.number) || 1,
          cover: i.cover || i.coverUrl || i.productImage || '/images/new.png'
        }));
        sessionStorage.removeItem('checkoutItems');
        hasSessionData = true;
      } else if (parsed && parsed.buyNows && Array.isArray(parsed.buyNows)) {
        // 支持 parsed 为对象（UserCartVo）
        activityDiscount.value = parsed.activityDiscount || null;
        originalTotal.value = parsed.originalTotal || null;
        if (typeof parsed.freight !== 'undefined') freight.value = Number(parsed.freight) || 0;
        cartItems.value = parsed.buyNows.map(i => ({
          id: i.id || i.productId,
          productId: i.productId || i.id, // 保留productId字段
          title: i.title || i.bookName || i.productName || '商品',
          description: i.description || i.bookName || i.productDescription || '',
          sku: i.sku || '',
          price: Number(i.price || i.totalPrice || 0) || 0,
          quantity: Number(i.quantity) || Number(i.number) || 1,
          cover: i.cover || i.coverUrl || i.productImage || '/images/new.png'
        }));
        sessionStorage.removeItem('checkoutItems');
        hasSessionData = true;
      }
    }
  } catch (e) {
    console.error('解析 checkoutItems 失败', e);
  }

  // 获取source参数，默认为buynow
  const source = route.query.source || 'buynow';
  
  // 处理商品详情页立即购买的情况（优先使用路由参数，即使有session数据也重新请求）
  const bookId = route.query.bookId;
  const qQuantity = route.query.quantity;
  if (bookId) {
    try {
      // 使用新的 GET /user/book/buy 接口获取商品信息和优惠信息
      const params = { productId: Number(bookId), quantity: Number(qQuantity) || 1, source: 'buynow' };
      console.log('请求商品信息:', params);
      const buyRes = await request.get('/user/book/buy', { params });
      console.log('商品信息响应:', buyRes);
      // buyRes should be UserBuyNowVo: { buy, activityDiscount, originalTotal }
      if (buyRes && buyRes.buy) {
        const buy = buyRes.buy;
        if (typeof buyRes.activityDiscount !== 'undefined') activityDiscount.value = buyRes.activityDiscount || null;
        if (typeof buyRes.originalTotal !== 'undefined') originalTotal.value = buyRes.originalTotal || null;
        if (typeof buyRes.freight !== 'undefined') freight.value = Number(buyRes.freight) || 0;
        
        // 填充商品信息到 cartItems，使用UserBuy对象中的productId和quantity
        cartItems.value = [{
          id: buy.productId, // 直接使用buy.productId
          productId: buy.productId, // 同时保存productId字段
          title: buy.bookName || buy.title || buy.productName || '商品',
          description: buy.description || buy.bookDesc || '',
          sku: buy.sku || '',
          price: Number(buy.price || 0) || 0,
          quantity: buy.quantity || Number(qQuantity) || 1, // 优先使用buy.quantity
          cover: buy.coverUrl || buy.productImage || buy.cover || '/images/new.png'
        }];
        console.log('商品信息填充完成:', cartItems.value);
      }
    } catch (e) {
      console.error('拉取商品信息失败', e);
      ElMessage.error('拉取商品信息失败，请稍后重试');
    }
  } else if (!hasSessionData) {
    // 处理购物车结算的情况（仅当没有session数据且没有bookId时）
    const shoppingCartIds = route.query.shoppingCartIds;
    if (shoppingCartIds) {
      try {
        // 使用新的 GET /user/shopping-cart/checkout 接口获取购物车商品信息
        const ids = Array.isArray(shoppingCartIds) ? shoppingCartIds : [shoppingCartIds];
        const params = { shippingAddressIds: ids.map(id => Number(id)), source: 'cart' };
        console.log('请求购物车商品信息:', params);
        const cartRes = await request.get('/user/shopping-cart/checkout', { params });
        console.log('购物车商品信息响应:', cartRes);
        // cartRes should be UserCartVo: { buyNows, activityDiscount, originalTotal }
        if (cartRes && cartRes.buyNows && Array.isArray(cartRes.buyNows)) {
          if (typeof cartRes.activityDiscount !== 'undefined') activityDiscount.value = cartRes.activityDiscount || null;
          if (typeof cartRes.originalTotal !== 'undefined') originalTotal.value = cartRes.originalTotal || null;
          if (typeof cartRes.freight !== 'undefined') freight.value = Number(cartRes.freight) || 0;
          
          // 填充购物车商品信息到 cartItems
          cartItems.value = cartRes.buyNows.map(item => ({
            id: item.id || item.productId,
            title: item.title || item.bookName || item.productName || '商品',
            description: item.description || item.bookName || item.productDescription || '',
            sku: item.sku || '',
            price: Number(item.price || item.totalPrice || 0) || 0,
            quantity: Number(item.quantity) || Number(item.number) || 1,
            cover: item.cover || item.coverUrl || item.productImage || '/images/new.png'
          }));
          console.log('购物车商品信息填充完成:', cartItems.value);
        }
      } catch (e) {
        console.error('拉取购物车商品信息失败', e);
        ElMessage.error('拉取购物车商品信息失败，请稍后重试');
      }
    }
  }

  try {
    await loadAddressList();
    // 加载地址后计算运费
    if (selectedAddress.value && selectedAddress.value.id) {
      await calcShippingCost(selectedAddress.value.id);
    }
  } catch (e) {
    console.error('加载地址列表失败', e);
  }
});
</script>

<style scoped>
/* 全局布局 (保持不变) */
.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f5f5f5;
  padding-bottom: 80px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.section {
  background: #fff;
  margin-top: 20px;
  padding: 20px;
  border-radius: 4px;
}

/* 1. 地址部分样式 (保持不变) */
.address-section {
  padding-bottom: 10px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.header-actions .link {
  color: #666;
  font-size: 14px;
  cursor: pointer;
  margin: 0 5px;
}
.header-actions .link:hover {
  color: #ff5000;
}
.header-actions .divider {
  color: #ccc;
}
.address-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: start;
}
.address-cards-wrap {
  display: block;
}
.address-controls {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  align-items: center;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-top .left {
  display: flex;
  align-items: center;
}
.card-footer {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  pointer-events: none;
}
.card-actions.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.address-detail {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 42px; /* 留出底部操作按钮位置，避免重叠 */
}

.address-phone {
  font-size: 14px;
  color: #999;
  text-align: right;
}

.default-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 13px;
}
.default-indicator i {
  color: #c0a0a0;
  font-size: 16px;
}
.station {
  font-size: 12px;
  color: #999;
}
.address-card.is-active {
  box-shadow: 0 6px 18px rgba(118,75,162,0.08);
  border-color: #764ba2;
}
.btn-expand {
  cursor: pointer;
  color: #666;
}
.address-card {
  box-sizing: border-box;
  height: 140px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  padding: 15px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.address-card:hover {
  border-color: #ff5000;
  box-shadow: 0 0 10px rgba(255, 80, 0, 0.1);
}
.address-card.is-default {
  border: 1px solid #ff5000;
}
.address-detail {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}
.address-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.address-phone {
  font-size: 14px;
  color: #999;
}

/* 2. 中间内容布局 (保持不变) */
.order-content {
  display: flex;
  gap: 20px;
  padding: 0;
  background: transparent;
  align-items: flex-start;
}
.content-left {
  flex: 3;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}
.content-right {
  flex: 1;
  min-width: 300px;
  position: sticky;
  top: 20px;
}



/* 右侧商品表格 (保持不变) */
.order-summary-header {
  background: #f5f5f5;
  padding: 10px 20px;
  font-size: 13px;
  color: #666;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}
.order-summary-header .freight {
  color: #999;
}
.product-table {
  padding: 20px;
}
.table-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #999;
  text-align: right;
}
.table-header .col-name {
  text-align: left;
}
.product-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px dashed #f0f0f0;
  font-size: 14px;
  color: #333;
  text-align: right;
}
.product-info {
  display: flex;
  text-align: left;
}
.thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #eee;
  margin-right: 15px;
}
.info-text .title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 5px;
}
.info-text .desc {
  font-size: 12px;
  color: #999;
}
.order-summary-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}
.package-count {
  margin-left: 10px;
}
.right-info .label {
  margin-right: 20px;
}
.right-info .amount {
  color: #ff5000;
  font-weight: bold;
}
.btn-save {
  background: #ff5000;
  border-color: #ff5000;
  color: #fff;
  height: 36px;
  padding: 6px 18px;
  border-radius: 4px;
}
.btn-save:hover {
  background: #ff6b2a;
  border-color: #ff6b2a;
}
.total-pay {
  margin-left: 20px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.price-highlight {
  color: #ff5000;
  font-size: 20px;
}

/* 3. 金额信息区域 */
.payment-details {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
  height: fit-content;
  max-height: 500px;
  overflow-y: auto;
}
.payment-details h3 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #666;
  height: 48px;
  box-sizing: border-box;
}
.detail-item .price {
  font-weight: bold;
  text-align: right;
  flex-shrink: 0;
  width: 100px;
  color: #333;
}
.detail-item .price.negative {
  color: #4caf50;
  font-size: 12px;
}
.coupon-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 100px;
  justify-content: flex-end;
}
.coupon-value {
  color: #4caf50;
  font-weight: bold;
  text-align: right;
  flex-shrink: 0;
  font-size: 12px;
}
/* 积分抵扣样式 */
.points-item {
  cursor: pointer;
  transition: background-color 0.2s;
}
.points-item:hover:not(.points-disabled) {
  background-color: rgba(0, 0, 0, 0.02);
}
.points-item.points-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.points-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.points-value {
  font-size: 12px;
  color: #999;
}
/* iOS风格开关 */
.points-switch {
  flex-shrink: 0;
}
.switch-track {
  width: 44px;
  height: 24px;
  background-color: #e0e0e0;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.3s;
  cursor: pointer;
}
.switch-track.switch-active {
  background-color: #4caf50;
}
.switch-thumb {
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.switch-track.switch-active .switch-thumb {
  transform: translateX(20px);
}
/* 费用明细分组 */
.detail-item:first-child {
  margin-bottom: 16px;
}
/* 合计区域 */
.total-amount {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid #e0e0e0;
  height: 60px;
  box-sizing: border-box;
}
.total-amount .price {
  font-size: 24px;
  color: #ff5000;
  font-weight: bold;
  text-align: right;
  flex-shrink: 0;
  width: 100px;
}
/* 底部按钮 */
.btn-submit {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 4px;
  background: #ff5000;
  border: none;
  margin-top: 24px;
  font-weight: bold;
}
.btn-submit:hover {
  background: #ff6b2a;
  border-color: #ff6b2a;
}

/* 优惠券区域 */
.coupon-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.coupon-value {
  color: #ff5000;
  font-weight: bold;
  text-align: right;
}
.coupon-arrow {
  transition: transform 0.3s;
  font-size: 12px;
}
.coupon-arrow.rotated {
  transform: rotate(180deg);
}
.coupon-dropdown {
  margin-top: 0;
  margin-bottom: 20px;
  padding: 10px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.coupon-item {
  background: url('/Coupon/C2.jpg') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 8px;
  width: 100%;
  height: 94px;
  padding: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.coupon-select {
  margin-right: 15px;
  z-index: 1;
}
.coupon-content {
  flex: 1;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 70px;
  justify-content: space-between;
}
.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.coupon-amount {
  font-size: 22px;
  font-weight: bold;
  color: #ff5000;
  line-height: 1;
}
.coupon-type {
  font-size: 10px;
  color: #fff;
  background: #ff5000;
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
}
.coupon-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.coupon-expiry {
  font-size: 10px;
  color: #999;
}

/* 禁用的优惠券样式 */
.coupon-item.coupon-disabled {
  filter: grayscale(100%);
  opacity: 0.7;
}
.coupon-item.coupon-disabled .coupon-amount {
  color: #999;
}
.coupon-item.coupon-disabled .coupon-type {
  background: #999;
}
.coupon-item.coupon-disabled .coupon-desc,
.coupon-item.coupon-disabled .coupon-expiry {
  color: #999;
}

/* Address modal form helpers moved into AddressDialog.vue (scoped) */
</style>