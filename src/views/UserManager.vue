<template>
  <div class="user-manager-container">
    <h2 class="page-title">用户管理</h2>
    
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" style="width: 200px" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" style="width: 120px">
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getUserList">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetForm">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 用户列表 -->
    <div class="user-table">
      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="phone" label="手机号码" width="150" />
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar" />
          </template>
        </el-table-column>
        <el-table-column label="性别" width="100">
          <template #default="scope">
            {{ getGenderText(scope.row.gender) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              :active-value="1" 
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 用户列表
const userList = ref([])

// 分页参数
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  username: '',
  phone: '',
  status: null
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取性别文本
const getGenderText = (gender) => {
  switch (gender) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 获取用户列表
const getUserList = async () => {
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      username: searchForm.username,
      phone: searchForm.phone,
      status: searchForm.status
    }
    
    const res = await request.get('/admin/userManager/list', { params })
    if (res && res.data) {
      userList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取用户列表错误:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 重置表单
const resetForm = () => {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.status = null
  pageNo.value = 1
  getUserList()
}

// 处理状态变化
const handleStatusChange = async (user) => {
  try {
    const res = await request.get('/admin/userManager/updateStatus', {
      params: { id: user.id }
    })
    if (res) {
      ElMessage.success('操作成功')
    }
  } catch (error) {
    console.error('更新用户状态错误:', error)
    // 恢复原始状态
    user.status = user.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  getUserList()
}

// 处理页码变化
const handleCurrentChange = (current) => {
  pageNo.value = current
  getUserList()
}

// 初始化
onMounted(() => {
  getUserList()
})
</script>

<style scoped>
.user-manager-container {
  padding: 24px;
  height: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.user-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.pagination {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>