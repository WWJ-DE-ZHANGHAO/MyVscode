<template>
  <div class="stock-manage-container">
    <h2 class="page-title">库存管理</h2>
    
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
    
    <!-- 库存列表 -->
    <div class="stock-table">
      <el-table :data="stockList" style="width: 100%">
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column label="商品信息" min-width="400">
          <template #default="scope">
            <div class="product-info">
              <img v-if="scope.row.productIamge" :src="scope.row.productIamge" alt="商品图片" class="product-image" />
              <span class="product-name">{{ scope.row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stockNum" label="当前库存" width="120" />
        <el-table-column prop="saleStock" label="销售库存" width="120" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleAddStock(scope.row)">增加库存</el-button>
            <el-button size="small" type="danger" @click="handleReduceStock(scope.row)">减少库存</el-button>
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
    
    <!-- 库存调整弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
      :append-to-body="true"
    >
      <el-form :model="stockForm" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="stockForm.productName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input v-model="stockForm.stockNum" disabled />
        </el-form-item>
        <el-form-item label="调整数量" :error="stockForm.numError">
          <el-input 
            v-model.number="stockForm.num" 
            type="number" 
            min="1" 
            placeholder="请输入调整数量" 
            @input="validateNum"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return ''
    }
    return dateObj.toLocaleString('zh-CN', {
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

// 库存列表
const stockList = ref([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const stockForm = reactive({
  id: null,
  productName: '',
  stockNum: 0,
  num: 1,
  numError: ''
})

// 获取库存列表
const getStockList = async () => {
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
    
    const res = await request.get('/admin/stock/list', { params: data })
    
    if (res && res.data) {
      stockList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取库存列表错误:', error)
    ElMessage.error('获取库存列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getStockList()
}

// 重置
const handleReset = () => {
  searchForm.productId = null
  searchForm.keyword = ''
  pagination.currentPage = 1
  getStockList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getStockList()
}

// 分页页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getStockList()
}

// 增加库存
const handleAddStock = (stock) => {
  dialogTitle.value = '增加库存'
  stockForm.id = stock.id
  stockForm.productName = stock.productName
  stockForm.stockNum = stock.stockNum
  stockForm.num = 1
  stockForm.numError = ''
  dialogVisible.value = true
}

// 减少库存
const handleReduceStock = (stock) => {
  dialogTitle.value = '减少库存'
  stockForm.id = stock.id
  stockForm.productName = stock.productName
  stockForm.stockNum = stock.stockNum
  stockForm.num = 1
  stockForm.numError = ''
  dialogVisible.value = true
}

// 验证数量
const validateNum = () => {
  if (stockForm.num < 1) {
    stockForm.numError = '调整数量不能小于1'
  } else if (dialogTitle.value === '减少库存' && stockForm.num > stockForm.stockNum) {
    stockForm.numError = '减少数量不能大于当前库存'
  } else {
    stockForm.numError = ''
  }
}

// 确认调整
const handleConfirm = async () => {
  validateNum()
  if (stockForm.numError) {
    return
  }
  
  try {
    const url = dialogTitle.value === '增加库存' ? '/admin/stock/add/' : '/admin/stock/reduce/'
    await request.put(url, null, {
      params: {
        id: stockForm.id,
        num: stockForm.num
      }
    })
    ElMessage.success(dialogTitle.value + '成功')
    dialogVisible.value = false
    getStockList()
  } catch (error) {
    console.error(dialogTitle.value + '错误:', error)
    ElMessage.error(dialogTitle.value + '失败')
  }
}

// 初始化
onMounted(() => {
  getStockList()
})
</script>

<style scoped>
.stock-manage-container {
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

.stock-table {
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
  width: 60px;
  height: 80px;
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

.pagination-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-top: 1px solid #dcdfe6;
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