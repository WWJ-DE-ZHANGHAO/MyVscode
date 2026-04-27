<template>
  <div class="employee-manager-container">
    <h2 class="page-title">员工管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" label-width="80px" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入用户名或姓名" style="width: 300px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增员工
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 员工列表 -->
    <div class="employee-table">
      <el-table :data="employeeList" style="width: 100%">
        <el-table-column prop="id" label="员工ID" width="100" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="realName" label="真实姓名" width="150" />
        <el-table-column label="角色" width="150">
          <template #default="scope">
            {{ scope.row.roleName || '-' }}
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
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 新增/编辑员工对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :append-to-body="true"
    >
      <el-form :model="employeeForm" :rules="rules" ref="employeeFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="employeeForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="employeeForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!employeeForm.id">
          <el-input v-model="employeeForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-else>
          <el-input v-model="employeeForm.password" type="password" placeholder="留空则不修改密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="employeeForm.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 员工列表
const employeeList = ref([])

// 角色列表
const roleList = ref([])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const employeeFormRef = ref(null)
const employeeForm = reactive({
  id: null,
  username: '',
  realName: '',
  password: '',
  roleId: null
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取角色列表
const getRoleList = async () => {
  try {
    const res = await request.get('/admin/employee/roles')
    if (res && res.data) {
      roleList.value = res.data
    }
  } catch (error) {
    console.error('获取角色列表错误:', error)
  }
}

// 获取员工列表
const getEmployeeList = async () => {
  try {
    const params = {
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    
    const res = await request.get('/admin/employee/page', { params })
    
    if (res && res.data) {
      employeeList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取员工列表错误:', error)
    ElMessage.error('获取员工列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getEmployeeList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  pagination.currentPage = 1
  getEmployeeList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getEmployeeList()
}

// 分页页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getEmployeeList()
}

// 新增员工
const handleAdd = () => {
  dialogTitle.value = '新增员工'
  resetForm()
  dialogVisible.value = true
}

// 编辑员工
const handleEdit = (row) => {
  dialogTitle.value = '编辑员工'
  Object.assign(employeeForm, {
    id: row.id,
    username: row.username,
    realName: row.realName,
    password: '',
    roleId: row.roleId
  })
  dialogVisible.value = true
}

// 删除员工
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/employee/delete/${id}`)
    ElMessage.success('删除成功')
    getEmployeeList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除员工错误:', error)
      ElMessage.error(error.response?.data?.msg || '删除失败')
    }
  }
}

// 处理状态变化
const handleStatusChange = async (employee) => {
  try {
    await request.put(`/admin/employee/status/${employee.id}`, null, {
      params: { status: employee.status }
    })
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('更新员工状态错误:', error)
    employee.status = employee.status === 1 ? 0 : 1
    ElMessage.error(error.response?.data?.msg || '操作失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await employeeFormRef.value.validate()
    
    if (employeeForm.id) {
      // 编辑
      await request.put('/admin/employee/update', employeeForm)
      ElMessage.success('编辑成功')
    } else {
      // 新增
      await request.post('/admin/employee/add', employeeForm)
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
    getEmployeeList()
  } catch (error) {
    if (error !== false) {
      console.error('提交表单错误:', error)
      ElMessage.error(error.response?.data?.msg || '操作失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  employeeForm.id = null
  employeeForm.username = ''
  employeeForm.realName = ''
  employeeForm.password = ''
  employeeForm.roleId = null
  
  if (employeeFormRef.value) {
    employeeFormRef.value.clearValidate()
  }
}

// 初始化
onMounted(() => {
  getEmployeeList()
  getRoleList()
})
</script>

<style scoped>
.employee-manager-container {
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

.search-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
}

.employee-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
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

:deep(.el-button--success) {
  background-color: #67c23a;
  border-color: #67c23a;
  color: white;
}

:deep(.el-button--success:hover) {
  background-color: #85ce61;
  border-color: #85ce61;
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
}

.pagination-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}
</style>
