<template>
  <div class="search-result-page">
    <!-- 结果统计标题 -->
    <div class="result-header">
      <h1 v-if="keyword">
        关于 "<span class="highlight">{{ keyword }}</span>" 的搜索结果
      </h1>
      <h1 v-else>请输入关键词进行搜索</h1>

      <p class="result-count" v-if="!loading && keyword && filteredBooks.length > 0">
        共找到 {{ filteredBooks.length }} 本相关书籍
      </p>
      <p class="result-count" v-else-if="!loading && keyword && filteredBooks.length === 0">
        未找到相关书籍，建议您更换关键词重试
      </p>
      <p class="result-count" v-else-if="loading">
        加载中...
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 书籍列表网格 -->
    <div v-else-if="keyword && currentDisplayBooks.length > 0" class="book-grid">
      <div
        v-for="book in currentDisplayBooks"
        :key="book.id"
        class="book-card"
        @click="goToDetail(book.id)"
      >
        <!-- 图片区域（与 BookCard 组件样式一致） -->
        <div class="img-wrapper">
          <img
            :src="book.coverUrl || '/images/default-cover.jpg'"
            :alt="book.bookName"
            class="book-cover"
            loading="lazy"
          />
        </div>
        <!-- 信息区域 -->
        <div class="card-info">
          <h3 class="card-title">{{ book.bookName }}</h3>
          <p v-if="book.description" class="card-description">
            {{ formatDescription(book.description) }}
          </p>
          <p class="card-price">¥ {{ parseFloat(book.price).toFixed(2) }}</p>
        </div>
      </div>
    </div>

    <!-- 空状态（无关键词或搜索结果为空） -->
    <el-empty
      v-else-if="!keyword || filteredBooks.length === 0"
      :description="!keyword ? '请输入关键词进行搜索' : '暂无数据'"
      :image-size="200"
      class="empty-state"
    />

    <!-- 分页控件（使用 PaginationBar 组件） -->
    <PaginationBar
      v-if="keyword && filteredBooks.length > 0"
      :total="filteredBooks.length"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      @change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PaginationBar from '@/components/PaginationBar.vue';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();

// 数据状态
const keyword = ref('');
const searchResults = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10); // 默认每页10条

// 获取数据（仅有关键词时才请求）
const fetchData = async () => {
  const kw = keyword.value.trim();
  if (!kw) {
    searchResults.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const res = await request.get('/user/book/select', { params: { keyword: kw } });
    searchResults.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('获取书籍数据失败:', error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

// 后端已过滤，直接使用全部结果
const filteredBooks = computed(() => searchResults.value);

// 前端分页切片
const currentDisplayBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredBooks.value.slice(start, end);
});

// 监听路由参数变化
watch(
  () => route.query.q,
  async (newQ) => {
    keyword.value = newQ || '';
    currentPage.value = 1;
    await fetchData();
  },
  { immediate: true }
);

// 分页变化处理（页码变化）
const handlePageChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 跳转详情
const goToDetail = (id) => {
  router.push(`/book/${id}`);
};

// 格式化简短描述（与 BookCard 组件一致）
const formatDescription = (desc) => {
  if (!desc) return '';
  const trimmedDesc = desc.trim();
  if (trimmedDesc.length > 30) {
    return trimmedDesc.substring(0, 30) + '...';
  }
  return trimmedDesc;
};

onMounted(() => {
  if (!route.query.q) {
    keyword.value = '';
    searchResults.value = [];
  }
});
</script>

<style scoped>
.search-result-page {
  padding: 20px;
  min-height: 60vh;
}

.result-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.result-header h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.highlight {
  color: #0072ff;
  font-weight: bold;
}

.result-count {
  color: #909399;
  font-size: 14px;
}

.loading-state {
  min-height: 400px;
  padding: 20px;
}

/* 书籍网格：与全部书籍页面保持一致，固定5列 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

/* 卡片样式（完全复刻 BookCard 组件） */
.book-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: auto;
}

.book-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  /* 移除上移效果 */
  transform: none;
}

.img-wrapper {
  width: 100%;
  height: 190px; /* 固定高度 */
  position: relative;
  overflow: hidden;
  background: #f9f9f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* 完整显示，不变形 */
  /* 移除放大效果 */
  transition: none;
}

.card-info {
  padding: 12px 10px;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: #fff;
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 40px;
}

.card-description {
  font-size: 12px;
  color: #606266;
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}

.card-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
  margin: 0;
}

.empty-state {
  margin-top: 80px;
}

/* 响应式：与全部书籍页面一致 */
@media (max-width: 1200px) {
  .book-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 992px) {
  .book-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .img-wrapper {
    height: 160px;
  }
}
@media (max-width: 576px) {
  .book-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>