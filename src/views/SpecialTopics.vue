<!-- src/views/SpecialTopics.vue -->
<template>
  <div class="special-topics-page">
    <!-- 顶部 Banner -->
    <div class="page-banner">
      <div class="banner-content" v-if="!bannerLoaded">
        <h1>🎯 精选专题书单</h1>
        <p>从考试冲刺到艺术修养，为您定制专属阅读计划</p>
      </div>
      <img 
        v-else
        src="/images/encourage.png" 
        alt="精选专题书单" 
        class="banner-img"
        @load="bannerLoaded = true"
        @error="bannerLoaded = false"
      />
    </div>

    <!-- 专题卡片流 -->
    <div class="topics-container">
      <div 
        v-for="topic in topicList" 
        :key="topic.id" 
        class="topic-card"
        :style="{ '--theme-color': topic.color }"
      >
        <!-- 左侧：固定尺寸专题封面 -->
        <div class="topic-cover-section">
          <div class="cover-image-wrapper">
            <img :src="topic.coverImage" :alt="topic.title" class="cover-img" />
            <div class="overlay-badge">{{ topic.tag }}</div>
          </div>
          <div class="topic-info">
            <h2 class="topic-title">{{ topic.title }}</h2>
            <p class="topic-desc">{{ topic.description }}</p>
            <div class="topic-meta">
              <span class="meta-item">📚 收录 {{ topic.books.length }} 本</span>
              <span class="meta-item">🔥 热度 {{ topic.hotness }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：书籍预览列表 -->
        <div class="topic-books-section">
          <div class="books-scroll-container">
            <BookCard 
              v-for="book in topic.books" 
              :key="book.id" 
              :book="book" 
              :compact="true" 
              @add-to-cart="$emit('add-to-cart', book)"
              class="preview-book-card"
            />
          </div>
          <div class="scroll-hint" v-if="topic.books.length > 4">
            滑动查看更多
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BookCard from '@/components/BookCard.vue';
import mockData from '@/mock/bookData'; 

const bannerLoaded = ref(true);

// 模拟专题数据
const topicList = computed(() => [
  {
    id: 'kaoyan',
    title: '考研上岸·决胜千里',
    tag: '备考必备',
    color: '#3498db',
    hotness: '98w+',
    description: '涵盖政治、英语、数学及专业课核心教材。名师推荐，考点全覆盖，助你一战成硕。',
    coverImage: '/images/Graduate student.png',
    books: mockData.books.filter(b => ['中小学用书', '社科', '经管'].includes(b.category)).slice(0, 6)
  },
  {
    id: 'gaokao',
    title: '高考冲刺·金榜题名',
    tag: '高中必刷',
    color: '#e74c3c',
    hotness: '120w+',
    description: '五年高考三年模拟系列，真题解析，学霸笔记。紧扣新课标，精准提分。',
    coverImage: '/images/gaokao.png',
    books: mockData.books.filter(b => b.category === '中小学用书').slice(0, 6)
  },
  {
    id: 'music',
    title: '音乐殿堂·听觉盛宴',
    tag: '艺术修养',
    color: '#9b59b6',
    hotness: '45w+',
    description: '从乐理基础到大师传记，从古典鉴赏到流行文化。滋养心灵，提升艺术感知力。',
    coverImage: '/images/music.jpg',
    books: mockData.books.filter(b => ['文学', '历史', '其他'].includes(b.category)).slice(0, 6)
  }
]);
</script>

<style scoped>
.special-topics-page {
  padding-bottom: 80px;
  min-height: 100vh;
  background-color: #2c3e50; 
  background-image: radial-gradient(#34495e 1px, transparent 1px);
  background-size: 20px 20px;
}

/* --- 顶部 Banner --- */
.page-banner {
  width: 100%;
  max-width: 1400px;
  height: 600px; 
  margin: 0 auto 60px auto;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --- 专题容器 --- */
.topics-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 70px;
}

/* --- 专题卡片 --- */
.topic-card {
  display: flex;
  background: #fff;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
  transition: transform 0.4s ease;
  min-height: 450px;
  position: relative;
}

.topic-card:hover {
  transform: translateY(-8px);
}

/* 左侧：固定尺寸专题封面 */
.topic-cover-section {
  width: 480px; /* 固定宽度 */
  background: #f8f9fa;
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 6px solid var(--theme-color);
  position: relative;
  z-index: 2;
}

/* 图片容器 */
.cover-image-wrapper {
  width: 100%;
  height: 310px; /* 固定高度 */
  background: #ddd;
  overflow: hidden;
  border-radius: 0;
  box-shadow: 6px 6px 20px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

/* 【关键修复】图片强制固定尺寸，防止被挤压变形 */
.cover-img {
  width: 480px !important; /* 强制宽度 */
  height: 310px !important; /* 强制高度 */
  object-fit: cover; /* 裁剪显示，保持比例 */
}

.overlay-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: var(--theme-color);
  color: #fff;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 800;
  border-radius: 0;
}

.topic-info {
  text-align: left;
}

.topic-title {
  font-size: 32px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  line-height: 1.2;
  font-weight: 900;
}

.topic-desc {
  font-size: 15px;
  color: #7f8c8d;
  line-height: 1.6;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3; 
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #95a5a6;
  font-weight: 600;
}

/* --- 右侧：书籍列表 --- */
.topic-books-section {
  flex-grow: 1; 
  padding: 30px 50px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* 【关键修复 1】添加这一行，防止 Flex 布局撑开容器导致无法滚动 */
  min-width: 0;
}

.books-scroll-container {
  display: flex;
  gap: 30px;
  overflow-x: auto; /* 允许X轴滚动 */
  padding: 10px 0 20px 0;
  scroll-behavior: smooth;

  /* 【关键修复 2】添加这一行，防止容器内部换行 */
  flex-wrap: nowrap;
}

/* 【关键修复 3】确保卡片不收缩，宽度固定 */
.preview-book-card {
  flex: 0 0 180px; 
}
/* 【关键修复】定义滚动条样式，显示紫色滚动条 */
.books-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.books-scroll-container::-webkit-scrollbar-track {
  background: #eaeaea;
}

.books-scroll-container::-webkit-scrollbar-thumb {
  background: var(--theme-color); /* 使用主题色 */
  border-radius: 3px;
}

.preview-book-card {
  /* 【关键修复】确保卡片不收缩，宽度固定 */
  flex: 0 0 180px; 
}

.scroll-hint {
  text-align: right;
  font-size: 12px;
  color: #bdc3c7;
  margin-top: 10px;
  font-style: italic;
}

/* --- 响应式调整 --- */
@media (max-width: 1024px) {
  .topic-card {
    flex-direction: column;
  }
  .topic-cover-section {
    width: 100%;
    border-right: none;
    border-bottom: 6px solid var(--theme-color);
    padding: 30px;
    align-items: center;
    text-align: center;
  }
  .cover-image-wrapper {
    width: 100%;
    height: 200px; 
    margin-bottom: 20px;
  }
  .topic-books-section {
    width: 100%;
    padding: 30px;
  }
  .preview-book-card { 
    width: 140px; 
  }
}
</style>