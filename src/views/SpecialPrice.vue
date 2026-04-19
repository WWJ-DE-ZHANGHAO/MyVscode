<!-- src/views/SpecialPrice.vue -->
<template>
  <div class="special-price-page">
    <!-- 1. 顶部横幅图 -->
    <div class="page-banner">
      <div class="banner-placeholder" v-if="!bannerLoaded">
        <h1>🔥 限时特价专区 🔥</h1>
        <p>精选好书低至 5 折，全场满 99 包邮</p>
      </div>
      <img 
        v-else
        src="/images/SpecialPrice.jpeg" 
        alt="极价书屋 - 精品图书特价" 
        class="banner-img"
        @load="bannerLoaded = true"
        @error="bannerLoaded = false"
      />
    </div>

    <!-- 2. 主内容区 -->
    <div class="main-content">
      <!-- 左侧：分类展示区 -->
      <div class="content-left">
        <div class="special-error" v-if="loadError">
          <div class="err-msg">加载特价商品失败：{{ loadErrorMsg }}</div>
          <el-button size="small" type="primary" @click="loadSpecial">重试</el-button>
        </div>
        <div 
          v-for="(category, index) in specialCategories" 
          :key="category.id" 
          class="category-block"
          :id="`category-${category.id || category.name.replace(/\s+/g, '-').toLowerCase()}`"
        >
          <!-- 【修改点 1】标题样式改为居中大色块 -->
          <div class="category-header-bar">
            <h2 class="category-title">
              <span class="title-icon">{{ category.icon }}</span>
              {{ category.name }}
            </h2>
            <!-- 可选：如果您想加"更多"按钮，可以取消下面注释 -->
            <!-- <a href="#" class="more-link">更多 >></a> -->
          </div>
          
          <div class="book-grid">
            <BookCard 
              v-for="book in category.books" 
              :key="book.id" 
              :book="book" 
              @add-to-cart="$emit('add-to-cart', book)"
            />
          </div>
          
          <div v-if="category.books.length === 0" class="empty-category">
            暂无该类特价书籍，敬请期待！
          </div>
        </div>
      </div>
      
      <!-- 右侧：分类导航 -->
      <div class="content-right">
        <CategoryNavigation 
          title="分类导航"
          :categories="specialCategories"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import BookCard from '@/components/BookCard.vue';
import CategoryNavigation from '@/components/CategoryNavigation.vue';
import request from '@/utils/request';
import { getCategoryName, categories, loadCategories } from '@/composables/useCategories'

const bannerLoaded = ref(true);

// 分类名称使用全局缓存：getCategoryName(id)

// 原始特价商品列表
const specialList = ref([]);

// 分类图标映射
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    '少儿': '🧸', '科幻': '🚀', '推理': '🕵️', '文学': '📚',
    '历史': '📜', '经管': '💼', '励志': '💪', '青春': '🌸',
    '动漫': '🎨', '中小学用书': '🎒', '社科': '🌍', '其他': '📦'
  };
  return iconMap[categoryName] || '📦';
};

// 根据 categoryId 分组
const specialCategories = computed(() => {
  const map = new Map();
  (specialList.value || []).forEach(p => {
    const cid = p.categoryId != null ? String(p.categoryId) : '0';
    if (!map.has(cid)) map.set(cid, []);
    map.get(cid).push(p);
  });
  // 转换为数组，保持稳定顺序（按销量和id应该已由后端排序）
  return Array.from(map.entries()).map(([cid, items]) => {
    const nameFromMap = getCategoryName(cid)
    const fallbackFromList = (categories.value || []).find(c => String(c.id) === String(cid))
    const name = nameFromMap || (fallbackFromList && fallbackFromList.name) || `分类 ${cid}`
    const icon = getCategoryIcon(name);
    return { id: cid, name, icon, books: items.map(normalizeBook) }
  });
});

const normalizeBook = (p) => {
  const cover = p.coverUrl || p.cover || '';
  return {
    id: p.id,
    title: p.bookName || p.title || '',
    cover: cover && cover.startsWith('/') ? cover : (cover || '/images/new.png'),
    price: p.price || 0,
    description: p.description || p.detailContent || ''
  };
}

const loadError = ref(false)
const loadErrorMsg = ref('')

const loadSpecial = async () => {
  loadError.value = false
  loadErrorMsg.value = ''
  try {
    const res = await request.get('/user/book/special')
    // request util may unwrap; ensure array
    const arr = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.list ? res.list : []))
    specialList.value = (arr || [])
  } catch (e) {
    console.error('加载特价商品失败', e)
    loadError.value = true
    try {
      const status = e?.response?.status
      const data = e?.response?.data
      loadErrorMsg.value = status ? `${status} ${data && (data.msg || data.message) ? (data.msg || data.message) : ''}` : (e.message || '请求失败')
      ElMessage.error(`加载特价商品失败: ${loadErrorMsg.value}`)
      console.error('response:', e.response)
    } catch (inner) {
      loadErrorMsg.value = e.message || '请求失败'
    }
    specialList.value = []
  }
}

onMounted(async () => {
  // ensure categories are loaded (in case app-level preload didn't finish)
  if (!categories.value || categories.value.length === 0) {
    try { await loadCategories() } catch (e) { /* ignore */ }
  }
  loadSpecial();
});
</script>

<style scoped>
.special-price-page {
  padding-bottom: 60px;
  min-height: 100vh;
  background-color: #f3e5f5; /* 淡紫色背景 */
}

/* --- 顶部横幅 --- */
.page-banner {
  width: 100%;
  max-width: 1200px;
  height: 500px;
  margin: 0 auto 40px auto;
  overflow: hidden;
  /* 【修改点 2】去掉圆角 */
  border-radius: 0;
  box-shadow: none;
  background-color: transparent;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ab47bc 0%, #ffa726 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  box-sizing: border-box;
  padding: 20px;
}
.banner-placeholder h1 { font-size: 42px; margin: 0 0 15px 0; letter-spacing: 2px; }
.banner-placeholder p { font-size: 18px; opacity: 0.9; }

/* --- 主内容区 --- */
.main-content {
  max-width: 1400px; /* 与 Banner 宽度一致 */
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 30px;
}

.content-left {
  flex: 1;
}

.content-right {
  width: 280px;
  flex-shrink: 0;
}

/* --- 分类区块 --- */
.category-sections {
  width: 100%;
}

.category-block {
  margin-bottom: 60px;
  background: #ffffff;
  padding: 0;
  /* 【修改点 2】去掉圆角 */
  border-radius: 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  overflow: hidden;
}

.category-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

/* 【修改点 1】新增：居中标题栏样式 (特价页用深紫色) */
.category-header-bar {
  width: 100%;
  background: linear-gradient(90deg, #ba68c8 0%, #8e24aa 100%);
  padding: 15px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.category-title {
  font-size: 28px;
  color: #fff;
  margin: 0;
  padding: 0 20px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  justify-content: center;
}

.sub-title {
  font-size: 14px;
  color: #f3e5f5;
  font-weight: normal;
  margin-left: 10px;
}

.more-link {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  padding-right: 40px;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.more-link:hover {
  opacity: 1;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 25px 20px;
  padding: 30px;
}

.special-error { padding: 18px; text-align: center; background: #fff6f6; border: 1px solid #ffd6d6; margin: 10px 30px; border-radius: 6px }
.special-error .err-msg { color: #d9534f; margin-bottom: 8px }

.empty-category {
  text-align: center;
  padding: 40px;
  color: #4a148c;
  font-size: 16px;
  background: #f3e5f5;
  /* 【修改点 2】去掉圆角 */
  border-radius: 0;
}

/* 响应式调整 */
@media (max-width: 1300px) { .book-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 900px) { 
  .book-grid { grid-template-columns: repeat(3, 1fr); } 
  .category-title { font-size: 24px; padding-left: 20px; }
  .more-link { padding-right: 20px; }
  .banner-placeholder h1 { font-size: 28px; }
}
@media (max-width: 768px) { 
  .book-grid { grid-template-columns: repeat(2, 1fr); } 
  .category-block { padding: 0; }
  .page-banner { height: 300px; }
}
@media (max-width: 480px) { .book-grid { grid-template-columns: repeat(1, 1fr); } }
</style>