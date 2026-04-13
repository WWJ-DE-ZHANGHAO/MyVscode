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

    <!-- 2. 中间内容：配送方式 + 商品清单 -->
    <div class="section order-content">
      <div class="content-left">
        <!-- 左侧：配送方式 (修改版) -->
        <div class="delivery-box">
          <!-- 修改点：保留“配送时间”文字标签，但内部替换为快递公司选择 -->
          <div class="delivery-time">
            <span class="label">运输方式</span>
              <!-- 修改点：这里改为运费模板下拉框 -->
              <el-select v-model="selectedShippingTemplateId" placeholder="请选择运费方式" size="small" style="width: 280px;" @change="(val) => calcShippingCost(val, selectedAddress && selectedAddress.id)">
                <el-option v-for="tpl in shippingTemplates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
              </el-select>
          </div>
          
          <!-- 修改点：调整了下方的文字提示，去掉了“快递说明”链接 -->
          <div class="delivery-tip">
            <span class="date-highlight">{{ currentDate }}</span> 前付款，预计 
            <span class="date-highlight">{{ estimateDate }}</span>（周日） 送达
          </div>
          <div style="margin-top:8px;font-size:13px;color:#666">已选运费: <span style="color:#ff5000">¥{{ freight.toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="content-right">
        <!-- 右侧：商品清单与汇总 (保持不变) -->
        <div class="order-summary-header">
          <span>以下商品 预计{{ estimateDate }}送达</span>
          <span class="freight">运费:0.00</span>
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
          <div class="right-info">
              <span class="label">商品金额: <span class="amount">{{ displayedOriginalTotal.toFixed(2) }}</span></span>
              <span v-if="displayedDiscount > 0" class="label">优惠: <span class="amount">-{{ displayedDiscount.toFixed(2) }}</span></span>
              <span class="label">运费: <span class="amount">{{ freight.toFixed(2) }}</span></span>
              <span class="total-pay">店铺合计: <span class="price-highlight">¥{{ finalPayAmount.toFixed(2) }}</span></span>
            </div>
        </div>
      </div>
    </div>

    <!-- 3. 底部悬浮结算栏 (保持不变) -->
    <div class="bottom-bar">
      <div class="bar-left">
        <div class="send-to">
          <span class="label">寄送至:</span>
          <span class="value" v-if="selectedAddress"> 
            {{ selectedAddress.fullLocation }} {{ selectedAddress.detailAddress }} 
          </span>
        </div>
        <div class="contact-info" v-if="selectedAddress">
          {{ selectedAddress.consignee }} {{ formatPhone(selectedAddress.phone) }}
        </div>
      </div>
      <div class="bar-right">
          <div class="total-info">
          <span class="count">共{{ totalQuantity }}件商品</span>
          <span class="pay-amount">实付: <span class="symbol">¥</span><span class="number">{{ finalPayAmount.toFixed(2) }}</span></span>
          <span class="freight-tiny">(含运费{{ freight.toFixed(2) }}元)</span>
        </div>
        <div class="action-area">
          <div class="countdown">热销品订单请在 <span>2小时</span> 内完成支付</div>
          <el-button type="danger" class="btn-pay" @click="handlePay">去支付</el-button>
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
const selectedShippingTemplateId = ref(null);
const shippingTemplates = ref([]);
const freight = ref(0); // 运费金额
const activityDiscount = ref(null); // 优惠金额（后端可能返回 null）
const originalTotal = ref(null); // 后端返回的商品总价（可能用于展示）
const hoveredCardId = ref(null);
const activeCardId = ref(null);
const expanded = ref(false);
const showAddressModal = ref(false);
const editingAddress = ref(null);
const visibleAddresses = computed(() => (expanded.value ? addressList.value : addressList.value.slice(0, 4)));

const toggleExpand = () => { expanded.value = !expanded.value; };

const switchRegion = () => { ElMessage.info('切换配送地区（占位）'); };

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

// 加载运费模板列表
const loadShippingTemplates = async () => {
  try {
    const res = await request.get('/user/shipping-template/list');
    if (Array.isArray(res)) {
      // 保证每项至少有 id/name
      shippingTemplates.value = res.map(t => ({ id: t.id, name: t.name || t.templateName || t.title || (`模板-${t.id}`), raw: t }));
    } else {
      shippingTemplates.value = [];
    }
  } catch (e) {
    console.error('加载运费模板失败', e);
    shippingTemplates.value = [];
  }
};

// 计算运费：发送 shippingTemplateId + addressBookId，后端返回金额
const calcShippingCost = async (shippingTemplateId, addressBookId) => {
  if (!shippingTemplateId || !addressBookId) {
    freight.value = 0;
    return;
  }
  try {
    // 后端映射为 GET /cost，使用 query 参数
    const params = { shippingTemplateId: Number(shippingTemplateId), addressBookId: Number(addressBookId) };
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
  const v = Number(displayedOriginalTotal.value) - Number(displayedDiscount.value) + Number(freight.value || 0);
  return v;
});

const selectAddress = async (addr) => {
  selectedAddress.value = addr;
  // 重新计算运费（若已选择运费模板）
  if (selectedShippingTemplateId.value && selectedAddress.value && selectedAddress.value.id) {
    await calcShippingCost(selectedShippingTemplateId.value, selectedAddress.value.id);
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
    const source = route.query.source || 'detail';
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

    // 购物车下单时，Cart 页面应已把选中的购物车 id 列表存在 sessionStorage
    let shoppingCartIds = null;
    try {
      const raw = sessionStorage.getItem('checkoutShoppingCartIds');
      if (raw) shoppingCartIds = JSON.parse(raw);
    } catch (e) {
      shoppingCartIds = null;
    }

    // 只包含存在值的字段，避免向后端发送 explicit null/undefined 导致校验失败
    const payload = { source };
    // addressBookId 在后端为 Long 类型，确保以数字形式发送
    payload.addressBookId = Number(selectedAddress.value.id);
    payload.estimatedDeliveryTime = estimated;
    if (selectedShippingTemplateId.value) payload.shippingTemplateId = Number(selectedShippingTemplateId.value);
    payload.consigneeName = selectedAddress.value.consignee || selectedAddress.value.receiverName || '';
    payload.phone = selectedAddress.value.phone || '';
    // 后端新接口要求：actualPay(实付)、originalTotal(原价)、activityDiscount(优惠)
    payload.actualPay = amountNum;
    if (originalTotal.value != null) payload.originalTotal = Number(originalTotal.value);
    if (activityDiscount.value != null) payload.activityDiscount = Number(activityDiscount.value);
    // 包含运费字段（后端实体已准备好接收 freight）
    if (freight.value != null) payload.freight = Number(freight.value);
    if (source === 'buyNow') {
      // 优先从预加载的 checkoutItems（UserBuyNowVo 列表）获取 productId/quantity
      let buyNowItems = null;
      try {
        const raw = sessionStorage.getItem('checkoutItems');
        if (raw) buyNowItems = JSON.parse(raw);
      } catch (e) { buyNowItems = null; }

      if (Array.isArray(buyNowItems) && buyNowItems.length > 0) {
        const it = buyNowItems[0];
        payload.productId = Number(it.productId || it.id || it.productId);
        payload.quantity = Number(it.quantity || it.number || 1);
      } else if (route.query.bookId) {
        payload.productId = Number(route.query.bookId);
        if (route.query.quantity) payload.quantity = Number(route.query.quantity);
      } else if (Array.isArray(cartItems.value) && cartItems.value.length > 0) {
        const it = cartItems.value[0];
        payload.productId = Number(it.id || it.productId);
        payload.quantity = Number(it.quantity || it.number || 1);
      } else {
        ElMessage.error('缺少商品信息，无法提交订单');
        return;
      }
    } else if (Array.isArray(shoppingCartIds) && shoppingCartIds.length > 0) {
      // 购物车下单：传递购物车 id 列表（确保为数字数组）
      payload.shoppingCartIds = shoppingCartIds.map(id => Number(id));
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
  // 处理预加载的运费模板
  try {
    const prefTpl = sessionStorage.getItem('prefetchedShippingTemplates');
    if (prefTpl) {
      const parsed = JSON.parse(prefTpl);
      shippingTemplates.value = Array.isArray(parsed) ? parsed.map(t => ({ id: t.id, name: t.name || t.templateName || t.title || (`模板-${t.id}`), raw: t })) : [];
      sessionStorage.removeItem('prefetchedShippingTemplates');
    }
  } catch (e) {
    console.warn('解析预加载运费模板失败', e);
  }
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
          id: i.id || i.productId || i.productId,
          title: i.title || i.bookName || i.productName || '商品',
          description: i.description || i.bookName || i.productDescription || '',
          sku: i.sku || '',
          price: Number(i.price || i.totalPrice || 0) || 0,
          quantity: Number(i.quantity) || Number(i.number) || 1,
          cover: i.cover || i.coverUrl || i.productImage || '/images/new.png'
        }));
        sessionStorage.removeItem('checkoutItems');
        return;
      }
      // 支持 parsed 为对象（UserCartVo）
      if (parsed && parsed.buyNows && Array.isArray(parsed.buyNows)) {
        activityDiscount.value = parsed.activityDiscount || null;
        originalTotal.value = parsed.originalTotal || null;
        if (typeof parsed.freight !== 'undefined') freight.value = Number(parsed.freight) || 0;
        cartItems.value = parsed.buyNows.map(i => ({
          id: i.id || i.productId,
          title: i.title || i.bookName || i.productName || '商品',
          description: i.description || i.bookName || i.productDescription || '',
          sku: i.sku || '',
          price: Number(i.price || i.totalPrice || 0) || 0,
          quantity: Number(i.quantity) || Number(i.number) || 1,
          cover: i.cover || i.coverUrl || i.productImage || '/images/new.png'
        }));
        sessionStorage.removeItem('checkoutItems');
        return;
      }
    }
  } catch (e) {
    console.error('解析 checkoutItems 失败', e);
  }

  const bookId = route.query.bookId;
  const qQuantity = route.query.quantity;
  if (bookId) {
    try {
      // 请求商品详情并尝试调用后端 /buy 获取 originalTotal 与 activityDiscount
      const res = await request.get(`/user/book/${bookId}`);
      // 先把商品信息填充到 cartItems
      const price = Number(res.price || res.salePrice || 0);
      cartItems.value = [{
        id: res.id || bookId,
        title: res.bookName || res.title || res.productName || '商品',
        description: res.description || res.bookDesc || '',
        sku: res.sku || '',
        price,
        quantity: Number(qQuantity) || 1,
        cover: res.coverUrl || res.productImage || res.cover || '/images/new.png'
      }];
      try {
        const buyPayload = { productId: Number(bookId), quantity: Number(qQuantity) || 1 };
        const buyRes = await request.post('/user/book/buy', buyPayload);
        // buyRes should be UserBuyNowVo: { buy, activityDiscount, originalTotal }
        if (buyRes) {
          if (typeof buyRes.activityDiscount !== 'undefined') activityDiscount.value = buyRes.activityDiscount || null;
          if (typeof buyRes.originalTotal !== 'undefined') originalTotal.value = buyRes.originalTotal || null;
          if (typeof buyRes.freight !== 'undefined') freight.value = Number(buyRes.freight) || 0;
        }
      } catch (e) {
        // 不阻塞页面，打印以便排查
        console.warn('调用 /user/book/buy 失败', e);
      }
    } catch (e) {
      console.error('拉取商品信息失败', e);
    }
  }

  try {
    await loadAddressList();
  } catch (e) {
    console.error('加载地址列表失败', e);
  }
  try {
    await loadShippingTemplates();
    // 如果还未选择模板，默认选第一个并尝试计算运费
    if (!selectedShippingTemplateId.value && shippingTemplates.value.length > 0) {
      selectedShippingTemplateId.value = shippingTemplates.value[0].id;
      if (selectedAddress.value && selectedAddress.value.id) {
        await calcShippingCost(selectedShippingTemplateId.value, selectedAddress.value.id);
      }
    }
  } catch (e) {
    console.warn('加载运费模板失败或计算运费失败', e);
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
}
.content-left {
  flex: 0 0 288px;
  max-width: 288px;
}
.content-right {
  flex: 3;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

/* 左侧配送框 (保持不变) */
.delivery-box {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  width: 288px;
  height: 264px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.delivery-time {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.delivery-time .label {
  margin-right: 10px;
  color: #333;
  font-size: 14px;
}
.delivery-tip {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}
.date-highlight {
  color: #ff5000;
  font-weight: bold;
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

/* 3. 底部悬浮栏 (保持不变) */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: #fff;
  border-top: 1px solid #e4e4e4;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
.bottom-bar > div {
  width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.bar-left {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}
.bar-left .label {
  color: #999;
  margin-right: 5px;
}
.contact-info {
  margin-left: 20px;
  padding-left: 20px;
  border-left: 1px solid #eee;
}
.bar-right {
  display: flex;
  align-items: center;
}
.total-info {
  text-align: right;
  margin-right: 20px;
}
.total-info .count {
  display: block;
  font-size: 12px;
  color: #999;
}
.total-info .pay-amount {
  font-size: 16px;
  color: #ff5000;
  font-weight: bold;
}
.total-info .symbol {
  font-size: 14px;
}
.total-info .number {
  font-size: 24px;
  margin-left: 2px;
}
.total-info .freight-tiny {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}
.action-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.countdown {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
  text-align: right;
}
.countdown span {
  color: #ff5000;
}
.btn-pay {
  width: 140px;
  height: 40px;
  font-size: 16px;
  border-radius: 2px;
  background: #ff5000;
  border: none;
}

/* Address modal form helpers moved into AddressDialog.vue (scoped) */
</style>