<template>
  <div class="category-nav" v-show="isVisible">
    <h3 class="nav-title">{{ title }}</h3>
    <div class="nav-grid">
      <div 
        v-for="category in categories" 
        :key="category.id || category.name"
        class="nav-item"
        @click="scrollToCategory(category)"
      >
        <span class="nav-text">{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: '分类导航'
  },
  categories: {
    type: Array,
    default: () => []
  }
});

const isVisible = ref(true);

const scrollToCategory = (category) => {
  const targetId = `category-${category.id || category.name.replace(/\s+/g, '-').toLowerCase()}`;
  const targetElement = document.getElementById(targetId);
  
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

const handleScroll = () => {
  // 获取顶部横幅图的下边界位置
  const bannerElement = document.querySelector('.page-banner');
  if (bannerElement) {
    const bannerRect = bannerElement.getBoundingClientRect();
    const bannerBottom = bannerRect.bottom;
    
    // 当滚动到顶部图下边界时隐藏，滚动过下边界后显示
    isVisible.value = window.scrollY > bannerBottom;
  }
};

onMounted(() => {
  nextTick(() => {
    // 初始检查
    handleScroll();
    // 添加滚动监听
    window.addEventListener('scroll', handleScroll);
  });
});

onUnmounted(() => {
  // 移除滚动监听
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.category-nav {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 12px;
  position: fixed;
  top: 100px;
  right: 50px;
  z-index: 101; /* 高于顶部导航栏的z-index: 100 */
  width: auto;
  min-width: 280px;
  max-width: 90%;
}

.nav-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #333;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  min-width: 280px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
  min-height: 50px;
}

.nav-item:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.nav-text {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  text-align: center;
  padding: 4px;
  word-break: break-all;
  line-height: 1.2;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .category-nav {
    top: 90px;
    right: 20px;
    min-width: 240px;
  }
  
  .nav-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>