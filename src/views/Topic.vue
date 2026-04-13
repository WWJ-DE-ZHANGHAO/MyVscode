<template>
  <div class="topic-container">
    <h2 class="page-title">专题管理</h2>
    
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增
      </el-button>
    </div>
    
    <!-- 专题列表 -->
    <div class="topic-table">
      <el-table :data="topicList" style="width: 100%">
        <el-table-column label="封面图片" width="120">
          <template #default="scope">
            <el-image 
              :src="scope.row.coverUrl" 
              :preview-src-list="[scope.row.coverUrl]"
              style="width: 80px; height: 80px; object-fit: cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="专题名" min-width="200" />
        <el-table-column prop="type" label="专题类型" min-width="150" />
        <el-table-column prop="categoryId" label="分类ID" width="100" />
        <el-table-column prop="description" label="描述" min-width="300" />
        <el-table-column label="专题状态" width="120">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              :active-value="1" 
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :append-to-body="true"
    >
      <el-form :model="topicForm" label-width="100px">
        <el-form-item label="专题类型" required>
          <el-input v-model="topicForm.type" placeholder="请输入专题类型" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="topicForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option 
              v-for="category in categoryList" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专题标题" required>
          <el-input v-model="topicForm.title" placeholder="请输入专题标题" />
        </el-form-item>
        <el-form-item label="专题描述" required>
          <el-input 
            v-model="topicForm.description" 
            placeholder="请输入专题描述"
            type="textarea"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="封面图片" required>
          <div class="upload-container">
            <el-upload
              class="avatar-uploader"
              action="/admin/upload/upload"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :headers="uploadHeaders"
              accept="image/*"
            >
              <el-image 
                v-if="topicForm.coverUrl" 
                :src="topicForm.coverUrl" 
                style="width: 150px; height: 150px; object-fit: cover"
              />
              <div v-else class="upload-placeholder">
                <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch 
            v-model="topicForm.status" 
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
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 专题列表
const topicList = ref([])

// 分类列表
const categoryList = ref([])

// 计算上传headers
const uploadHeaders = computed(() => {
  return {
    token: sessionStorage.getItem('token')
  }
})

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const topicForm = reactive({
  id: null,
  type: '',
  categoryId: null,
  title: '',
  description: '',
  coverUrl: '',
  status: 1
})

// 获取专题列表
const getTopicList = async () => {
  try {
    const res = await request.get('/admin/topic/list')
    if (res && res.data) {
      topicList.value = res.data
    }
  } catch (error) {
    console.error('获取专题列表错误:', error)
    ElMessage.error('获取专题列表失败')
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const res = await request.get('/admin/category/list')
    if (res && res.data) {
      categoryList.value = res.data
    }
  } catch (error) {
    console.error('获取分类列表错误:', error)
  }
}

// 新增专题
const handleAdd = () => {
  dialogTitle.value = '新增专题'
  topicForm.id = null
  topicForm.type = ''
  topicForm.categoryId = null
  topicForm.title = ''
  topicForm.description = ''
  topicForm.coverUrl = ''
  topicForm.status = 1
  dialogVisible.value = true
}

// 编辑专题
const handleEdit = async (topic) => {
  try {
    const res = await request.get(`/admin/topic/detail/${topic.id}`)
    if (res && res.data) {
      const data = res.data
      topicForm.id = data.id
      topicForm.type = data.type
      topicForm.categoryId = data.categoryId
      topicForm.title = data.title
      topicForm.description = data.description
      topicForm.coverUrl = data.coverUrl
      topicForm.status = data.status
      dialogTitle.value = '编辑专题'
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取专题详情错误:', error)
    ElMessage.error('获取专题详情失败')
  }
}

// 删除专题
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个专题吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/admin/topic/delete/${id}`)
      ElMessage.success('删除成功')
      getTopicList()
    } catch (error) {
      console.error('删除专题错误:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 处理状态变化
const handleStatusChange = async (topic) => {
  try {
    await request.put(`/admin/topic/status/${topic.id}`)
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('更新专题状态错误:', error)
    // 恢复原始状态
    topic.status = topic.status === 1 ? 0 : 1
    ElMessage.error('操作失败')
  }
}

// 处理图片上传成功
const handleUploadSuccess = (response) => {
  if (response && response.code === 1 && response.data) {
    topicForm.coverUrl = response.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败')
  }
}

// 上传前校验
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJpgOrPng) {
    ElMessage.error('只能上传 JPG/PNG 图片')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
  }
  
  return isJpgOrPng && isLt2M
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (topicForm.id) {
      // 编辑
      await request.put('/admin/topic/update', topicForm)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await request.post('/admin/topic/add', topicForm)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getTopicList()
  } catch (error) {
    console.error('保存专题错误:', error)
    ElMessage.error('保存失败')
  }
}

// 初始化
onMounted(() => {
  getTopicList()
  getCategoryList()
})
</script>

<style scoped>
.topic-container {
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

.topic-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.upload-container {
  margin-top: 8px;
}

.upload-placeholder {
  width: 150px;
  height: 150px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9f9f9;
}

.upload-placeholder:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.avatar-uploader-icon {
  font-size: 36px;
  color: #c0c4cc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-top: 1px solid #dcdfe6;
}
</style>