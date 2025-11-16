<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useHabitsStore } from '@/stores/habits'
import { useRouter } from 'vue-router'
import { TransitionGroup } from 'vue'

const authStore = useAuthStore()
const habitsStore = useHabitsStore()
const router = useRouter()
const refreshStats = async () => {
  try {
    await habitsStore.fetchHabitStats()
  } catch (err) {
    console.error('[StatsView] refreshStats error', err)
  }
}
// 计算整体平均完成率
const overallRate = () => {
  if (habitsStore.stats.length === 0) return 0
  let totalRates = habitsStore.stats.reduce((sum, stat) => sum + stat.completion_rate, 0)
  return (totalRates / habitsStore.stats.length).toFixed(1)
}

const goToHabits = () => {
    router.push('/')
}

// -----------------------------------------------------------
// 🌟 关键逻辑：获取统计数据 🌟
// -----------------------------------------------------------
onMounted(async () => {
  // 此时 main.js 已经保证了 authStore.user 是正确的最新状态
  if (!authStore.user) {
    router.push('/login')
  } else {
    await habitsStore.fetchHabitStats()
  }
})
// -----------------------------------------------------------

</script>

<template>
  <div class="stats-page-wrapper">
    <header class="app-header animate__animated animate__fadeInDown">
      <h1 class="animate__animated animate__rubberBand">习惯统计与洞察</h1>
      <div>
        <button @click="goToHabits" class="nav-btn">← 习惯列表</button>
        <button @click="refreshStats" class="nav-btn">刷新</button>
        <button @click="authStore.signOut" class="logout-btn">登出</button>
      </div>
    </header>

    <div class="stats-container">
        
      <div v-if="habitsStore.loading" class="loading-spinner animate__animated animate__flash animate__infinite">
        <div class="spinner"></div>
        <p>正在计算数据...</p>
      </div>

      <div v-else-if="habitsStore.stats.length === 0" class="no-stats animate__animated animate__fadeIn">
        <p>还没有可用的习惯数据。请先添加并开始追踪习惯。</p>
      </div>

      <div v-else>
        <div class="overview-card animate__animated animate__fadeIn">
            <h2>整体概览</h2>
            <div class="overall-rate-display">
                <span class="rate-value">{{ overallRate() }}%</span>
                <span class="rate-label">平均完成率</span>
            </div>
            <p class="insight">
                您正在追踪 **{{ habitsStore.stats.length }}** 个习惯，继续保持专注！
            </p>
        </div>

        <h2 class="section-title animate__animated animate__fadeInUp">单项习惯表现</h2>
        
        <TransitionGroup name="stats-list" tag="div" class="habit-stats-grid">
            <div v-for="stat in habitsStore.stats" :key="stat.id" class="stat-card animate__animated animate__zoomIn">
                <h3 :class="{ 'high-rate': stat.completion_rate > 70 }">{{ stat.name }}</h3>
                <p class="frequency-tag">{{ stat.frequency }}</p>

                <div class="stat-row">
                    <span class="stat-label">完成率:</span>
                    <span class="stat-value rate">{{ stat.completion_rate.toFixed(1) }}%</span>
                </div>

                <div class="stat-row">
                    <span class="stat-label">当前连续天数 (Streak):</span>
                    <span class="stat-value streak">{{ stat.current_streak }} 天</span>
                </div>

                <div class="stat-row">
                    <span class="stat-label">最佳连续天数:</span>
                    <span class="stat-value best-streak">{{ stat.best_streak }} 天</span>
                </div>
            </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式已省略以节省篇幅，请保留您之前提供的完整样式代码 */
.stats-page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5, #e0e4eb);
  padding: 30px 20px;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background-color: #fff;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
h1 {
  color: #3f51b5;
  font-size: 2.5em;
  font-weight: 800;
  margin: 0;
}
.nav-btn, .logout-btn {
  padding: 10px 15px;
  background-color: #3f51b5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-left: 10px;
}
.nav-btn:hover { background-color: #5c6bc0; transform: translateY(-2px); }
.logout-btn { background-color: #ef5350; }
.logout-btn:hover { background-color: #d32f2f; transform: translateY(-2px); }
/* ... (其他样式) ... */
.stats-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
.overview-card {
    background: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    margin-bottom: 40px;
    text-align: center;
    border-top: 5px solid #3f51b5;
}
.rate-value {
    font-size: 4em;
    font-weight: 900;
    color: #4caf50;
    line-height: 1;
}
.habit-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
}
.stat-card {
    background: #ffffff;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border-left: 4px solid #3f51b5;
}
.stat-value.rate { color: #4caf50; }
.stat-value.streak { color: #ff9800; }
.stat-value.best-streak { color: #3f51b5; }
</style>