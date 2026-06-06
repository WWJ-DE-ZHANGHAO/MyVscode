<template>
  <div class="category-nav" :class="`theme-${theme}`" v-show="isVisible">
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
  },
  theme: {
    type: String,
    default: 'default' // default, special, newbook
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
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 16px;
  position: fixed;
  top: 100px;
  right: 50px;
  z-index: 101;
  width: auto;
  min-width: 280px;
  max-width: 90%;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 特价页主题 - 紫色渐变 */
.category-nav.theme-special {
  background: linear-gradient(135deg, rgba(186, 104, 200, 0.95) 0%, rgba(142, 36, 170, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.category-nav.theme-special .nav-title {
  color: #fff;
  border-bottom-color: rgba(255, 255, 255, 0.3);
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.category-nav.theme-special .nav-item {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
}

.category-nav.theme-special .nav-item:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.category-nav.theme-special .nav-text {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* 新书页主题 - 暖黄渐变 */
.category-nav.theme-newbook {
  background: linear-gradient(135deg, rgba(255, 224, 130, 0.95) 0%, rgba(255, 202, 40, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.category-nav.theme-newbook .nav-title {
  color: #fff;
  border-bottom-color: rgba(255, 255, 255, 0.3);
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.category-nav.theme-newbook .nav-item {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
}

.category-nav.theme-newbook .nav-item:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.category-nav.theme-newbook .nav-text {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* 默认主题 */
.category-nav.theme-default {
  background: #ffffff;
}

.nav-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px 0;
  color: #333;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
  letter-spacing: 1px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  min-width: 280px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
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
  font-size: 12px;
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