<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router' // 导入 useRouter 以在成功后重定向

const authStore = useAuthStore()
const router = useRouter() // 获取路由实例

const email = ref('')
const password = ref('')
const isSignUpMode = ref(false)
const errorMsg = ref(null)
const successMsg = ref(null) // 新增：成功消息

const handleAuth = async () => {
  errorMsg.value = null
  successMsg.value = null
  try {
    if (isSignUpMode.value) {
      // 注册
      await authStore.signUp(email.value, password.value)
      successMsg.value = '注册成功！请检查您的邮箱以完成验证。'
      email.value = '' // 清空表单
      password.value = ''
      // 注册成功后不立即登录，而是提示用户去验证邮箱
    } else {
      // 登录
      await authStore.signIn(email.value, password.value)
      // Pinia Store 中的 onAuthStateChange 会自动处理重定向到 '/'
    }
  } catch (error) {
    console.error('认证失败:', error)
    errorMsg.value = error.message || '认证操作失败。'
  }
}
</script>

<template>
  <div class="login-page-wrapper">
    <div class="login-backdrop"></div>
    <div class="auth-container animate__animated animate__fadeInDown">
      <h2 class="animate__animated animate__pulse animate__infinite">{{ isSignUpMode ? '注册新用户' : '欢迎回来' }}</h2>
      
      <form @submit.prevent="handleAuth" class="auth-form">
        <div class="input-group animate__animated animate__fadeInLeft">
          <label for="email">邮箱地址</label>
          <input type="email" id="email" v-model="email" placeholder="输入您的邮箱" required />
        </div>
        <div class="input-group animate__animated animate__fadeInRight">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="password" placeholder="输入您的密码" required />
        </div>
        
        <button type="submit" class="auth-btn animate__animated animate__zoomIn">
          {{ isSignUpMode ? '立即注册' : '登录' }}
        </button>
        
        <p v-if="errorMsg" class="error-msg animate__animated animate__shakeX">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success-msg animate__animated animate__fadeIn">{{ successMsg }}</p>
      </form>
      
      <button @click="isSignUpMode = !isSignUpMode" class="toggle-btn animate__animated animate__fadeInUp">
        {{ isSignUpMode ? '已有账户？点击登录' : '没有账户？立即注册' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-page-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6dd5ed, #2193b0); /* 渐变背景 */
  overflow: hidden;
  position: relative;
}

.login-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.1), transparent 50%),
              radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.1), transparent 50%);
  animation: background-animate 20s infinite alternate;
}

@keyframes background-animate {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.auth-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  text-align: center;
  position: relative; /* For z-index */
  z-index: 10;
  overflow: hidden; /* For inner animations */
}

h2 {
  color: #2193b0;
  margin-bottom: 30px;
  font-size: 2.2em;
  font-weight: 700;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

label {
  display: block;
  font-size: 0.9em;
  color: #333;
  margin-bottom: 5px;
}

input {
  display: block;
  width: calc(100% - 20px);
  padding: 12px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #6dd5ed;
  box-shadow: 0 0 0 3px rgba(109, 213, 237, 0.3);
  outline: none;
}

.auth-btn, .toggle-btn {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
}

.auth-btn {
  background-color: #2193b0;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(33, 147, 176, 0.4);
}

.auth-btn:hover {
  background-color: #1a7a92;
  box-shadow: 0 6px 20px rgba(33, 147, 176, 0.6);
  transform: translateY(-2px);
}

.toggle-btn {
  background-color: transparent;
  color: #2193b0;
  font-weight: 500;
  margin-top: 25px;
}

.toggle-btn:hover {
  text-decoration: underline;
  color: #1a7a92;
}

.error-msg {
  color: #e74c3c;
  margin-top: 15px;
  font-weight: 500;
}

.success-msg {
  color: #28a745;
  margin-top: 15px;
  font-weight: 500;
}
</style>