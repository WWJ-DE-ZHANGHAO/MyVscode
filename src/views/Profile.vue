<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人资料</h2>
    </div>

    <el-card shadow="hover" class="profile-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码（不修改请留空）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  id: null,
  username: '',
  realName: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ]
}

const getUserInfo = async () => {
  try {
    const res = await request.get('/admin/admin/get')
    const userInfo = res.data
    form.id = userInfo.id
    form.username = userInfo.username
    form.realName = userInfo.realName
  } catch (error) {
    console.error('获取用户信息错误:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    
    const submitData = {
      id: form.id,
      username: form.username,
      realName: form.realName
    }
    
    if (form.password) {
      submitData.password = form.password
    }
    
    await request.post('/admin/admin/update', submitData)
    ElMessage.success('修改成功')
    sessionStorage.setItem('username', form.username)
  } catch (error) {
    console.error('提交表单错误:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 24px;
  height: 100%;
  background: #f5f7fa;
  overflow: hidden;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--text-h);
}

.profile-card {
  max-width: 600px;
}
</style>
