<template>
  <div class="register-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="grid"></div>
      <div class="hexagons">
        <div class="hexagon hexagon-1"></div>
        <div class="hexagon hexagon-2"></div>
        <div class="hexagon hexagon-3"></div>
      </div>
      <div class="wave-lines">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
    </div>

    <!-- 注册表单 -->
    <div class="register-form-container">
      <div class="register-form-wrapper">
        <div class="logo-section">
          <div class="logo">
            <el-icon class="logo-icon"><Reading /></el-icon>
          </div>
          <h1 class="title">云图书城管理端</h1>
          <p class="subtitle">注册新账号</p>
        </div>

        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" class="register-form">
          <el-form-item prop="username">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" prefix-icon="UserFilled" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" />
          </el-form-item>
          <el-form-item prop="realName">
            <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" prefix-icon="Avatar" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="register-button" @click="handleRegister" :loading="loading">
              注册
            </el-button>
          </el-form-item>
          <div class="login-link">
            <span>已有账号？</span>
            <el-link type="primary" @click="goToLogin">去登录</el-link>
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
import { Reading, UserFilled, Lock, Avatar } from '@element-plus/icons-vue'
import axios from 'axios'
const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  realName: ''
})

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    // 调用后端注册接口
    const response = await axios.post('/admin/admin/register', registerForm, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.data.code === 200) {
      // 注册成功，存储token和用户名
      const data = response.data.data
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('username', data.username)
      ElMessage.success('注册成功')
      router.push('/home')
    } else {
      ElMessage.error(response.data.message || '注册失败')
    }
  } catch (error) {
    console.error('注册错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
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
  background-size: 40px 40px;
  animation: gridMove 15s linear infinite;
}

@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}

.hexagons {
  position: relative;
  width: 100%;
  height: 100%;
}

.hexagon {
  position: absolute;
  width: 100px;
  height: 87px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.3) 0%, rgba(240, 147, 251, 0) 70%);
  animation: hexagonRotate 6s ease-in-out infinite;
}

.hexagon::before,
.hexagon::after {
  content: '';
  position: absolute;
  width: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
}

.hexagon::before {
  bottom: 100%;
  border-bottom: 43px solid rgba(240, 147, 251, 0.3);
}

.hexagon::after {
  top: 100%;
  border-top: 43px solid rgba(240, 147, 251, 0.3);
}

.hexagon-1 {
  top: 15%;
  left: 15%;
  animation-delay: 0s;
}

.hexagon-2 {
  bottom: 15%;
  right: 15%;
  animation-delay: 2s;
}

.hexagon-3 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

@keyframes hexagonRotate {
  0%, 100% {
    transform: rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: rotate(360deg);
    opacity: 0.8;
  }
}

.wave-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.wave {
  position: absolute;
  width: 200%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(240, 147, 251, 0.5), transparent);
  animation: waveMove 10s linear infinite;
}

.wave-1 {
  top: 30%;
  left: -100%;
  animation-delay: 0s;
}

.wave-2 {
  top: 60%;
  left: -100%;
  animation-delay: 3s;
}

.wave-3 {
  top: 90%;
  left: -100%;
  animation-delay: 6s;
}

@keyframes waveMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(50%);
  }
}

/* 注册表单 */
.register-form-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
}

.register-form-wrapper {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.register-form-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.register-form-wrapper:hover::before {
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
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
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

.register-form {
  margin-top: 20px;
}

:deep(.el-input) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.el-input:hover) {
  border-color: rgba(240, 147, 251, 0.8);
  box-shadow: 0 0 0 2px rgba(240, 147, 251, 0.2);
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

.register-button {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
}

.register-button:active {
  transform: translateY(0);
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.login-link span {
  margin-right: 5px;
}

:deep(.el-link) {
  color: #f093fb;
  font-weight: 500;
}

:deep(.el-link:hover) {
  color: #f5576c;
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
  .register-form-wrapper {
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