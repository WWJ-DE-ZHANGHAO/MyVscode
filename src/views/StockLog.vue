<template>
  <div class="stock-log-container">
    <h2 class="page-title">库存日志</h2>
    
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="商品ID">
          <el-input v-model="searchForm.productId" placeholder="请输入商品ID" style="width: 150px" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入商品名称" style="width: 200px" />
        </el-form-item>
      </el-form>
      <div class="search-actions">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>
    
    <!-- 库存日志列表 -->
    <div class="stock-log-table">
      <el-table :data="stockLogList" style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="100" />
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column label="商品信息" min-width="300">
          <template #default="scope">
            <div class="product-info">
              <img v-if="scope.row.productImage" :src="scope.row.productImage" alt="商品图片" class="product-image" />
              <span class="product-name">{{ scope.row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变动数量" width="120">
          <template #default="scope">
            <span :class="scope.row.changeNum > 0 ? 'increase' : 'decrease'">
              {{ scope.row.changeNum > 0 ? '+' : '' }}{{ scope.row.changeNum }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="adminUsername" label="操作人" width="120" />
        <el-table-column label="操作时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  productId: null,
  keyword: ''
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 库存日志列表
const stockLogList = ref([])

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取库存日志列表
const getStockLogList = async () => {
  try {
    const data = {
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.productId) {
      data.productId = searchForm.productId
    }
    
    if (searchForm.keyword) {
      data.keyword = searchForm.keyword
    }
    
    const res = await request.get('/admin/stock-log/list', { params: data })
    
    if (res && res.data) {
      stockLogList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取库存日志列表错误:', error)
    ElMessage.error('获取库存日志列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getStockLogList()
}

// 重置
const handleReset = () => {
  searchForm.productId = null
  searchForm.keyword = ''
  pagination.currentPage = 1
  getStockLogList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getStockLogList()
}

// 分页页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getStockLogList()
}

// 删除库存日志
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条库存日志吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/stock-log/delete/${id}`)
    ElMessage.success('删除成功')
    getStockLogList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除库存日志错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  getStockLogList()
})
</script>

<style scoped>
.stock-log-container {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.stock-log-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.product-name {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: #303133;
  font-weight: 500;
}

.increase {
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
  background: rgba(103, 194, 58, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.decrease {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
  background: rgba(245, 108, 108, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.pagination-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}

/* 统一按钮样式 */
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

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
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
</style>