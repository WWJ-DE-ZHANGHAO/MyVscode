<!-- src/views/NewBooks.vue -->
<template>
  <div class="new-books-page">
    <!-- 1. 顶部横幅图 -->
    <div class="page-banner">
      <div class="banner-placeholder" v-if="!bannerLoaded">
        <h1>📚 新书抢鲜看 📚</h1>
        <p>2026·3 月刊 | 小说/文学/童书/社科/经管/励志/青春/动漫/中小学用书</p>
      </div>
      <img 
        v-else
        src="/images/new.png" 
        alt="新书抢鲜看 - 2026 年 3 月刊" 
        class="banner-img"
        @load="bannerLoaded = true"
        @error="bannerLoaded = false"
      />
    </div>

    <!-- 2. 动态分类书籍展示区 -->
    <div v-if="newBooks.length === 0" class="empty-new-books">
      <div class="empty-content">
        <el-icon size="60"><Sugar /></el-icon>
        <h2>暂时没有新书上架</h2>
        <p>我们正在努力筹备更多精彩的新书，敬请期待！</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
    
    <div v-else class="category-sections">
      <div 
        v-for="category in dynamicCategories" 
        :key="category.name" 
        class="category-block"
      >
        <div class="category-header-bar">
          <h2 class="category-title">
            <span class="title-icon">{{ getCategoryIcon(category.name) }}</span>
            {{ category.name }}
          </h2>
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
          暂无该类新书，敬请期待！
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BookCard from '@/components/BookCard.vue';
import request from '@/utils/request';
//import mockData from '@/mock/bookData'; 
import { getCategoryName, categories, loadCategories } from '@/composables/useCategories';
import { Sugar } from '@element-plus/icons-vue';

const bannerLoaded = ref(true);
const newBooks = ref([]);

// 分类名称使用全局缓存：getCategoryName(id)

const getCategoryIcon = (categoryName) => {
  const iconMap = {
    '少儿': '🧸', '科幻': '🚀', '推理': '🕵️', '文学': '📚',
    '历史': '📜', '经管': '💼', '励志': '💪', '青春': '🌸',
    '动漫': '🎨', '中小学用书': '🎒', '社科': '🌍', '其他': '📦'
  };
  return iconMap[categoryName] || '📦';
};

const dynamicCategories = computed(() => {
  // 如果书籍使用 categoryId，则映射为分类名
  const books = newBooks.value || [];
  const group = {};
  books.forEach(b => {
    let catName = '其他'
    if (b.categoryId) {
      catName = getCategoryName(b.categoryId) || (categories.value || []).find(c => String(c.id) === String(b.categoryId))?.name || `分类 ${b.categoryId}`
    } else if (b.category) {
      catName = b.category
    }
    if (!group[catName]) group[catName] = [];
    group[catName].push(b);
  });
  return Object.keys(group).map(name => ({ name, books: group[name] }));
});

// categories are loaded globally at app start

const normalizeBook = (p) => {
  const cover = p.coverUrl || p.cover || '';
  return {
    id: p.id,
    title: p.bookName || p.title || '',
    cover: cover || '/images/new.png',
    price: p.price || 0,
    description: p.description || p.detailContent || '',
    categoryId: p.categoryId
  };
};

const loadNewBooks = async () => {
  try {
    const res = await request.get('/user/book/new');
    const arr = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.list ? res.list : []));
    const books = (arr || []).map(normalizeBook);
    newBooks.value = books;
  } catch (e) {
    console.warn('加载新书失败', e);
    newBooks.value = [];
  }
}

onMounted(async () => {
  if (!categories.value || categories.value.length === 0) {
    try { await loadCategories() } catch (e) { /* ignore */ }
  }
  loadNewBooks();
});
</script>

<style scoped>
.new-books-page {
  padding-bottom: 60px;
  min-height: 100vh;
  background-color: #fff8e1; /* 暖黄色背景 */
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
  background: linear-gradient(135deg, #ffe082 0%, #ffca28 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  box-sizing: border-box;
  padding: 20px;
}
.banner-placeholder h1 { font-size: 48px; margin: 0 0 15px 0; letter-spacing: 4px; font-weight: 800; }
.banner-placeholder p { font-size: 18px; opacity: 0.9; }

/* --- 分类区块 --- */
.category-sections {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.category-block {
  margin-bottom: 60px;
  background: #ffffff;
  padding: 0; /* 去掉内边距，让标题栏贴顶 */
  /* 【修改点 2】去掉圆角 */
  border-radius: 0; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  overflow: hidden; /* 确保内部元素不溢出 */
}

.category-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

/* 【修改点 1】新增：居中标题栏样式 */
.category-header-bar {
  width: 100%;
  /* 使用与您截图类似的粉紫色渐变或纯色 */
  background: linear-gradient(90deg, #ffd569 0%, #fef7c8 100%); 
  padding: 15px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.category-title {
  font-size: 28px;
  color: #fff; /* 标题文字变白 */
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
  color: #fce4ec; /* 副标题浅粉色 */
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
  padding: 30px; /* 给书籍网格加内边距 */
}

.empty-category {
  text-align: center;
  padding: 40px;
  color: #5d4037;
  font-size: 16px;
  background: #fff3e0;
  /* 【修改点 2】去掉圆角 */
  border-radius: 0; 
}

/* 无新书时的提示样式 */
.empty-new-books {
  width: 100%;
  max-width: 1400px;
  margin: 40px auto;
  padding: 60px 20px;
  text-align: center;
  background: linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-content h2 {
  font-size: 32px;
  font-weight: 800;
  color: #e65100;
  margin: 0;
}

.empty-content p {
  font-size: 18px;
  color: #606266;
  margin: 0;
}

.empty-content .el-button {
  margin-top: 10px;
  font-size: 16px;
  padding: 12px 24px;
}

/* 响应式调整 */
@media (max-width: 1300px) { .book-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 900px) { 
  .book-grid { grid-template-columns: repeat(3, 1fr); } 
  .category-title { font-size: 24px; padding-left: 20px; }
  .more-link { padding-right: 20px; }
  .banner-placeholder h1 { font-size: 36px; }
}
@media (max-width: 768px) { 
  .book-grid { grid-template-columns: repeat(2, 1fr); } 
  .category-block { padding: 0; }
  .page-banner { height: 300px; }
  .banner-placeholder h1 { font-size: 28px; }
}
@media (max-width: 480px) { .book-grid { grid-template-columns: repeat(1, 1fr); } }
</style>