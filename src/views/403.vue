<template>
  <div class="forbidden-container">
    <div class="forbidden-content">
      <h1 class="error-code">403</h1>
      <h2 class="error-title">无权限访问</h2>
      <p class="error-message">抱歉，您没有权限访问该页面</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.forbidden-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}

.forbidden-content {
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #f56c6c;
  margin: 0;
  line-height: 1;
  text-shadow: 0 4px 8px rgba(245, 108, 108, 0.2);
}

.error-title {
  font-size: 28px;
  color: #333;
  margin: 20px 0 10px;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 30px;
}
</style>
