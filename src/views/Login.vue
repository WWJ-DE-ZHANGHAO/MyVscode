<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <div class="auth-header">
        <div class="logo">云图书城</div>
        <h2>欢迎回来</h2>
        <p class="subtitle">登录以继续访问您的书架与购物车</p>
      </div>

      <div class="mode-switch">
        <el-button :type="loginMode==='password' ? 'primary' : 'default'" @click="loginMode='password'">密码登录</el-button>
        <el-button :type="loginMode==='sms' ? 'primary' : 'default'" @click="loginMode='sms'">手机+验证码</el-button>
      </div>

      <div v-if="loginMode==='password'" class="form-block">
        <el-input v-model="username" placeholder="手机号或用户名" clearable />
        <el-input v-model="password" placeholder="密码" show-password clearable />

        <div class="actions">
          <el-button type="primary" @click="doPasswordLogin">登录</el-button>
          <el-button @click="goRegister">注册</el-button>
        </div>
      </div>

      <div v-else class="form-block">
        <el-input v-model="phone" placeholder="手机号" clearable />
        <div class="code-row">
          <el-input v-model="code" placeholder="验证码" clearable />
          <el-button @click="sendCode" :disabled="codeSent">{{ codeSent ? '已发送' : '发送验证码' }}</el-button>
        </div>

        <div class="actions">
          <el-button type="primary" @click="doSmsLogin">登录</el-button>
          <el-button @click="goRegister">注册</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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
    // 拦截器会自动处理 Result 格式，成功时返回 data 部分（UserLoginVo）
    const userData = await request.post('/user/user/login', { 
      username: username.value, 
      password: password.value 
    });
    
    // userData 包含 username, avatar, token
      if (userData && userData.token) {
        sessionStorage.setItem('authToken', userData.token);
        // 保存用户信息
        const userToSave = {
          username: userData.username,
          avatar: userData.avatar
        };
        saveCurrentUser(userToSave);
        // 通知布局更新头像
        window.dispatchEvent(new Event('user-updated'));
      
        ElMessage.success('登录成功！');
        router.push('/');
      }
  } catch (e) {
    // 错误已经在拦截器中处理
    console.error('登录失败:', e);
  }
}

const sendCode = async () => {
  if (!phone.value) { 
    ElMessage.warning('请输入手机号'); 
    return; 
  }
  try {
    // 拦截器会自动处理 Result 格式
    await request.post('/user/user/code', { phone: phone.value });
    codeSent.value = true;
    setTimeout(() => { codeSent.value = false; }, 60000);
    ElMessage.success('验证码已发送，请注意查收');
  } catch (e) {
    console.error('发送验证码失败:', e);
  }
}

const doSmsLogin = async () => {
  if (!phone.value || !code.value) { 
    ElMessage.warning('请填写手机号和验证码'); 
    return; 
  }

  try {
    // 拦截器会自动处理 Result 格式，成功时返回 data 部分（UserLoginVo）
    const userData = await request.post('/user/user/login', { 
      phone: phone.value, 
      code: code.value 
    });
    
    if (userData && userData.token) {
      sessionStorage.setItem('authToken', userData.token);
      const userToSave = {
        username: userData.username,
        avatar: userData.avatar
      };
      saveCurrentUser(userToSave);
      window.dispatchEvent(new Event('user-updated'));
      
      ElMessage.success('登录成功！');
      router.push('/');
    }
  } catch (e) {
    console.error('登录失败:', e);
  }
}

const goRegister = () => { 
  router.push('/register'); 
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f7ff 0%, #f6f9ff 100%);
  padding: 24px;
}

.auth-card {
  width: 460px;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(20, 96, 160, 0.08);
  background: #ffffff;
}

.auth-header {
  text-align: center;
  margin-bottom: 12px;
}
.auth-header .logo {
  font-weight: 900;
  color: #0072ff;
  font-size: 22px;
  margin-bottom: 6px;
}
.auth-header h2 { margin: 0; font-size: 20px; }
.auth-header .subtitle { color: #7f8fa4; font-size: 13px; margin-top: 6px; }

.mode-switch {
  display: flex;
  gap: 10px;
  margin: 14px 0;
  justify-content: center;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}

.code-row {
  display: flex;
  gap: 8px;
}

.code-row .el-input {
  flex: 1;
}

.auth-card h2 { display: none; }
</style>