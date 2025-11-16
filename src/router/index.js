// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // 导入 Pinia Store

// 导入视图
import LoginView from '@/views/LoginView.vue'
import HabitsView from '@/views/HabitsView.vue' 
import StatsView from '@/views/StatsView.vue' // 新增导入

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HabitsView, 
      meta: { requiresAuth: true } // 需要认证
    },
    {
      path: '/stats', // 新增路由
      name: 'stats',
      component: StatsView, 
      meta: { requiresAuth: true } // 需要认证
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

// 导航守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 确保会话已初始化 (假设 useAuthStore 包含 initSession 方法)
  if (!authStore.user && to.path !== '/login') {
      // 这里的 initSession 依赖于您的 auth Store 实现
      // 假设它能检查本地存储或Supabase的会话
      // await authStore.initSession() 
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.path === '/login' && authStore.user) {
    next('/')
  } else {
    next()
  }
})

export default router