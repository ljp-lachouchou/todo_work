// src/main.js (请您手动修改此文件)

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth' // <--- 导入 Auth Store

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// ----------------------------------------------------
// 🌟 关键：等待认证状态就绪 🌟
// ----------------------------------------------------
const authStore = useAuthStore()

// 调用 initSession 并等待其 Promise 完成
authStore.initSession().then(() => {
    app.use(router) // 只有当 authStore.user 状态确定后才加载路由
    app.mount('#app') // 挂载应用
})
// ----------------------------------------------------