<template>
  <div class="ad-container">
    <div class="page-header">
      <h2>广告管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增广告
      </el-button>
    </div>

    <el-card shadow="hover" class="ad-card">
      <el-table :data="adList" style="width: 100%" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="imgUrl" label="图片" width="150">
          <template #default="scope">
            <el-image
              :src="scope.row.imgUrl"
              fit="cover"
              style="width: 70px; height: 125px; border-radius: 4px"
              :preview-src-list="[scope.row.imgUrl]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="targetUrl" label="跳转链接" min-width="200" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增广告' : '编辑广告'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="图片" prop="imgUrl">
          <div class="upload-container">
            <el-upload
              class="avatar-uploader"
              action="/admin/upload/upload"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :on-error="handleUploadError"
              :headers="uploadHeaders"
            >
              <div class="upload-area" v-if="!form.imgUrl">
                <el-icon class="upload-icon"><Plus /></el-icon>
              </div>
              <el-image
                v-else
                :src="form.imgUrl"
                fit="cover"
                style="width: 70px; height: 125px; border-radius: 4px; cursor: pointer"
                @click="form.imgUrl = ''"
                :preview-src-list="[form.imgUrl]"
              />
            </el-upload>
            <el-input
              v-model="form.imgUrl"
              placeholder="请输入广告图片链接"
              style="margin-top: 12px"
            />
          </div>
        </el-form-item>
        <el-form-item label="跳转链接" prop="targetUrl">
          <el-input v-model="form.targetUrl" placeholder="请输入跳转链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

const adList = ref([])
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const loading = ref(false)

// 计算上传headers
const uploadHeaders = computed(() => {
  return {
    token: sessionStorage.getItem('token')
  }
})

const form = reactive({
  id: null,
  imgUrl: '',
  targetUrl: ''
})

const rules = {
  imgUrl: [
    { required: true, message: '请输入图片链接', trigger: 'blur' }
  ],
  targetUrl: [
    { required: true, message: '请输入跳转链接', trigger: 'blur' }
  ]
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return ''
  }
}

// 获取广告列表
const getAdList = async () => {
  try {
    const response = await request.get('/admin/ad/list')
    adList.value = response.data
  } catch (error) {
    console.error('获取广告列表错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 新增广告
const handleAdd = () => {
  form.id = null
  form.imgUrl = ''
  form.targetUrl = ''
  dialogType.value = 'add'
  dialogVisible.value = true
}

// 编辑广告
const handleEdit = async (ad) => {
  try {
    const response = await request.get(`/admin/ad/${ad.id}`)
    const adData = response.data
    form.id = adData.id
    form.imgUrl = adData.imgUrl
    form.targetUrl = adData.targetUrl
    dialogType.value = 'edit'
    dialogVisible.value = true
  } catch (error) {
    console.error('获取广告详情错误:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 删除广告
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条广告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete('/admin/ad/delete', {
        params: { id }
      })
      ElMessage.success('删除成功')
      getAdList()
    } catch (error) {
      console.error('删除广告错误:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    
    const submitData = {
      imgUrl: form.imgUrl,
      targetUrl: form.targetUrl
    }
    if (form.id) {
      submitData.id = form.id
    }
    
    if (dialogType.value === 'add') {
      await request.post('/admin/ad/add', submitData)
    } else {
      await request.put('/admin/ad/edit', submitData)
    }
    
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
    dialogVisible.value = false
    getAdList()
  } catch (error) {
    console.error('提交表单错误:', error)
  } finally {
    loading.value = false
  }
}

// 图片上传成功处理
const handleUploadSuccess = (response, file) => {
  if (response.code === 1) {
    form.imgUrl = response.data
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

// 上传前验证
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    ElMessage.error('只能上传JPG/PNG图片')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }
  return true
}

// 上传错误处理
const handleUploadError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

// 页面加载时获取广告列表
onMounted(() => {
  getAdList()
})
</script>

<style scoped>
.ad-container {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #1a202c;
  font-size: 20px;
  font-weight: 600;
}

.ad-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.ad-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  background: #f8fafc;
}

:deep(.el-table th) {
  background: #f8fafc !important;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  height: 48px;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f1f5f9;
  height: 140px;
  vertical-align: middle;
}

:deep(.el-table tr:hover) {
  background: #f8fafc;
}

.upload-container {
  display: flex;
  flex-direction: column;
}

.upload-area {
  width: 70px;
  height: 125px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 36px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  position: relative;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
}

:deep(.el-dialog__close) {
  color: white !important;
  font-size: 20px !important;
  opacity: 1 !important;
}

:deep(.el-dialog__close:hover) {
  color: #f0f0f0 !important;
}

:deep(.el-dialog__body) {
  padding: 24px;
  background: #fafafa;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #475569;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--danger) {
  transition: all 0.3s ease;
}

:deep(.el-button--danger:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}
</style>