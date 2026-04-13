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
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载专题中...</p>
      </div>
      
      <!-- 无数据状态 -->
      <div v-else-if="topicList.length === 0" class="empty-state">
        <h2>暂无专题</h2>
        <p>专题内容正在更新中，敬请期待</p>
      </div>
      
      <!-- 专题列表 -->
      <div 
        v-for="topic in topicList" 
        :key="topic.id" 
        class="topic-card"
        :style="{ '--theme-color': topic.color }"
      >
        <!-- 左侧：固定尺寸专题封面 -->
        <div class="topic-cover-section">
          <div class="cover-image-wrapper">
            <img :src="topic.coverImage || '/images/new.png'" :alt="topic.title" class="cover-img" @error="(e)=>e.target.src='/images/new.png'" />
            <div class="overlay-badge">{{ topic.tag }}</div>
          </div>
          <div class="topic-info">
            <h2 class="topic-title">{{ topic.title }}</h2>
            <p class="topic-desc">{{ topic.description }}</p>
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
import { ref, onMounted } from 'vue';
import BookCard from '@/components/BookCard.vue';
import request from '@/utils/request';

const bannerLoaded = ref(true);
const topicList = ref([]);
const loading = ref(true);

// 从后端获取专题数据
const fetchSpecialTopics = async () => {
  try {
    loading.value = true;
    const res = await request.get('/user/book/specialtopic');
    const data = res && res.data ? res.data : res;
    
    if (data) {
      // 转换后端返回的数据格式
      const topics = [];
      for (const [topicStr, books] of Object.entries(data)) {
        // 从topic字符串中提取信息
        try {
          // 提取id
          const idMatch = topicStr.match(/id=(\d+)/);
          const id = idMatch ? idMatch[1] : null;
          
          // 提取type
          const typeMatch = topicStr.match(/type=(.+?), categoryId/);
          const type = typeMatch ? typeMatch[1] : null;
          
          // 提取title
          const titleMatch = topicStr.match(/title=(.+?), description/);
          const title = titleMatch ? titleMatch[1] : null;
          
          // 提取description
          const descMatch = topicStr.match(/description=(.+?), coverUrl/);
          const description = descMatch ? descMatch[1] : null;
          
          // 提取coverUrl
          const coverMatch = topicStr.match(/coverUrl=(.+?), status/);
          let coverUrl = coverMatch ? coverMatch[1] : null;
          // 清理coverUrl中的空格和引号
          if (coverUrl) {
            coverUrl = coverUrl.trim().replace(/^[`'"\s]+|[`'"\s]+$/g, '');
          }
          
          if (id && title) {
            topics.push({
              id: id,
              title: title,
              tag: type || '专题推荐', // 使用后端返回的type，否则使用默认值
              color: getRandomColor(), // 为每个专题生成随机颜色
              description: description || '',
              coverImage: coverUrl || '/images/new.png',
              books: books || []
            });
          }
        } catch (e) {
          console.warn('Failed to parse topic string:', e);
        }
      }
      topicList.value = topics;
    }
  } catch (e) {
    console.error('Failed to fetch special topics:', e);
    topicList.value = [];
  } finally {
    loading.value = false;
  }
};

// 生成随机颜色
const getRandomColor = () => {
  const colors = ['#3498db', '#e74c3c', '#9b59b6', '#27ae60', '#f39c12', '#e67e22'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 组件挂载时获取数据
onMounted(() => {
  fetchSpecialTopics();
});
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
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: var(--theme-color) transparent;
}

/* 自定义滚动条样式 */
.books-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.books-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.books-scroll-container::-webkit-scrollbar-thumb {
  background: var(--theme-color);
  border-radius: 3px;
}

.books-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #2980b9;
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

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #fff;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 无数据状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #fff;
  text-align: center;
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
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