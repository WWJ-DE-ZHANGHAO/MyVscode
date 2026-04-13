<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧：品牌与欢迎信息 -->
      <div class="auth-banner">
        <div class="banner-content">
          <h1 class="brand-title">云图书城</h1>
          <p class="brand-desc">探索知识的海洋，开启您的阅读之旅</p>
          <div class="illustration">
            <!-- 这里可以用一张精美的插画图片，暂时用 CSS 图形代替 -->
            <div class="book-icon">📚</div>
          </div>
        </div>
      </div>

      <!-- 右侧：登录表单 -->
      <div class="auth-form-wrapper">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>请登录您的账号以继续</p>
        </div>

        <!-- 登录方式切换 -->
        <div class="mode-tabs">
          <div 
            class="tab-item" 
            :class="{ active: loginMode === 'password' }" 
            @click="loginMode = 'password'"
          >
            密码登录
          </div>
          <div 
            class="tab-item" 
            :class="{ active: loginMode === 'sms' }" 
            @click="loginMode = 'sms'"
          >
            验证码登录
          </div>
        </div>

        <!-- 密码登录表单 -->
        <div v-if="loginMode === 'password'" class="form-body">
          <el-input 
            v-model="username" 
            placeholder="手机号 / 用户名" 
            prefix-icon="User"
            size="large"
            class="custom-input"
          />
          <el-input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock"
            show-password
            size="large"
            class="custom-input"
          />
          <div class="form-actions">
            <el-button type="primary" size="large" class="submit-btn" @click="doPasswordLogin">
              立即登录
            </el-button>
            <div class="form-footer">
              还没有账号？ <a @click="goRegister" class="link">去注册</a>
            </div>
          </div>
        </div>

        <!-- 验证码登录表单 -->
        <div v-else class="form-body">
          <el-input 
            v-model="phone" 
            placeholder="请输入手机号" 
            prefix-icon="Phone"
            size="large"
            class="custom-input"
          />
          <div class="code-group">
            <el-input 
              v-model="code" 
              placeholder="验证码" 
              prefix-icon="Key"
              size="large"
              class="custom-input"
            />
            <el-button 
              class="send-code-btn" 
              :disabled="codeSent" 
              @click="sendCode"
            >
              {{ codeSent ? `${60}s 后重试` : '获取验证码' }}
            </el-button>
          </div>
          <div class="form-actions">
            <el-button type="primary" size="large" class="submit-btn" @click="doSmsLogin">
              立即登录
            </el-button>
            <div class="form-footer">
              还没有账号？ <a @click="goRegister" class="link">去注册</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();

const loginMode = ref('password');
const username = ref('');
const password = ref('');
const phone = ref('');
const code = ref('');
const codeSent = ref(false);

const saveCurrentUser = (user) => {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}

const doPasswordLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请填写账号和密码');
    return;
  }
  try {
    const userData = await request.post('/user/user/login', { 
      username: username.value, 
      password: password.value 
    });
    if (userData && userData.token) {
      sessionStorage.setItem('authToken', userData.token);
      const userToSave = { username: userData.username, avatar: userData.avatar };
      saveCurrentUser(userToSave);
      window.dispatchEvent(new Event('user-updated'));
      ElMessage.success('登录成功！');
      router.push('/');
    }
  } catch (e) { console.error('登录失败:', e); }
}

const sendCode = async () => {
  if (!phone.value) { ElMessage.warning('请输入手机号'); return; }
  try {
    await request.post('/user/user/code', { phone: phone.value });
    codeSent.value = true;
    let count = 60;
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        codeSent.value = false;
      }
    }, 1000);
    ElMessage.success('验证码已发送');
  } catch (e) { console.error('发送失败:', e); }
}

const doSmsLogin = async () => {
  if (!phone.value || !code.value) { ElMessage.warning('请填写手机号和验证码'); return; }
  try {
    const userData = await request.post('/user/user/login', { phone: phone.value, code: code.value });
    if (userData && userData.token) {
      sessionStorage.setItem('authToken', userData.token);
      const userToSave = { username: userData.username, avatar: userData.avatar };
      saveCurrentUser(userToSave);
      window.dispatchEvent(new Event('user-updated'));
      ElMessage.success('登录成功！');
      router.push('/');
    }
  } catch (e) { console.error('登录失败:', e); }
}

const goRegister = () => { router.push('/register'); }
</script>

<style scoped>
/* 整体布局：全屏渐变背景 */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.auth-container {
  width: 900px;
  min-height: 550px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 左侧品牌区 */
.auth-banner {
  flex: 1;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  position: relative;
}

.brand-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.brand-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.illustration .book-icon {
  font-size: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* 右侧表单区 */
.auth-form-wrapper {
  flex: 1.2;
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 30px;
}

.form-header h2 {
  margin: 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
}

.form-header p {
  margin: 10px 0 0;
  color: #999;
  font-size: 14px;
}

/* 选项卡切换 */
.mode-tabs {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding-bottom: 12px;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  transition: all 0.3s;
  position: relative;
}

.tab-item.active {
  color: #667eea;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #667eea;
}

/* 表单元素 */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
  padding: 12px 16px;
  transition: all 0.3s;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #667eea inset;
}

.code-group {
  display: flex;
  gap: 10px;
}

.send-code-btn {
  width: 110px;
  border-radius: 8px;
  background: #f0f2f5;
  color: #667eea;
  border: none;
  font-weight: 500;
}

.send-code-btn:hover:not(:disabled) {
  background: #e6e8eb;
}

/* 按钮与底部 */
.submit-btn {
  width: 100%;
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-top: 10px;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.link {
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  margin-left: 4px;
}

.link:hover {
  text-decoration: underline;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .auth-container {
    width: 90%;
    flex-direction: column;
  }
  .auth-banner {
    display: none; /* 移动端隐藏左侧 */
  }
  .auth-form-wrapper {
    padding: 30px 20px;
  }
}
</style>