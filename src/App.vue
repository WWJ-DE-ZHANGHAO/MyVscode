<script setup>
</script>

<template>
<div id="app">
    <!-- 必须要有这个标签，路由匹配的组件才会显示在这里 -->
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* 去掉默认的 body 边距，防止出现滚动条 */
body {
  margin: 0;
  padding: 0;
}


</style>
