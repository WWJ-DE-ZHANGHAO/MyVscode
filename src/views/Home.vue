<template>
  <div class="home-view">
    <!-- 顶部组合区域：左侧轮播 + 右侧榜单 -->
    <section class="top-combo-section">
      
      <!-- 左侧：广告轮播图 -->
      <div class="carousel-wrapper">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="login-tip">
          <el-empty description="请先登录查看广告" :image-size="100">
            <el-button type="primary" @click="goToLogin">立即登录</el-button>
          </el-empty>
        </div>
        
        <!-- 已登录且有广告数据 -->
        <el-carousel
          v-else-if="advertisements.length > 0"
          ref="carouselRef"
          :interval="4000"
          height="560px" 
          class="book-carousel"
          arrow="always"
          indicator-position="none"
        >
          <el-carousel-item v-for="(ad, index) in advertisements" :key="ad.id">
            <div 
              class="ad-card-container" 
              @click="handleAdClick(ad.linkUrl)"
            >
              <div class="ad-card">
                <img 
                  :src="ad.imageUrl" 
                  :alt="ad.title" 
                  class="ad-cover-img"
                  @error="handleImageError"
                />
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
        
        <!-- 已登录但无广告数据 -->
        <div v-else class="no-data-tip">
          <el-empty description="暂无广告数据" :image-size="100" />
        </div>
      </div>

      <!-- 右侧：热销榜单 -->
      <div class="ranking-wrapper">
        <div class="ranking-header">
          <h3 class="ranking-title">热销榜单</h3>
        </div>

        <div class="ranking-list">
          <div 
            v-for="(book, index) in currentRankingList" 
            :key="book.id" 
            class="ranking-item"
            @click="goToDetail(book.id)"
          >
            <div class="rank-index" :class="{ 'top-three': index < 3 }">
              {{ index + 1 }}
            </div>
            
            <div class="rank-text-only">
              {{ book.title }}
            </div>

            <div class="rank-hover-card">
                <div class="card-img-box">
                <img :src="book.cover || '/images/new.png'" :alt="book.title" class="card-img" @error="(e)=>e.target.src='/images/new.png'" />
              </div>
              <div class="card-info-box">
                <div class="card-title">{{ book.title }}</div>
                <div class="card-author">作者：{{ book.author }}</div>
                <div class="card-price-row">
                  <span class="card-price">¥ {{ parseFloat(book.price).toFixed(2) }}</span>
                  <span class="card-old-price" v-if="book.oldPrice">¥ {{ book.oldPrice }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- 下方推荐区域 -->
    <section class="recommend-section"> 
      <div class="section-header">
        <div class="title-wrapper">
          <h2 class="section-title">热门推荐</h2>
          <div class="title-line"></div>
        </div>
      </div>

      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="login-tip-books">
        <el-empty description="请先登录查看推荐书籍" :image-size="80">
          <el-button type="primary" @click="goToLogin">立即登录</el-button>
        </el-empty>
      </div>
      
      <!-- 已登录且书籍数据 -->
      <div v-else-if="displayHotBooks.length > 0" class="book-grid">
        <BookCard 
          v-for="book in displayHotBooks" 
          :key="book.id" 
          :book="book" 
        />
      </div>
      
      <!-- 已登录但无书籍数据 -->
      <div v-else class="no-data-tip">
        <el-empty description="暂无推荐书籍" :image-size="80" />
      </div>
    </section>

    <!-- 高分好书区域 -->
    <section class="recommend-section"> 
      <div class="section-header">
        <div class="title-wrapper">
          <h2 class="section-title">高分好书</h2>
          <div class="title-line"></div>
        </div>
      </div>

      <!-- 未登录提示 -->
      <div v-if="!isLoggedIn" class="login-tip-books">
        <el-empty description="请先登录查看高分好书" :image-size="80">
          <el-button type="primary" @click="goToLogin">立即登录</el-button>
        </el-empty>
      </div>
      
      <!-- 已登录且书籍数据 -->
      <div v-else-if="highScoreBooks.length > 0" class="book-grid">
        <BookCard 
          v-for="book in highScoreBooks" 
          :key="book.id" 
          :book="book" 
        />
      </div>
      
      <!-- 已登录但无书籍数据 -->
      <div v-else class="no-data-tip">
        <el-empty description="暂无高分好书" :image-size="80" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import BookCard from '@/components/BookCard.vue';
import request from '@/utils/request';

const router = useRouter();

// 登录状态
const isLoggedIn = ref(false);

// 检查登录状态
const checkLoginStatus = () => {
  const token = sessionStorage.getItem('token');
  isLoggedIn.value = !!token;
  console.log('========== 首页加载 ==========');
  console.log('登录状态:', isLoggedIn.value ? '已登录' : '未登录');
  if (token) {
    console.log('Token存在，长度:', token.length);
    console.log('Token前20位:', token.substring(0, 20) + '...');
  }
  return isLoggedIn.value;
};

// --- 广告数据 ---
const advertisements = ref([]);

// --- 热销榜单数据 ---
const rankingList = ref([]);

// --- 热门推荐数据 ---
const HOT_BOOK_LIMIT = 30;
const allBooks = ref([]);
const displayHotBooks = computed(() => allBooks.value.slice(0, HOT_BOOK_LIMIT));

// --- 高分好书数据 ---
const highScoreBooks = ref([]);

// 当前榜单数据
const currentRankingList = computed(() => rankingList.value);

// 图片URL处理函数
const normalizeImageUrl = (url) => {
  if (!url) return '';
  
  url = url.trim();
  if (url === '') return '';
  
  if (url.startsWith('/')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
    return '/' + url;
  }
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  
  return url;
};

// 获取广告列表
const fetchAdvertisements = async () => {
  if (!isLoggedIn.value) {
    console.log('【广告】用户未登录，跳过');
    return [];
  }
  
  try {
    console.log('【广告】开始请求 /user/ad/list');
    const adList = await request.get('/user/ad/list');
    console.log('【广告】响应成功:', adList);
    
    if (Array.isArray(adList)) {
      const adListData = adList.slice(0, 5);
      console.log(`【广告】成功获取${adListData.length}个广告`);
      return adListData;
    }
    console.warn('【广告】响应不是数组格式');
    return [];
  } catch (e) {
    console.error('【广告】请求失败:', e.message);
    if (e.response) {
      console.error('【广告】错误状态码:', e.response.status);
      console.error('【广告】错误数据:', e.response.data);
    }
    return [];
  }
};

// 获取热销榜单数据
const fetchRankingList = async () => {
  if (!isLoggedIn.value) {
    console.log('【榜单】用户未登录，跳过');
    return [];
  }
  
  try {
    console.log('【榜单】开始请求 /user/book/rank');
    const rankData = await request.get('/user/book/rank');
    console.log('【榜单】响应成功:', rankData);
    
    if (Array.isArray(rankData)) {
      console.log(`【榜单】成功获取${rankData.length}个热销书籍`);
      return rankData;
    }
    console.warn('【榜单】响应不是数组格式');
    return [];
  } catch (e) {
    console.error('【榜单】请求失败:', e.message);
    if (e.response) {
      console.error('【榜单】错误状态码:', e.response.status);
      console.error('【榜单】错误数据:', e.response.data);
    }
    return [];
  }
};

// 获取热门推荐书籍
const fetchHotBooks = async () => {
  if (!isLoggedIn.value) {
    console.log('【热门】用户未登录，跳过');
    return [];
  }
  
  try {
    console.log('【热门】开始请求 /user/book/hot');
    const hotBooks = await request.get('/user/book/hot');
    console.log('【热门】响应成功:', hotBooks);
    
    if (Array.isArray(hotBooks)) {
      console.log(`【热门】成功获取${hotBooks.length}个热门书籍`);
      return hotBooks;
    }
    console.warn('【热门】响应不是数组格式');
    return [];
  } catch (e) {
    console.error('【热门】请求失败:', e.message);
    if (e.response) {
      console.error('【热门】错误状态码:', e.response.status);
      console.error('【热门】错误数据:', e.response.data);
    }
    return [];
  }
};

// 获取高分好书
const fetchHighScoreBooks = async () => {
  if (!isLoggedIn.value) {
    console.log('【高分】用户未登录，跳过');
    return [];
  }
  
  try {
    console.log('【高分】开始请求 /user/book/high');
    const highBooks = await request.get('/user/book/high');
    console.log('【高分】响应成功:', highBooks);
    
    if (Array.isArray(highBooks)) {
      console.log(`【高分】成功获取${highBooks.length}个高分好书`);
      return highBooks;
    }
    console.warn('【高分】响应不是数组格式');
    return [];
  } catch (e) {
    console.error('【高分】请求失败:', e.message);
    if (e.response) {
      console.error('【高分】错误状态码:', e.response.status);
      console.error('【高分】错误数据:', e.response.data);
    }
    return [];
  }
};

// 处理图片加载失败
const handleImageError = (event) => {
  console.warn('图片加载失败:', event.target.src);
  
  if (event.target.src.includes('/images/ad1.jpg') || 
      event.target.src.includes('/images/new.png')) {
    return;
  }

  event.target.src = '/images/new.png';

  event.target.onerror = () => {
    event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"%3E%3Crect width="800" height="400" fill="%23f0f0f0"/%3E%3Ctext x="400" y="200" font-size="20" text-anchor="middle" fill="%23999"%3E图片加载失败%3C/text%3E%3C/svg%3E';
    event.target.onerror = null;
  };
};

// 处理格式化后的数据
const processAdData = (ads) => {
  return ads.map(ad => {
    const rawUrl = ad.imgUrl || ad.imageUrl || '';
    const imageUrl = normalizeImageUrl(rawUrl);
    return {
      id: ad.id,
      title: ad.title || `广告${ad.id}`,
      imageUrl: imageUrl || '/images/ad1.jpg',
      linkUrl: ad.targetUrl || ad.linkUrl || ''
    };
  });
};

const processRankData = (books) => {
  return books.map((book, index) => {
    const coverUrl = book.coverUrl || book.cover || book.imageUrl || book.imgUrl || '';
    return {
      id: book.id,
      title: book.bookName || book.title || '未知书名',
      cover: normalizeImageUrl(coverUrl) || '/images/new.png',
      author: book.author || '未知作者',
      description: book.description || '', // 新增这一行
      price: book.price || 0,
      oldPrice: index === 1 ? "98.00" : (index === 3 ? "56.50" : null),
      description: book.description || ''
    };
  });
};

const processHotData = (books) => {
  return books.map(book => {
    const coverUrl = book.coverUrl || book.cover || book.imageUrl || book.imgUrl || '';
    return {
      id: book.id,
      title: book.bookName || book.title || book.name || '',
      cover: normalizeImageUrl(coverUrl) || '/images/new.png',
      author: book.author || '',
      description: book.description || '', // 新增这一行
      price: book.price || 0,
      description: book.description || ''
    };
  });
};

// 加载所有数据
const loadAllData = async () => {
  if (!isLoggedIn.value) {
    console.log('未登录，清空所有数据');
    advertisements.value = [];
    rankingList.value = [];
    allBooks.value = [];
    return;
  }
  
  console.log('========== 开始并行加载四个请求 ==========');
  console.log('1. 广告接口: /user/ad/list');
  console.log('2. 榜单接口: /user/book/rank');
  console.log('3. 热门接口: /user/book/hot');
  console.log('4. 高分接口: /user/book/high');
  
  try {
    // 四个请求并行发送
    const [ads, ranks, hots, high] = await Promise.all([
      fetchAdvertisements(),
      fetchRankingList(),
      fetchHotBooks(),
      fetchHighScoreBooks()
    ]);
    
    console.log('========== 四个请求全部完成 ==========');
    console.log('广告数据原始长度:', ads?.length || 0);
    console.log('榜单数据原始长度:', ranks?.length || 0);
    console.log('热门数据原始长度:', hots?.length || 0);
    console.log('高分数据原始长度:', high?.length || 0);
    
    // 处理数据
    advertisements.value = processAdData(ads || []);
    rankingList.value = processRankData(ranks || []);
    allBooks.value = processHotData(hots || []);
    highScoreBooks.value = processHotData(high || []);
    
    console.log('========== 数据处理完成 ==========');
    console.log('广告处理后数量:', advertisements.value.length);
    console.log('榜单处理后数量:', rankingList.value.length);
    console.log('热门处理后数量:', allBooks.value.length);
    console.log('高分处理后数量:', highScoreBooks.value.length);
    
    if (rankingList.value.length === 0) {
      console.warn('⚠️ 榜单数据为空，请检查后端 /user/book/rank 接口');
    }
    if (allBooks.value.length === 0) {
      console.warn('⚠️ 热门数据为空，请检查后端 /user/book/hot 接口');
    }
    if (highScoreBooks.value.length === 0) {
      console.warn('⚠️ 高分好书数据为空，请检查后端 /user/book/high 接口');
    }
  } catch (error) {
    console.error('========== 加载数据失败 ==========');
    console.error('错误:', error);
  }
};

// 监听storage变化
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    console.log('storage事件 - token变化:', !!e.newValue);
    isLoggedIn.value = !!e.newValue;
    loadAllData();
  }
});

onMounted(() => {
  checkLoginStatus();
  loadAllData();
});

// 不再使用全局事件监听导航点击；MainLayout 通过 key 强制刷新组件。

// 事件处理函数
const handleAdClick = (url) => {
  if (!url) return;
  if (url.startsWith('http')) {
    window.open(url, '_blank');
  } else {
    router.push(url);
  }
};

const goToDetail = (id) => {
  router.push(`/book/${id}`);
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
/* 样式保持不变 */
.home-view {
  padding-bottom: 40px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.top-combo-section {
  width: 70%; 
  margin: 0 auto;
  display: flex;
  gap: 15px; 
  margin-bottom: 40px;
}

.carousel-wrapper {
  flex: 3; 
  height: 560px; 
  border-radius: 0; 
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  background-color: #f5f7fa;
  position: relative;
}

.login-tip,
.no-data-tip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.book-carousel {
  height: 100%;
}

.book-carousel :deep(.el-carousel__container) {
  height: 100%;
}

.ad-card-container {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.ad-card {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;
}

.ad-cover-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f5f7fa;
}

.ranking-wrapper {
  flex: 1; 
  background: #fff;
  border-radius: 0; 
  overflow: visible; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.ranking-header {
  background: #d9534f; 
  padding: 12px 15px;
}

.ranking-title {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.ranking-list {
  flex: 1;
  padding: 10px 0;
  overflow: visible; 
}

.ranking-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 15px;
  cursor: pointer;
  border-bottom: 1px dashed #f0f0f0; 
  overflow: visible; 
  transition: background 0.2s;
}

.ranking-item:last-child { border-bottom: none; }
.ranking-item:hover { background: #fafafa; }

.rank-index {
  width: 20px;
  height: 20px;
  background: #ccc;
  color: #fff;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  margin-right: 12px;
  font-style: italic;
  flex-shrink: 0;
  border-radius: 0; 
  z-index: 10;
}

.rank-index.top-three {
  background: #d9534f; 
  font-weight: bold;
}

.rank-text-only {
  flex: 1;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s; 
  z-index: 1;
}

.rank-hover-card {
  position: absolute;
  left: 35px;
  top: -8px;
  width: 240px;
  height: 80px;
  background: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  padding: 8px;
  box-sizing: border-box;
  gap: 10px;
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transform: translateY(5px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
}

.ranking-item:hover .rank-text-only {
  opacity: 0;
}

.ranking-item:hover .rank-hover-card {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.card-img-box {
  width: 55px;
  height: 70px;
  flex-shrink: 0;
  background: #f5f7fa;
  border: 1px solid #eee;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.card-title {
  font-size: 13px;
  color: #333;
  font-weight: bold;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-author {
  font-size: 12px;
  color: #999;
}

.card-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.card-price {
  color: #f56c6c;
  font-size: 15px;
  font-weight: bold;
  font-family: Arial, sans-serif;
}

.card-old-price {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}

.recommend-section { 
  width: 70%;
  margin: 0 auto 40px auto;
  padding: 20px;
  background: #fff;
  border-radius: 0; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-bottom: 1px solid #f0f0f0;
}

.login-tip-books {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-wrapper { display: flex; flex-direction: column; align-items: flex-start; }
.section-title { font-size: 22px; color: #303133; margin: 0; font-weight: 700; }
.title-line { width: 60px; height: 3px; background: #f56c6c; margin-top: 10px; border-radius: 0; }

.book-grid { 
  display: grid; 
  grid-template-columns: repeat(5, 1fr); 
  gap: 20px 15px; 
  background: transparent;
  border: none; 
}

@media (max-width: 1300px) {
  .top-combo-section, .recommend-section { width: 85%; }
  .book-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 900px) {
  .top-combo-section {
    flex-direction: column;
    height: auto;
  }
  .carousel-wrapper, .ranking-wrapper {
    width: 100%;
    flex: none;
  }
  .carousel-wrapper { height: 220px; margin-bottom: 15px; }
  .ranking-wrapper { height: 300px; }
  
  .book-grid { grid-template-columns: repeat(2, 1fr); gap: 15px 10px; }
  .section-title { font-size: 18px; }
  
  .rank-hover-card { display: none !important; }
  .rank-text-only { opacity: 1 !important; }
}

@media (max-width: 768px) {
  .top-combo-section, .recommend-section { width: 92%; }
}
</style>