<template>
  <div class="category-container">
    <h2 class="page-title">分类管理</h2>
    
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
    </div>
    
    <!-- 分类列表 -->
    <div class="category-table">
      <el-table :data="categoryList" style="width: 100%" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column label="隐藏/显示" width="120">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              :active-value="1" 
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
      :append-to-body="true"
    >
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch 
            v-model="categoryForm.status" 
            :active-value="1" 
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 分类列表
const categoryList = ref([])

// 父分类列表（用于选择）
const parentCategories = ref([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
// 新增/编辑表单
const categoryForm = reactive({
  id: null,
  name: '',
  status: 1
})

// 获取分类列表
const getCategoryList = async () => {
  try {
    console.log('开始获取分类列表...')
    const res = await request.get('/admin/category/list')
    console.log('获取分类列表响应:', res)
    if (res && res.data) {
      console.log('分类数据:', res.data)
      categoryList.value = res.data
      console.log('categoryList长度:', categoryList.value.length)
      // 过滤出顶级分类作为父分类选项（如果数据中包含level字段）
      parentCategories.value = categoryList.value.filter(item => item.level === 1 || !item.level)
      console.log('parentCategories长度:', parentCategories.value.length)
    } else {
      console.log('响应格式不正确:', res)
    }
  } catch (error) {
    console.error('获取分类列表错误:', error)
    ElMessage.error('获取分类列表失败')
  }
}

// 新增分类
const handleAdd = () => {
  dialogTitle.value = '新增分类'
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.status = 1
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (category) => {
  dialogTitle.value = '编辑分类'
  categoryForm.id = category.id
  categoryForm.name = category.name
  categoryForm.status = category.status
  dialogVisible.value = true
}

// 删除分类
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/admin/category/delete/${id}`)
      ElMessage.success('删除成功')
      getCategoryList()
    } catch (error) {
      console.error('删除分类错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 处理状态变化
const handleStatusChange = async (category) => {
  try {
    await request.put(`/admin/category/status/${category.id}`)
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('更新分类状态错误:', error)
    // 恢复原始状态
    category.status = category.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (categoryForm.id) {
      // 编辑
      await request.put('/admin/category/update', categoryForm)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await request.post('/admin/category/add', categoryForm)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getCategoryList()
  } catch (error) {
    console.error('保存分类错误:', error)
    ElMessage.error('保存失败')
  }
}

// 初始化
onMounted(() => {
  getCategoryList()
})
</script>

<style scoped>
.category-container {
  padding: 24px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.category-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-top: 1px solid #dcdfe6;
}

/* 操作按钮在表格中的对齐 */
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中（根据需要改为 flex-start 或 flex-end） */
}
.category-table .action-buttons .el-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}
</style>