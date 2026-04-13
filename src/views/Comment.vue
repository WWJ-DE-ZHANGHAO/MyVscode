<template>
  <div class="comment-manage-container">
    <h2 class="page-title">评价管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-container">
      <div class="search-fields">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="商品名称">
            <el-input v-model="searchForm.ProductName" placeholder="请输入商品名称" style="width: 180px" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="searchForm.UserName" placeholder="请输入用户名" style="width: 180px" />
          </el-form-item>
          <el-form-item label="评分">
            <el-select v-model="searchForm.Score" placeholder="请选择评分" style="width: 100px">
              <el-option label="1星" value="1" />
              <el-option label="2星" value="2" />
              <el-option label="3星" value="3" />
              <el-option label="4星" value="4" />
              <el-option label="5星" value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="审核状态">
            <el-select v-model="searchForm.AuditStatus" placeholder="请选择审核状态" style="width: 120px">
              <el-option label="未审核" value="0" />
              <el-option label="通过" value="1" />
              <el-option label="未通过" value="2" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <div class="search-actions">
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>
    
    <!-- 批量操作 -->
    <!-- 批量删除按钮已移到搜索区域 -->
    
    <!-- 评价列表 -->
    <div class="comment-table">
      <el-table 
        :data="commentList" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="评价ID" width="100">
          <template #default="scope">
            {{ getCommentData(scope.row).id }}
          </template>
        </el-table-column>
        <el-table-column label="商品名称" width="150">
          <template #default="scope">
            {{ scope.row.productName || scope.row.bookName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="评分" width="150">
          <template #default="scope">
            <el-rate 
              :model-value="Number(getCommentData(scope.row).score || 0)" 
              :max="5" 
              disabled 
              allow-half
            />
            <span style="margin-left: 8px; font-size: 12px;">
              {{ Number(getCommentData(scope.row).score || 0).toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="评价图片" width="200">
          <template #default="scope">
            <div class="images-container">
              <template v-if="getImages(scope.row).length > 0">
                <el-image 
                  v-for="(image, index) in getImages(scope.row).slice(0, 3)" 
                  :key="index"
                  :src="image" 
                  fit="cover" 
                  class="comment-image"
                  :preview-src-list="getImages(scope.row)"
                />
              </template>
              <span v-else class="no-image">无图片</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="200">
          <template #default="scope">
            {{ getCommentData(scope.row).content }}
          </template>
        </el-table-column>
        <el-table-column label="评价时间" width="180">
          <template #default="scope">
            {{ formatDate(getCommentData(scope.row).createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="用户名" width="120">
          <template #default="scope">
            {{ scope.row.userName }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="scope">
            <el-tag :type="getAuditStatusType(getCommentData(scope.row).auditStatus)">
              {{ getAuditStatusText(getCommentData(scope.row).auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleAudit(getCommentData(scope.row))">审核</el-button>
            <el-button size="small" type="primary" @click="handleReply(getCommentData(scope.row))">回复</el-button>
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
    
    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditDialogVisible"
      title="审核评价"
      width="600px"
      :append-to-body="true"
    >
      <div v-if="currentComment" class="audit-content">
        <div class="audit-item">
          <span class="label">商品名称：</span>
          <span class="value">{{ currentComment.productName || currentComment.bookName || '-' }}</span>
        </div>
        <div class="audit-item">
          <span class="label">用户名：</span>
          <span class="value">{{ currentComment.userName }}</span>
        </div>
        <div class="audit-item">
          <span class="label">评分：</span>
          <el-rate 
            :model-value="Number(getCommentData(currentComment).score || 0)" 
            :max="5" 
            disabled 
            allow-half
          />
          <span style="margin-left: 8px; font-size: 12px;">
            {{ Number(getCommentData(currentComment).score || 0).toFixed(1) }}
          </span>
        </div>
        <div class="audit-item">
          <span class="label">评价内容：</span>
          <div class="content-value">{{ getCommentData(currentComment).content }}</div>
        </div>
        <div class="audit-item">
          <span class="label">评价图片：</span>
          <div class="images-container">
            <template v-if="getImages(currentComment).length > 0">
              <el-image 
                v-for="(image, index) in getImages(currentComment)" 
                :key="index" 
                :src="image" 
                fit="cover" 
                class="audit-image"
                :preview-src-list="getImages(currentComment)"
              />
            </template>
            <span v-else>无</span>
          </div>
        </div>
      </div>
      <div v-else class="loading">加载中...</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="success" @click="handleAgreeAudit">通过</el-button>
          <el-button type="danger" @click="handleRefuseAudit">拒绝</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 回复弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评价"
      width="500px"
      :append-to-body="true"
    >
      <el-form :model="replyForm" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="replyForm.productName" disabled />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="replyForm.content" type="textarea" disabled />
        </el-form-item>
        <el-form-item label="回复内容" :error="replyForm.replyError">
          <el-input 
            v-model="replyForm.reply" 
            type="textarea" 
            rows="4" 
            placeholder="请输入回复内容" 
            @input="validateReply"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="replyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmReply">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  ProductName: '',
  UserName: '',
  Score: null,
  AuditStatus: null
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 评价列表
const commentList = ref([])

// 选中的评价ID
const selectedIds = ref([])

// 审核弹窗
const auditDialogVisible = ref(false)
const currentComment = ref(null)

// 回复弹窗
const replyDialogVisible = ref(false)
const replyForm = reactive({
  commentId: null,
  productName: '',
  content: '',
  reply: '',
  replyError: ''
})

// 安全获取评论数据
const getCommentData = (row) => {
  return row.comment || row
}

// 安全获取图片列表
const getImages = (row) => {
  const comment = getCommentData(row)
  const images = comment.images
  
  if (!images) return []
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      return [images]
    }
  }
  return []
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取审核状态文本
const getAuditStatusText = (status) => {
  const statusMap = {
    0: '未审核',
    1: '通过',
    2: '未通过'
  }
  return statusMap[status] || '未知'
}

// 获取审核状态标签类型
const getAuditStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取评价列表
const getCommentList = async () => {
  try {
    const params = {
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.ProductName) {
      params.ProductName = searchForm.ProductName
    }
    
    if (searchForm.UserName) {
      params.UserName = searchForm.UserName
    }
    
    if (searchForm.Score !== null) {
      params.Score = searchForm.Score
    }
    
    if (searchForm.AuditStatus !== null) {
      params.AuditStatus = searchForm.AuditStatus
    }
    
    const res = await request.get('/admin/comment/list', { params })
    
    console.log('评价列表响应:', res)
    
    // 兼容多种响应格式
    let list = []
    let total = 0
    
    if (res && res.data) {
      if (Array.isArray(res.data)) {
        list = res.data
        total = res.data.length
      } else if (res.data.list) {
        list = res.data.list
        total = res.data.total || 0
      } else if (res.data.records) {
        list = res.data.records
        total = res.data.total || 0
      }
    } else if (Array.isArray(res)) {
      list = res
      total = res.length
    }
    
    commentList.value = list
    pagination.total = total
    
    // 调试：打印图片数据
    list.forEach(item => {
      console.log('评价图片:', item.comment?.images, item.images)
    })
  } catch (error) {
    console.error('获取评价列表错误:', error)
    ElMessage.error('获取评价列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getCommentList()
}

// 重置
const handleReset = () => {
  searchForm.ProductName = ''
  searchForm.UserName = ''
  searchForm.Score = null
  searchForm.AuditStatus = null
  pagination.currentPage = 1
  getCommentList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getCommentList()
}

// 分页页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getCommentList()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => getCommentData(item).id)
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的评价')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要删除选中的评价吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete('/admin/comment/delete', {
      data: selectedIds.value
    })
    ElMessage.success('删除成功')
    selectedIds.value = []
    getCommentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评价错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 审核
const handleAudit = (comment) => {
  // 查找完整的评价信息
  const fullComment = commentList.value.find(item => getCommentData(item).id === comment.id)
  if (fullComment) {
    currentComment.value = { ...fullComment }
    auditDialogVisible.value = true
  }
}

// 审核通过
const handleAgreeAudit = async () => {
  if (!currentComment.value) return
  
  try {
    await request.put(`/admin/comment/agree/${getCommentData(currentComment.value).id}`)
    ElMessage.success('审核通过成功')
    auditDialogVisible.value = false
    getCommentList()
  } catch (error) {
    console.error('审核通过错误:', error)
    ElMessage.error('审核通过失败')
  }
}

// 审核拒绝
const handleRefuseAudit = async () => {
  if (!currentComment.value) return
  
  try {
    await request.put(`/admin/comment/refuse/${getCommentData(currentComment.value).id}`)
    ElMessage.success('审核拒绝成功')
    auditDialogVisible.value = false
    getCommentList()
  } catch (error) {
    console.error('审核拒绝错误:', error)
    ElMessage.error('审核拒绝失败')
  }
}

// 回复
const handleReply = (comment) => {
  // 查找完整的评价信息
  const fullComment = commentList.value.find(item => getCommentData(item).id === comment.id)
  if (fullComment) {
    replyForm.commentId = comment.id
    replyForm.productName = fullComment.productName
    replyForm.content = comment.content
    replyForm.reply = comment.replyContent || ''
    replyForm.replyError = ''
    replyDialogVisible.value = true
  }
}

// 验证回复内容
const validateReply = () => {
  if (!replyForm.reply || replyForm.reply.trim() === '') {
    replyForm.replyError = '回复内容不能为空'
  } else {
    replyForm.replyError = ''
  }
}

// 确认回复
const handleConfirmReply = async () => {
  validateReply()
  if (replyForm.replyError) {
    return
  }
  
  try {
    await request.post('/admin/comment/reply/', {
      commentId: replyForm.commentId,
      reply: replyForm.reply
    })
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    getCommentList()
  } catch (error) {
    console.error('回复错误:', error)
    ElMessage.error('回复失败')
  }
}

// 初始化
onMounted(() => {
  getCommentList()
})
</script>

<style scoped>
.comment-manage-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  max-width: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.search-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.comment-table {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  width: 100%;
  overflow-x: auto;
}

.comment-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-right: 8px;
}

.images-container {
  display: flex;
  align-items: center;
}

.pagination-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.audit-content {
  padding: 20px;
}

.audit-item {
  margin-bottom: 15px;
}

.audit-item .label {
  font-weight: bold;
  margin-right: 10px;
  display: inline-block;
  width: 100px;
}

.audit-item .content-value {
  display: inline-block;
  vertical-align: top;
  max-width: 400px;
  word-break: break-word;
}

.images-container {
  display: inline-flex;
  gap: 10px;
  vertical-align: top;
}

.audit-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>