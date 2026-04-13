<template>
  <div style="max-width:800px;margin:40px auto;background:#fff;padding:20px;border:1px solid #eee;">
    <h2>支付成功</h2>
    <p>订单号：{{ orderId }}</p>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const orderId = ref(route.query.orderId || '')
const goHome = () => { router.push({ name: 'Home' }) }
</script>
