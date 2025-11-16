<script setup>
import { RouterView } from 'vue-router'
// 如果需要导航链接，可以在这里导入 RouterLink
</script>

<template>
  <div id="app-container">
    <RouterView />
  </div>
</template>

<style>
/* 这里可以放置全局样式 */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>