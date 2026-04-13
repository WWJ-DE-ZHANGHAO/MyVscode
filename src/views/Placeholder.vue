<template>
  <div class="placeholder-container">
    <div class="placeholder-content">
      <el-icon class="placeholder-icon"><Document /></el-icon>
      <h3>页面开发中</h3>
      <p>该功能正在开发中，敬请期待！</p>
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'
</script>

<style scoped>
.placeholder-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.placeholder-content {
  text-align: center;
  padding: 40px;
}

.placeholder-icon {
  font-size: 64px;
  color: var(--primary);
  margin-bottom: 20px;
}

.placeholder-content h3 {
  font-size: 24px;
  color: var(--text-h);
  margin: 0 0 12px;
}

.placeholder-content p {
  font-size: 16px;
  color: var(--text);
  margin: 0;
}
</style>
