<template>
  <div class="category-view">
    <div class="container">
      <!-- 主内容区（顶部筛选 + 书籍列表） -->
      <main class="content">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="login-tip">
          <el-empty description="请先登录查看书籍" :image-size="100">
            <el-button type="primary" @click="goToLogin">立即登录</el-button>
          </el-empty>
        </div>
        
        <!-- 已登录内容 -->
        <template v-else>
          <!-- 1. 分类标签区域（横向） -->
          <div class="category-tabs">
            <div 
              v-for="cat in categories" 
              :key="cat.id"
              class="category-tab"
              :class="{ active: selectedCategoryId === cat.id }"
              @click="handleCategoryChange(cat.id)"
            >
              {{ cat.name }}
            </div>
          </div>

          <!-- 2. 价格区间 + 排序区域 -->
          <div class="price-sort-bar">
            <div class="price-section">
              <span class="label">价格区间</span>
              <el-input 
                v-model="minPrice" 
                placeholder="最低" 
                size="small"
                type="number"
                :min="0"
                @input="preventNegative('min')"
                @blur="validatePriceOnly"
              >
                <template #prefix>¥</template>
              </el-input>
              <span class="separator">-</span>
              <el-input 
                v-model="maxPrice" 
                placeholder="最高" 
                size="small"
                type="number"
                :min="0"
                @input="preventNegative('max')"
                @blur="validatePriceOnly"
              >
                <template #prefix>¥</template>
              </el-input>
              <el-button type="primary" size="small" @click="applyPriceFilter">确定</el-button>
              <el-button size="small" @click="clearPriceFilter">清除</el-button>
              <div v-if="priceWarning" class="price-warning">
                <el-icon><Warning /></el-icon> 价格已自动调整
              </div>
            </div>
            <div class="sort-section">
              <span class="label">排序方式</span>
              <el-select v-model="sortBy" size="small" style="width: 140px" @change="handleSortChange">
                <el-option label="综合排序" value="default" />
                <el-option label="销量优先" value="sales" />
                <el-option label="价格从低到高" value="price-asc" />
                <el-option label="价格从高到低" value="price-desc" />
              </el-select>
            </div>
          </div>

          <!-- 3. 书籍网格 -->
          <div v-if="loading" class="loading-state">
            <el-skeleton :rows="6" animated />
          </div>
          <div v-else-if="booksList.length > 0" class="book-grid">
            <BookCard 
              v-for="book in booksList" 
              :key="book.id" 
              :book="formatBookData(book)" 
            />
          </div>
          <div v-else class="empty-state">
            <el-empty description="没有找到符合条件的书籍" />
          </div>

          <!-- 4. 分页组件 -->
          <PaginationBar 
            v-if="total > 0"
            :total="total"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            @change="handlePageChange"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Warning } from '@element-plus/icons-vue';
import BookCard from '@/components/BookCard.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import request from '@/utils/request';

const router = useRouter();

// 登录状态
const isLoggedIn = ref(false);

// 数据状态
const loading = ref(false);
const categories = ref([]);
const booksList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 筛选条件
const selectedCategoryId = ref(10); // 10表示全部
const minPrice = ref('');
const maxPrice = ref('');
const sortBy = ref('default');
const priceWarning = ref(false);

// 检查登录状态
const checkLoginStatus = () => {
  const token = sessionStorage.getItem('authToken');
  isLoggedIn.value = !!token;
  console.log('登录状态:', isLoggedIn.value ? '已登录' : '未登录');
  return isLoggedIn.value;
};

// 获取分类列表
const fetchCategories = async () => {
  if (!isLoggedIn.value) return;
  try {
    const categoryList = await request.get('/user/category/list');
    if (Array.isArray(categoryList)) {
      categories.value = categoryList.filter(cat => cat.status === true || cat.status === 1);
    } else {
      categories.value = [];
    }
  } catch (e) {
    console.error('获取分类列表失败:', e);
    categories.value = [];
  }
};

// 获取书籍列表（分页查询）
const fetchBooks = async () => {
  if (!isLoggedIn.value) return;
  loading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      categoryId: selectedCategoryId.value,
      minBalance: minPrice.value === '' ? 0 : parseInt(minPrice.value),
      maxBalance: maxPrice.value === '' ? 999999 : parseInt(maxPrice.value)
    };
    if (sortBy.value === 'price-asc') {
      params.sortBy = 'price';
      params.asc = true;
    } else if (sortBy.value === 'price-desc') {
      params.sortBy = 'price';
      params.asc = false;
    } else if (sortBy.value === 'sales') {
      params.sortBy = 'sales_count';
      params.asc = false;
    }
    const pageResult = await request.get('/user/book/list', { params });
    if (pageResult) {
      booksList.value = pageResult.list || [];
      total.value = pageResult.total || 0;
    } else {
      booksList.value = [];
      total.value = 0;
    }
  } catch (e) {
    console.error('获取书籍列表失败:', e);
    booksList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 格式化书籍数据
const formatBookData = (book) => {
  let coverUrl = book.coverUrl || book.cover || book.imageUrl || '';
  if (coverUrl && !coverUrl.startsWith('http') && !coverUrl.startsWith('/')) {
    coverUrl = '/' + coverUrl;
  }
  if (!coverUrl) coverUrl = '/images/default-cover.jpg';
  return {
    id: book.id,
    title: book.bookName || book.title || '未知书名',
    cover: coverUrl,
    author: book.author || '未知作者',
    price: book.price || 0,
    description: book.description || '',
    salesCount: book.salesCount || 0
  };
};

// 防止负数
const preventNegative = (type) => {
  const val = type === 'min' ? minPrice.value : maxPrice.value;
  if (val !== '' && parseFloat(val) < 0) {
    if (type === 'min') minPrice.value = '0';
    else maxPrice.value = '0';
  }
};

// 仅做价格区间验证和交换（不触发请求）
const validatePriceOnly = () => {
  priceWarning.value = false;
  const min = parseFloat(minPrice.value);
  const max = parseFloat(maxPrice.value);
  if (!isNaN(min) && !isNaN(max) && min > max) {
    const temp = minPrice.value;
    minPrice.value = maxPrice.value;
    maxPrice.value = temp;
    priceWarning.value = true;
    setTimeout(() => { priceWarning.value = false; }, 2000);
  }
};

// 应用价格筛选（点击确定）
const applyPriceFilter = () => {
  validatePriceOnly();
  if (currentPage.value !== 1) currentPage.value = 1;
  fetchBooks();
};

// 清除价格筛选（点击清除）
const clearPriceFilter = () => {
  minPrice.value = '';
  maxPrice.value = '';
  priceWarning.value = false;
  if (currentPage.value !== 1) currentPage.value = 1;
  fetchBooks();
};

// 处理分类变化
const handleCategoryChange = (categoryId) => {
  selectedCategoryId.value = categoryId;
  if (currentPage.value !== 1) currentPage.value = 1;
  fetchBooks();
};

// 处理排序变化
const handleSortChange = () => {
  if (currentPage.value !== 1) currentPage.value = 1;
  fetchBooks();
};

// 处理分页变化
const handlePageChange = () => {
  fetchBooks();
  scrollToTop();
};

// 滚动到顶部
const scrollToTop = () => {
  setTimeout(() => {
    const contentEl = document.querySelector('.content');
    if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
};

// 跳转登录
const goToLogin = () => {
  router.push('/login');
};

// 页面加载
onMounted(() => {
  if (checkLoginStatus()) {
    Promise.all([fetchCategories(), fetchBooks()]).catch(err => {
      console.error('请求失败:', err);
    });
  }
});
</script>

<style scoped>
.category-view {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  min-height: 800px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
}

/* 主内容区 */
.content {
  padding: 20px 30px;
  background: #fafafa;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 分类标签横向滚动（响应式） */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  overflow-x: auto;
  white-space: nowrap;
}
.category-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #606266;
  background: #f5f7fa;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.category-tab:hover {
  background: #ecf5ff;
  color: #0072ff;
}
.category-tab.active {
  background: #0072ff;
  color: #fff;
  font-weight: 500;
}

/* 价格+排序栏 */
.price-sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}
.price-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.price-section .label,
.sort-section .label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}
.price-section .el-input {
  width: 120px;
}
.price-section .separator {
  color: #909399;
}
.price-warning {
  font-size: 12px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sort-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 书籍网格：固定每行5列 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 固定5列，等宽 */
  gap: 20px;
  margin-bottom: 30px;
}

/* 其他样式保持 */
.loading-state {
  min-height: 500px;
  padding: 20px;
}
.empty-state {
  padding: 60px 0;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-tip {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 隐藏 number 输入框的上下箭头 */
:deep(.el-input__inner)::-webkit-inner-spin-button,
:deep(.el-input__inner)::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
:deep(.el-input__inner) {
  -webkit-appearance: none;
  appearance: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .content {
    padding: 15px;
  }
  .price-sort-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .price-section {
    width: 100%;
    justify-content: space-between;
  }
  .price-section .el-input {
    flex: 1;
    min-width: 100px;
  }
  .sort-section {
    width: 100%;
    justify-content: space-between;
  }
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .category-tabs {
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
</style>