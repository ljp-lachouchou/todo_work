<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useHabitsStore } from '@/stores/habits'
import { TransitionGroup } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const habitsStore = useHabitsStore()
const router = useRouter()

const newHabitName = ref('')
const newHabitFrequency = ref('Daily')
const loading = ref(true)
const frequencies = ['Daily', 'Weekly', 'Monthly']

// --- CRUD 函数 ---
const handleAddHabit = async () => {
  if (!newHabitName.value.trim()) return
  try {
    await habitsStore.addHabit(newHabitName.value.trim(), newHabitFrequency.value) 
    newHabitName.value = ''
    newHabitFrequency.value = 'Daily' 
  } catch (error) {
    alert('添加习惯失败: ' + error.message)
  }
}
const handleDeleteHabit = async (habitId) => {
    if (!confirm('确定要删除这个习惯吗？所有日志记录也会被删除！')) return
    try {
        await habitsStore.deleteHabit(habitId)
    } catch (error) {
        alert('删除习惯失败: ' + error.message)
    }
}
// 修改：添加日志与乐观更新/回滚逻辑
const handleToggleCompletion = async (habitId, currentStatus) => {
  console.log('[HabitsView] handleToggleCompletion called', { habitId, currentStatus })
  const newStatus = !currentStatus

  // 乐观更新本地状态，立即反映 UI
  const idx = habitsStore.habits.findIndex(h => h.id === habitId)
  const prev = idx !== -1 ? { ...habitsStore.habits[idx] } : null
  if (idx !== -1) {
    habitsStore.habits[idx] = { ...habitsStore.habits[idx], is_completed_today: newStatus }
  }

  try {
    await habitsStore.toggleHabitCompletion(habitId, newStatus)
    console.log('[HabitsView] toggleHabitCompletion succeeded', { habitId, newStatus })
  } catch (error) {
    // 回滚本地状态
    if (idx !== -1 && prev) {
      habitsStore.habits[idx] = prev
    }
    console.error('[HabitsView] toggleHabitCompletion failed', error)
    alert('更新日志失败: ' + (error.message || error))
  }
}

const goToStats = () => {
    router.push('/stats')
}

// -----------------------------------------------------------
// 🌟 关键逻辑：获取数据 🌟
// -----------------------------------------------------------
onMounted(async () => {
  // main.js 保证了此时 authStore.user 已经是正确状态，无需再次调用 initSession
  // loading.value = true (在 fetchHabitsAndLogs 中设置)

  if (authStore.user) { 
    // 用户已登录，从数据库拉取数据
    await habitsStore.fetchHabitsAndLogs() 
  } else {
    // 用户未登录，重定向
    router.push('/login')
  }
  loading.value = false // 在数据拉取后或重定向前设为 false
})
// -----------------------------------------------------------

</script>

<template>
  <div class="habits-page-wrapper">
    <header class="app-header animate__animated animate__fadeInDown">
      <h1 class="animate__animated animate__rubberBand">我的习惯追踪器</h1>
      <div>
        <button @click="goToStats" class="stats-btn animate__animated animate__flipInX">统计报告</button> 
        <button @click="authStore.signOut" class="logout-btn animate__animated animate__flipInX">登出</button>
      </div>
    </header>

    <div class="habits-container">
      <div class="add-habit-section animate__animated animate__fadeInUp">
        <input type="text" v-model="newHabitName" placeholder="输入新的习惯名称..." @keyup.enter="handleAddHabit" class="fancy-input" />
        <select v-model="newHabitFrequency" class="fancy-select">
          <option v-for="freq in frequencies" :key="freq" :value="freq">{{ freq }}</option>
        </select>
        <button @click="handleAddHabit" class="add-btn animate__animated animate__pulse">添加</button>
      </div>

      <div v-if="habitsStore.loading || loading" class="loading-spinner animate__animated animate__flash animate__infinite">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <TransitionGroup name="habit-list" tag="ul" v-else-if="habitsStore.habits.length">
        <li v-for="habit in habitsStore.habits" :key="habit.id" class="habit-item animate__animated animate__fadeIn" 
            :class="{ 'completed': habit.is_completed_today }">
            
          <div class="habit-details">
              <span class="habit-name">{{ habit.name }}</span>
              <span class="habit-freq">({{ habit.frequency }})</span> 
          </div>

          <div class="habit-actions">
              <button 
                @click="handleToggleCompletion(habit.id, habit.is_completed_today)"
                :class="{ 'complete-btn': true, 'done': habit.is_completed_today }"
              >
                {{ habit.is_completed_today ? '✓ 已完成' : '未完成' }}
              </button>
              
              <button @click="handleDeleteHabit(habit.id)" class="delete-btn">✗ 删除</button>
          </div>
        </li>
      </TransitionGroup>
      <p v-else class="no-habits animate__animated animate__fadeIn">您还没有创建任何习惯。快来添加第一个吧！</p>
    </div>
  </div>
</template>

<style scoped>
/* 样式已省略以节省篇幅，请保留您之前提供的完整样式代码 */
.habits-page-wrapper {
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
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}
.app-header div {
    display: flex;
    gap: 10px;
}
.logout-btn {
  padding: 10px 20px;
  background-color: #ef5350;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.logout-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
}
.stats-btn {
  padding: 10px 20px;
  background-color: #3f51b5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.stats-btn:hover {
  background-color: #303f9f;
  transform: translateY(-2px);
}
/* 主内容容器 */
.habits-container {
  max-width: 700px;
  margin: 0 auto;
  background-color: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
}
/* 添加习惯区域 */
.add-habit-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap; 
}
.fancy-input, .fancy-select {
  flex-grow: 1;
  padding: 12px 15px;
  border: 1px solid #cfd8dc;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  min-width: 150px; 
}
.fancy-input:focus, .fancy-select:focus {
  border-color: #3f51b5;
  box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2);
  outline: none;
}
.add-btn {
  padding: 12px 25px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
}
.add-btn:hover {
  background-color: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}
/* 习惯列表 */
ul { list-style: none; padding: 0; margin: 0; }
.habit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #eee;
  background-color: #fcfcfc;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}
.habit-item.completed {
  background-color: #e8f5e9;
  border-left: 5px solid #4caf50;
}
.habit-details { display: flex; align-items: baseline; flex-grow: 1; }
.habit-name {
  font-size: 1.2em;
  font-weight: 600;
  color: #3f51b5;
}
.habit-item.completed .habit-name {
  text-decoration: line-through;
  color: #888;
}
.habit-freq {
  margin-left: 10px;
  color: #777;
  font-size: 0.85em;
  font-style: italic;
}
.habit-actions { display: flex; gap: 10px; }
.complete-btn, .delete-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.3s ease;
}
.complete-btn {
  background-color: #e3f2fd;
  color: #3f51b5;
  border: 1px solid #bbdefb;
}
.complete-btn:hover {
  background-color: #bbdefb;
  transform: translateY(-1px);
}
.complete-btn.done {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}
.complete-btn.done:hover {
  background-color: #43a047;
  transform: translateY(-1px);
}
.delete-btn {
  background-color: #ffebee;
  color: #ef5350;
  border: 1px solid #ffcdd2;
}
.delete-btn:hover {
  background-color: #ffcdd2;
  transform: translateY(-1px);
}
/* 加载动画 */
.loading-spinner {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #555;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3f51b5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* Vue TransitionGroup 动画 */
.habit-list-enter-active,
.habit-list-leave-active { transition: all 0.5s ease; }
.habit-list-enter-from,
.habit-list-leave-to { opacity: 0; transform: translateX(30px); }
.habit-list-move { transition: transform 0.5s ease; }
</style>