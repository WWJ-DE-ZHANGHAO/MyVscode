<template>
  <div class="app-layout">
    <!-- 只在需要认证的页面显示侧边栏 -->
    <AdminSidebar v-if="showSidebar" />
    <main :class="['main-content', { 'with-sidebar': showSidebar }]">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <!-- 全局悬浮角标 -->
    <RemindNotification v-if="showSidebar" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from '@/components/AdminSidebar.vue'
import RemindNotification from '@/components/RemindNotification.vue'

const route = useRoute()

// 计算是否显示侧边栏
const showSidebar = computed(() => {
  // 登录和注册页面不显示侧边栏
  return !['/login', '/register'].includes(route.path)
})

// 监听路由变化，确保页面布局正确
watch(route, () => {
  // 可以在这里添加额外的逻辑
}, { deep: true })
</script>

<style>
.app-layout {
  min-height: 100vh;
  background: #f5f7fb;
}

.main-content {
  padding: 24px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-content.with-sidebar {
  margin-left: 260px; /* 与侧栏宽度保持一致 */
  padding: 80px 24px 24px; /* 顶部留出 topbar 高度，避免被遮挡 */
}

/* 覆盖全局 #app 的固定宽度，使内容能占满侧栏右侧可用空间 */
#app {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
