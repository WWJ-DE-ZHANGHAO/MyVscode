<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧装饰 -->
      <div class="auth-banner">
        <div class="banner-content">
          <h1 class="brand-title">加入我们</h1>
          <p class="brand-desc">开启您的专属阅读空间</p>
          <div class="illustration">
            <div class="pen-icon">✍️</div>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="auth-form-wrapper">
        <div class="form-header">
          <h2>创建账号</h2>
          <p>填写以下信息，只需一分钟</p>
        </div>

        <div class="form-body">
          <div class="input-group">
            <label>手机号</label>
            <el-input 
              v-model="phone" 
              placeholder="请输入手机号" 
              prefix-icon="Phone"
              size="large"
              class="custom-input"
            />
          </div>

          <div class="input-group">
            <label>用户名</label>
            <el-input 
              v-model="username" 
              placeholder="请设置用户名" 
              prefix-icon="User"
              size="large"
              class="custom-input"
            />
          </div>

          <div class="input-group">
            <label>密码</label>
            <el-input 
              v-model="password" 
              type="password" 
              placeholder="至少6位字符" 
              prefix-icon="Lock"
              show-password
              size="large"
              class="custom-input"
            />
          </div>

          <div class="form-actions">
            <el-button type="primary" size="large" class="submit-btn" @click="doRegister">
              立即注册
            </el-button>
            <div class="form-footer">
              已有账号？ <a @click="goLogin" class="link">去登录</a>
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

const phone = ref('');
const username = ref('');
const password = ref('');

const validatePhone = (p) => /^1\d{10}$/.test(p);

const saveCurrentUser = (user) => { 
  sessionStorage.setItem('currentUser', JSON.stringify(user)); 
}

const doRegister = async () => {
  if (!phone.value || !username.value || !password.value) { 
    ElMessage.warning('请完整填写信息'); 
    return; 
  }
  if (!validatePhone(phone.value)) { 
    ElMessage.error('手机号格式错误'); 
    return; 
  }
  if (password.value.length < 6) { 
    ElMessage.warning('密码至少6位'); 
    return; 
  }

  try {
    const userData = await request.post('/user/user/register', { 
      phone: phone.value, 
      username: username.value, 
      password: password.value 
    });
    
    if (userData && userData.token) {
      sessionStorage.setItem('authToken', userData.token);
      const userToSave = { username: userData.username, avatar: userData.avatar };
      saveCurrentUser(userToSave);
      window.dispatchEvent(new Event('user-updated'));
      
      ElMessage.success('注册成功！');
      router.push('/');
    }
  } catch (e) {
    console.error('注册失败:', e);
  }
}

const goLogin = () => { router.push('/login'); }
</script>

<style scoped>
/* 复用登录页的样式逻辑 */
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
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}

.brand-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.brand-desc {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.illustration .pen-icon {
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

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
  padding: 12px 16px;
  transition: all 0.3s;
}

.custom-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #764ba2 inset;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(118,75,162,0.12);
  border-color: #764ba2;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
}

.form-footer {
  margin-top: 8px;
  color: #999;
  font-size: 14px;
}

.link {
  color: #764ba2;
  cursor: pointer;
}

@media (max-width: 800px) {
  .auth-container {
    width: 95%;
    flex-direction: column;
  }
  .auth-banner { display: none; }
  .auth-form-wrapper { flex: 1; padding: 30px; }
}

</style>