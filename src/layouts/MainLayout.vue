<template>
  <div class="main-layout">
    <!-- 1. 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <!-- Logo -->
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">云图书城</span>
        </div>
        
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" active-class="active" exact-active-class="active" @click="onNavClick('/')">首页</router-link>
          
          <!-- 全部书籍 -->
          <router-link to="/category" class="nav-item" active-class="active" exact-active-class="active" @click="onNavClick('/category')">全部书籍</router-link>
          
          <!-- 【新增】特价、新书、专题 -->
          <router-link to="/special-price" class="nav-item" active-class="active" exact-active-class="active" @click="onNavClick('/special-price')">特价</router-link>
          <router-link to="/new-books" class="nav-item" active-class="active" exact-active-class="active" @click="onNavClick('/new-books')">新书</router-link>
          <router-link to="/topics" class="nav-item" active-class="active" exact-active-class="active" @click="onNavClick('/topics')">专题</router-link>
        </nav>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input 
          v-model="searchQuery" 
          placeholder="请输入书名或作者名" 
          clearable 
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="header-right">
        <!-- 客服入口 -->
        <div class="service-entry" @click="handleServiceClick">
          <el-icon size="20"><Headset /></el-icon>
          <span class="service-text">客服</span>
        </div>

        <div class="cart-entry-top" @click="$router.push('/cart')">
          <el-badge :value="cartItemCount" :hidden="cartItemCount === 0" class="cart-badge">
            <el-icon size="20"><ShoppingCart /></el-icon>
          </el-badge>
          <span class="cart-text">购物车</span>
        </div>

        <div class="user-info">
          <el-avatar :src="avatarUrl" size="small" class="clickable-avatar" @click="handleAvatarClick" />
        </div>
      </div>
    </header>

    <!-- 2. 动态内容区域 -->
    <main class="content-wrapper">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.path + '-' + refreshKey" @add-to-cart="addToCart" />
        </transition>
      </router-view>
    </main>

    <!-- 3. 侧边固定购物车入口 -->
    <div class="cart-entry-side" @click="$router.push('/cart')">
      <el-badge :value="cartItemCount" :hidden="cartItemCount === 0" class="cart-badge-side">
        <el-icon size="24"><ShoppingCart /></el-icon>
      </el-badge>
    </div>
    

    <!-- 【新增】全局“回到顶部”组件 -->
    <!-- 放置在这里，确保它在所有子页面之上，且对所有页面生效 -->
    <BackToTop />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ShoppingCart, Headset } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 1. 引入 BackToTop、CartPanel 组件
import BackToTop from '@/components/BackToTop.vue';

const router = useRouter();
const route = useRoute();

// 用于强制重新挂载路由组件（当用户点击已在页面上的导航时触发刷新）
const refreshKey = ref(0);

const cartItems = ref([]);
const searchQuery = ref('');
const avatarUrl = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');
const defaultAvatar = avatarUrl.value;
const currentUser = ref(null);

const loadCurrentUser = () => {
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      currentUser.value = u;
      if (u && u.avatar) avatarUrl.value = u.avatar;
      return;
    }
  } catch (e) {
    // ignore
  }
  currentUser.value = null;
  avatarUrl.value = defaultAvatar;
};

onMounted(() => {
  loadCurrentUser();
  window.addEventListener('user-updated', loadCurrentUser);
});

onBeforeUnmount(() => {
  window.removeEventListener('user-updated', loadCurrentUser);
});

const cartItemCount = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));
const cartTotalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));

const addToCart = (book) => {
  const qty = book.quantity ?? 1;
  const existingItem = cartItems.value.find(item => item.id === book.id);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + qty;
  } else {
    cartItems.value.push({ ...book, quantity: qty });
  }
};

const updateQuantity = (id, change) => {
  const item = cartItems.value.find(item => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) removeFromCart(id);
  }
};

const removeFromCart = (id) => {
  cartItems.value = cartItems.value.filter(item => item.id !== id);
};

const updateCartItems = (newItems) => {
  cartItems.value = newItems;
};

const checkout = () => {
  ElMessage.success(`结算成功！共消费 ¥ ${cartTotalPrice.value.toFixed(2)}`);
  cartItems.value = [];
};

const handleSearch = () => {
  const query = searchQuery.value.trim();
  if (query) {
    router.push({ path: '/search', query: { q: query } });
  }
};

const handleServiceClick = () => {
  ElMessage.info('联系客服：400-123-4567\n在线时间：9:00 - 21:00');
};

const logout = () => {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
  } catch (e) {}
  currentUser.value = null;
  avatarUrl.value = defaultAvatar;
  window.dispatchEvent(new Event('user-updated'));
  ElMessage.success('已退出登录');
  router.push('/');
};

const handleAvatarClick = () => {
  const user = sessionStorage.getItem('currentUser');
  if (!user) {
    ElMessageBox.confirm('未登录，请先登录或注册，是否前往登录？', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login');
    }).catch(() => {});
  } else {
    // 已登录则弹出选择：进入个人中心或退出登录
    ElMessageBox({
      title: '用户',
      message: '选择操作：',
      showCancelButton: true,
      cancelButtonText: '个人中心',
      confirmButtonText: '退出登录',
      type: 'info'
    }).then(() => {
      // 点击 退出登录
      logout();
    }).catch(() => {
      // 点击 个人中心（Cancel）
      router.push('/user');
    });
  }
};

// 监听路由变化，关闭购物车面板
// 监听路由变化（之前用于关闭侧边面板，现为页面跳转无需处理）
watch(() => route.path, () => {});

// 导航点击：若点击的是当前路由，增加 `refreshKey` 强制重新挂载页面组件
const onNavClick = (path) => {
  try {
    if (route.path === path) {
      refreshKey.value = (refreshKey.value || 0) + 1
    }
  } catch (e) { /* ignore */ }
}
</script>

<style scoped>
/* 样式部分保持不变 */
.main-layout {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-left { 
  display: flex; 
  align-items: center; 
  gap: 20px; 
}

.logo {
  font-size: 26px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.logo-text {
  background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 114, 255, 0.3));
  letter-spacing: 1px;
}
.logo:hover { transform: scale(1.05); }

.nav-menu { 
  display: flex; 
  gap: 15px; 
}

.nav-item { 
  text-decoration: none; 
  color: #606266; 
  font-weight: 600; 
  padding: 8px 12px; 
  border-radius: 20px;
  transition: all 0.3s; 
  font-size: 15px;
  white-space: nowrap; 
}
.nav-item:hover { 
  color: #0072ff; 
  background-color: #ecf5ff; 
}
.nav-item.active,
.nav-item.router-link-active,
.nav-item.router-link-exact-active { 
  color: #fff !important; 
  background: linear-gradient(90deg, #0072ff, #00c6ff);
  box-shadow: 0 4px 10px rgba(0, 114, 255, 0.3);
  transform: translateY(-1px);
}

.search-box { 
  flex: 0 0 350px; 
  margin: 0 15px; 
}

.header-right { 
  display: flex; 
  align-items: center; 
  gap: 20px; 
}

.service-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s;
  padding: 6px 10px;
  border-radius: 15px;
}
.service-entry:hover {
  color: #0072ff;
  background-color: #ecf5ff;
}
.service-text {
  font-size: 14px;
}

.user-info { display: flex; align-items: center; gap: 10px; }

.clickable-avatar { cursor: pointer; }

.content-wrapper {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.cart-entry-top { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  cursor: pointer; 
  color: #606266; 
  font-size: 14px; 
  transition: color 0.3s; 
}
.cart-entry-top:hover { color: #0072ff; }
.cart-badge { position: relative; }
.cart-text { font-weight: 500; }

.cart-entry-side { 
  position: fixed; 
  right: 20px; 
  bottom: 100px; 
  width: 50px; 
  height: 50px; 
  background: linear-gradient(135deg, #0072ff, #00c6ff); 
  color: #fff; 
  border-radius: 50%; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  box-shadow: 0 4px 12px rgba(0, 114, 255, 0.4); 
  cursor: pointer; 
  z-index: 999; 
  transition: transform 0.3s, box-shadow 0.3s; 
}
.cart-entry-side:hover { 
  transform: scale(1.1) rotate(10deg); 
  box-shadow: 0 6px 16px rgba(0, 114, 255, 0.6); 
}
.cart-badge-side { position: relative; }

.cart-panel-overlay { 
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0; 
  background-color: rgba(0, 0, 0, 0.5); 
  z-index: 2000; 
  display: flex; 
  justify-content: flex-end; 
}
.cart-panel { 
  width: 400px; 
  max-width: 90vw; 
  height: 100%; 
  background-color: #fff; 
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1); 
  display: flex; 
  flex-direction: column; 
}
.slide-in-enter-active, .slide-in-leave-active { transition: all 0.3s ease; }
.slide-in-enter-from, .slide-in-leave-to { transform: translateX(100%); opacity: 0; }

.cart-header { 
  padding: 20px; 
  border-bottom: 1px solid #ebeef5; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}
.cart-header h3 { margin: 0; font-size: 18px; color: #303133; }
.close-icon { font-size: 20px; color: #909399; cursor: pointer; }
.close-icon:hover { color: #f56c6c; }

.cart-body { flex: 1; overflow-y: auto; padding: 20px; }
.empty-cart { text-align: center; padding-top: 50px; }
.cart-items-list { display: flex; flex-direction: column; gap: 20px; }
.cart-item { display: flex; gap: 15px; padding-bottom: 20px; border-bottom: 1px dashed #ebeef5; }
.cart-item:last-child { border-bottom: none; }
.cart-item-cover { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.cart-item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }

.cart-item-title { 
  margin: 0; 
  font-size: 14px; 
  color: #303133; 
  font-weight: 500; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  line-clamp: 2; 
  -webkit-box-orient: vertical; 
  overflow: hidden; 
}
.cart-item-price { margin: 5px 0 0; font-size: 14px; color: #f56c6c; font-weight: bold; }
.cart-item-quantity { display: flex; align-items: center; gap: 10px; }
.remove-item-icon { font-size: 18px; color: #909399; cursor: pointer; align-self: flex-start; }
.remove-item-icon:hover { color: #f56c6c; }

.cart-footer { 
  padding: 20px; 
  border-top: 1px solid #ebeef5; 
  background-color: #fafafa; 
}
.cart-total { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 15px; 
  font-size: 16px; 
  color: #606266; 
}
.total-price { font-size: 20px; color: #f56c6c; font-weight: bold; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>