<template>
  <div class="order-list-container">
    <h2 class="page-title">订单管理</h2>
    
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.id" placeholder="请输入订单号" style="width: 200px" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态" style="width: 180px">
            <el-option label="待付款" value="1" />
            <el-option label="待发货" value="2" />
            <el-option label="待收货" value="3" />
            <el-option label="已收货" value="4" />
            <el-option label="已取消" value="6" />
            <el-option label="售后" value="5" />
          </el-select>
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
    
    <!-- 订单列表 -->
    <div class="order-table">
      <el-table :data="orderList" style="width: 100%">
        <el-table-column prop="id" label="订单号" min-width="220" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column label="支付方式" width="100">
          <template #default="scope">
            {{ getPaymentMethod(scope.row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column label="实付金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.actualPay || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.orderTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.orderStatus, scope.row.refundStatus)">
              {{ getStatusText(scope.row.orderStatus, scope.row.refundStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row.id)">详情</el-button>
            <!-- 待发货订单显示发货按钮 -->
            <el-button 
              v-if="scope.row.orderStatus === 2" 
              size="small" 
              type="primary" 
              @click="handleDelivery(scope.row.id)"
            >
              发货
            </el-button>
            <!-- 售后中订单显示同意按钮 -->
            <el-button 
              v-else-if="scope.row.orderStatus === 5 && scope.row.refundStatus === 1" 
              size="small" 
              type="success" 
              @click="handleAgree(scope.row.id)"
            >
              同意
            </el-button>
            <!-- 其他订单（待付款、待发货、待收货）显示取消按钮 -->
            <el-button 
              v-else-if="[1, 2, 3].includes(scope.row.orderStatus)" 
              size="small" 
              type="danger" 
              @click="handleCancel(scope.row.id)"
            >
              取消
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
    
    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="订单详情"
      width="60%"
      :append-to-body="true"
    >
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-header">
          <div class="header-row">
            <div class="header-item">
              <span class="label">订单号：</span>
              <span class="value">{{ orderDetail.id }}</span>
            </div>
            <div class="header-item">
              <span class="label">下单时间：</span>
              <span class="value">{{ formatDate(orderDetail.orderTime) }}</span>
            </div>
          </div>
          <div class="header-row">
            <div class="header-item">
              <span class="label">用户名：</span>
              <span class="value">{{ orderDetail.userName }}</span>
            </div>
            <div class="header-item">
              <span class="label">手机号：</span>
              <span class="value">{{ orderDetail.phone }}</span>
            </div>
          </div>
          <div class="header-row">
            <div class="header-item">
              <span class="label">订单状态：</span>
              <span class="value">{{ getStatusText(orderDetail.orderStatus, orderDetail.refundStatus) }}</span>
            </div>
            <div class="header-item">
              <span class="label">收货地址：</span>
              <span class="value">{{ orderDetail.address }}</span>
            </div>
          </div>
          <div class="header-row">
            <div class="header-item">
              <span class="label">退款原因：</span>
              <span class="value">{{ orderDetail.refundReason || '' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-body">
          <h3>订单商品</h3>
          <el-table :data="orderDetail.orderDetailVos" style="width: 100%">
            <el-table-column prop="productId" label="商品ID" width="100" />
            <el-table-column prop="productName" label="商品名称" min-width="200" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="price" label="单价" width="100" />
            <el-table-column label="小计" width="100">
              <template #default="scope">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
          <div class="order-summary">
            <div class="summary-item">
              <span class="label">优惠金额：</span>
              <span class="value">¥{{ orderDetail.activityDiscount || '0.00' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">运费：</span>
              <span class="value">¥{{ orderDetail.freight || '0.00' }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">合计：</span>
              <span class="value">¥{{ calculateTotal() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="loading">加载中...</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  id: '',
  status: null
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 订单列表
const orderList = ref([])

// 订单详情
const orderDetail = ref(null)
const dialogVisible = ref(false)

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取支付方式文本
const getPaymentMethod = (method) => {
  const methods = {
    1: '微信',
    2: '支付宝',
    3: '银行卡'
  }
  return methods[method] || '未知'
}

// 获取订单状态文本
const getStatusText = (status, refundStatus) => {
  // 如果订单状态为售后且售后状态为2，显示已完结
  if (status === 5 && refundStatus === 2) {
    return '已完结'
  }
  // 如果订单状态为售后且售后状态为1，显示售后中
  if (status === 5 && refundStatus === 1) {
    return '售后中'
  }
  
  const statusMap = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '已收货',
    5: '售后',
    6: '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取订单状态标签类型
const getStatusType = (status, refundStatus) => {
  // 如果订单状态为售后且售后状态为1，显示为危险类型（红色）
  if (status === 5 && refundStatus === 1) {
    return 'danger'
  }
  // 如果订单状态为售后且售后状态为2，显示为危险类型（红色）
  if (status === 5 && refundStatus === 2) {
    return 'danger'
  }
  
  const typeMap = {
    1: 'info',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'danger',
    6: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取订单列表
const getOrderList = async () => {
  try {
    const params = {
      pageNo: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.id) {
      params.id = searchForm.id
    }
    
    if (searchForm.status !== null) {
      params.status = searchForm.status
    }
    
    const res = await request.get('/admin/order/list', { params })
    
    if (res && res.data) {
      orderList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取订单列表错误:', error)
    ElMessage.error('获取订单列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getOrderList()
}

// 重置
const handleReset = () => {
  searchForm.id = ''
  searchForm.status = null
  pagination.currentPage = 1
  getOrderList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getOrderList()
}

// 分页页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getOrderList()
}

// 查看订单详情
const handleDetail = async (id) => {
  try {
    const res = await request.get(`/admin/order/${id}`)
    if (res && res.data) {
      orderDetail.value = res.data
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情错误:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 订单发货
const handleDelivery = async (id) => {
  try {
    await request.put(`/admin/order/delivery/${id}`)
    ElMessage.success('发货成功')
    getOrderList()
  } catch (error) {
    console.error('发货错误:', error)
    ElMessage.error('发货失败')
  }
}

// 同意退款
const handleAgree = async (id) => {
  try {
    await request.put(`/admin/order/agree/${id}`)
    ElMessage.success('同意退款成功')
    getOrderList()
  } catch (error) {
    console.error('同意退款错误:', error)
    ElMessage.error('同意退款失败')
  }
}

// 取消订单
const handleCancel = async (id) => {
  try {
    await request.put(`/admin/order/cancel/${id}`)
    ElMessage.success('取消订单成功')
    getOrderList()
  } catch (error) {
    console.error('取消订单错误:', error)
    ElMessage.error('取消订单失败')
  }
}

// 计算订单合计金额
const calculateTotal = () => {
  if (!orderDetail.value) return '0.00'
  
  // 计算商品总金额
  const productTotal = orderDetail.value.orderDetailVos.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
  
  // 计算优惠金额
  const discount = orderDetail.value.activityDiscount || 0
  
  // 计算运费
  const freight = orderDetail.value.freight || 0
  
  // 计算最终合计
  const total = productTotal - discount + freight
  
  return total.toFixed(2)
}

// 初始化
onMounted(() => {
  getOrderList()
})
</script>

<style scoped>
.order-list-container {
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

.order-table {
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

.order-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #dcdfe6;
}

.header-row {
  display: flex;
  margin-bottom: 12px;
  gap: 24px;
}

.header-item {
  flex: 1;
  min-width: 200px;
}

.header-item .label {
  font-weight: 600;
  margin-right: 8px;
  color: #606266;
}

.header-item .value {
  color: #303133;
  font-weight: 500;
}

.detail-body {
  margin-top: 20px;
}

.detail-body h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.order-summary {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.summary-item {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item .label {
  color: #606266;
  font-weight: 500;
}

.summary-item .value {
  color: #303133;
  font-weight: 600;
}

.summary-item.total {
  font-weight: 700;
  font-size: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
  color: #409eff;
}

.summary-item.total .value {
  color: #409eff;
  font-size: 18px;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #909399;
  font-size: 14px;
}
</style>