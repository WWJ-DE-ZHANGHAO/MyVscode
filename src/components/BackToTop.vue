<!-- src/components/BackToTop.vue -->
<template>
  <transition name="fade-up">
    <div 
      v-if="isVisible" 
      class="back-to-top-btn" 
      @click="scrollToTop"
      title="返回顶部"
    >
      <!-- 纯 CSS 绘制的向上箭头 -->
      <span class="arrow-icon"></span>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);

const handleScroll = () => {
  // 滚动超过 300px 显示
  isVisible.value = window.pageYOffset > 300;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.back-to-top-btn {
  position: fixed;
  right: 30px;
  /* 【关键修改】这里调大了数值，防止挡住底部的购物车 */
  /* 如果还是挡住，请把 180px 改得更大，比如 200px */
  bottom: 180px; 
  
  width: 50px;
  height: 50px;
  border-radius: 50%;
  
  /* 简约风格：深灰色背景，带一点透明度 */
  background-color: rgba(50, 50, 50, 0.8);
  color: #fff;
  
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px); /* 毛玻璃效果，更高级 */
}

/* 悬停效果：变完全不透明，稍微上浮 */
.back-to-top-btn:hover {
  background-color: #333;
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

/* --- 纯 CSS 箭头 --- */
.arrow-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  /* 利用边框绘制三角形 */
  border-left: 3px solid #fff;
  border-top: 3px solid #fff;
  /* 旋转形成向上箭头 */
  transform: rotate(45deg); 
  margin-bottom: 4px; /* 微调视觉中心 */
  transition: transform 0.3s ease;
}

/* 悬停时箭头轻微跳动 */
.back-to-top-btn:hover .arrow-icon {
  transform: rotate(45deg) translateY(-2px);
}

/* 进出场动画 */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>