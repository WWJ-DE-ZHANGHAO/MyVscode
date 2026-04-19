<template>
  <div class="coupon-log-container">
    <h2 class="page-title">优惠券日志</h2>
    
    <!-- 搜索与筛选 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="优惠券ID">
          <el-input v-model="searchForm.couponId" placeholder="请输入优惠券ID" />
        </el-form-item>
        <el-form-item label="领取状态">
          <el-select v-model="searchForm.status" placeholder="请选择领取状态">
            <el-option label="未使用" value="0" />
            <el-option label="已使用" value="1" />
            <el-option label="已过期" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 优惠券日志列表 -->
    <div class="log-table">
      <el-table :data="logList" style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="100" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="couponId" label="优惠券ID" width="100" />
        <el-table-column label="领取状态" width="120">
          <template #default="scope">
            <template v-if="scope.row.status === 0">未使用</template>
            <template v-else-if="scope.row.status === 1">已使用</template>
            <template v-else>已过期</template>
          </template>
        </el-table-column>
        <el-table-column label="优惠券来源" width="150">
          <template #default="scope">
            {{ scope.row.sourceType === 1 ? '用户主动领取' : '系统自动发放' }}
          </template>
        </el-table-column>
        <el-table-column label="领取时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.receiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.useTime) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageInfo.current"
          v-model:page-size="pageInfo.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageInfo.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 优惠券日志列表
const logList = ref([])

// 分页信息
const pageInfo = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  userId: '',
  couponId: '',
  status: null
})

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取优惠券日志列表
const getLogList = async () => {
  try {
    const params = {
      page: pageInfo.current,
      size: pageInfo.size,
      userId: searchForm.userId,
      couponId: searchForm.couponId,
      status: searchForm.status
    }
    const res = await request.get('/admin/user-coupon-record/list', { params })
    if (res && res.data) {
      logList.value = res.data.list || []
      pageInfo.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取优惠券日志列表失败:', error)
    ElMessage.error('获取优惠券日志列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pageInfo.current = 1
  getLogList()
}

// 重置搜索表单
const resetForm = () => {
  searchForm.userId = ''
  searchForm.couponId = ''
  searchForm.status = null
  pageInfo.current = 1
  getLogList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageInfo.size = size
  getLogList()
}

// 当前页码变化
const handleCurrentChange = (current) => {
  pageInfo.current = current
  getLogList()
}

// 删除优惠券记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个优惠券记录吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/user-coupon-record/delete/${id}`)
    ElMessage.success('删除成功')
    getLogList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除优惠券记录失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  getLogList()
})
</script>

<style scoped>
.coupon-log-container {
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

.search-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.log-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.pagination {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}
</style>