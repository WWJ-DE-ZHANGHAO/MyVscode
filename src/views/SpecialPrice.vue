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
        src="/images/SpecialPrice.png" 
        alt="极价书屋 - 精品图书特价" 
        class="banner-img"
        @load="bannerLoaded = true"
        @error="bannerLoaded = false"
      />
    </div>

    <!-- 2. 特价书分类展示区 -->
    <div class="category-sections">
      <div 
        v-for="(category, index) in specialCategories" 
        :key="category.id" 
        class="category-block"
      >
        <!-- 【修改点 1】标题样式改为居中大色块 -->
        <div class="category-header-bar">
          <h2 class="category-title">
            <span class="title-icon">{{ category.icon }}</span>
            {{ category.name }}
            <span class="sub-title"> (严选 {{ category.books.length }} 本)</span>
          </h2>
          <!-- 可选：如果您想加“更多”按钮，可以取消下面注释 -->
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BookCard from '@/components/BookCard.vue';
//import mockData from '@/mock/bookData'; 

const bannerLoaded = ref(true);

const specialCategories = ref([
  {
    id: 'children', name: '少儿特价', icon: '🧸',
    books: computed(() => mockData.books.filter(b => b.category === '少儿').slice(0, 8))
  },
  {
    id: 'sci-fi', name: '科幻特价', icon: '🚀',
    books: computed(() => mockData.books.filter(b => b.category === '科幻').slice(0, 8))
  },
  {
    id: 'mystery', name: '推理特价', icon: '🕵️',
    books: computed(() => mockData.books.filter(b => b.category === '推理').slice(0, 8))
  },
  {
    id: 'literature', name: '文学特价', icon: '📚',
    books: computed(() => mockData.books.filter(b => b.category === '文学').slice(0, 8))
  }
]);
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

/* --- 分类区块 --- */
.category-sections {
  max-width: 1200px; /* 与 Banner 宽度一致 */
  margin: 0 auto;
  padding: 0 20px;
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
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.category-title {
  font-size: 28px;
  color: #fff;
  margin: 0;
  padding-left: 40px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
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