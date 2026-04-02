<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <h2>注册</h2>

      <div class="form-block">
        <el-input v-model="phone" placeholder="手机号" clearable />
        <el-input v-model="username" placeholder="用户名" clearable />
        <el-input v-model="password" placeholder="密码（至少6位）" show-password clearable />

        <div class="actions">
          <el-button type="primary" @click="doRegister">完成</el-button>
          <el-button @click="goLogin">去登录</el-button>
        </div>
      </div>
    </el-card>
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

const validatePhone = (p) => {
  return /^1\d{10}$/.test(p);
}

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
    // 拦截器会自动处理 Result 格式，成功时返回 data 部分
    const userData = await request.post('/user/user/register', { 
      phone: phone.value, 
      username: username.value, 
      password: password.value 
    });
    
    if (userData && userData.token) {
      sessionStorage.setItem('authToken', userData.token);
      const userToSave = {
        username: userData.username,
        avatar: userData.avatar
      };
      saveCurrentUser(userToSave);
      window.dispatchEvent(new Event('user-updated'));
      
      ElMessage.success('注册成功！');
      router.push('/');
    }
  } catch (e) {
    console.error('注册失败:', e);
  }
}

const goLogin = () => { 
  router.push('/login'); 
}
</script>

<style scoped>
.auth-page { 
  display: flex; 
  justify-content: center; 
  padding: 40px 20px; 
}

.auth-card { 
  width: 420px; 
  padding: 20px; 
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
</style>