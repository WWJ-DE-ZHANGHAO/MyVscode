<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="grid"></div>
      <div class="circles">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
      <div class="network-lines">
        <div class="line line-1"></div>
        <div class="line line-2"></div>
        <div class="line line-3"></div>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-form-container">
      <div class="login-form-wrapper">
        <div class="logo-section">
          <div class="logo">
            <el-icon class="logo-icon"><Reading /></el-icon>
          </div>
          <h1 class="title">云图书城管理端</h1>
          <p class="subtitle">智慧运营平台</p>
        </div>

        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="UserFilled" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading">
              登录
            </el-button>
          </el-form-item>
          <div class="register-link">
            <span>还没有账号？</span>
            <el-link type="primary" @click="goToRegister">去注册</el-link>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer">
      <p>© 2026 云图书城管理端</p>
      <p>技术支持：400-123-4567</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading, UserFilled, Lock } from '@element-plus/icons-vue'
import axios from 'axios'
const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 调用后端登录接口
    console.log('登录请求参数:', loginForm)
    const response = await axios.post('/admin/admin/login', loginForm, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('登录响应:', response)
    console.log('响应数据:', response.data)
    console.log('响应状态码:', response.status)
    console.log('响应数据类型:', typeof response.data)
    console.log('响应数据是否有code字段:', 'code' in response.data)
    console.log('响应数据的code值:', response.data.code)
    
    // 检查响应数据格式（后端使用code=1表示成功）
    if (response.data && response.data.code === 1) {
      // 登录成功，存储token和用户名
      const data = response.data.data
      console.log('登录成功数据:', data)
      if (data && data.token && data.username) {
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('username', data.username)
        ElMessage.success('登录成功')
        router.push('/home')
      } else {
        console.log('登录成功数据格式错误:', data)
        ElMessage.error('登录成功但数据格式错误')
      }
    } else {
      // 登录失败，显示后端返回的错误信息
      console.log('登录失败原因:', response.data)
      ElMessage.error(response.data.msg || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a2463 0%, #1e3a8a 50%, #3b82f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.circles {
  position: relative;
  width: 100%;
  height: 100%;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%);
  animation: pulse 4s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: 10%;
  right: 10%;
  animation-delay: 1s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 2s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.network-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  height: 1px;
  animation: lineMove 8s linear infinite;
}

.line-1 {
  top: 25%;
  left: -100%;
  width: 200%;
  animation-delay: 0s;
}

.line-2 {
  top: 50%;
  left: -100%;
  width: 200%;
  animation-delay: 2s;
}

.line-3 {
  top: 75%;
  left: -100%;
  width: 200%;
  animation-delay: 4s;
}

@keyframes lineMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 登录表单 */
.login-form-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

.login-form-wrapper {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.login-form-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.login-form-wrapper:hover::before {
  left: 100%;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  animation: logoRotate 4s linear infinite;
}

@keyframes logoRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.logo-icon {
  font-size: 40px;
  color: white;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

:deep(.el-input) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.el-input:hover) {
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.el-input__wrapper) {
  background: transparent;
}

:deep(.el-input__inner) {
  color: white;
  font-size: 14px;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.8);
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.register-link span {
  margin-right: 5px;
}

:deep(.el-link) {
  color: #3b82f6;
  font-weight: 500;
}

:deep(.el-link:hover) {
  color: #60a5fa;
}

/* 底部信息 */
.footer {
  position: relative;
  z-index: 2;
  margin-top: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.footer p {
  margin: 5px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form-wrapper {
    padding: 30px 20px;
  }

  .title {
    font-size: 20px;
  }

  .logo {
    width: 60px;
    height: 60px;
  }

  .logo-icon {
    font-size: 30px;
  }
}
</style>