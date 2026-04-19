<template>
  <div class="point-log-container">
    <h2 class="page-title">积分日志</h2>
    
    <!-- 搜索与筛选 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 积分日志列表 -->
    <div class="log-table">
      <el-table :data="logList" style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="100" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column label="积分变化" width="150">
          <template #default="scope">
            <span :class="scope.row.changeAmount > 0 ? 'text-green' : 'text-red'">
              {{ scope.row.changeAmount > 0 ? '+' : '' }}{{ scope.row.changeAmount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="变更原因" min-width="200" />
        <el-table-column label="操作时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
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

// 积分日志列表
const logList = ref([])

// 分页信息
const pageInfo = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  userId: ''
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

// 获取积分日志列表
const getLogList = async () => {
  try {
    const params = {
      page: pageInfo.current,
      size: pageInfo.size,
      userId: searchForm.userId
    }
    const res = await request.get('/admin/points-log/list', { params })
    if (res && res.data) {
      logList.value = res.data.list || []
      pageInfo.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取积分日志列表失败:', error)
    ElMessage.error('获取积分日志列表失败')
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

// 删除积分记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个积分记录吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/points-log/delete/${id}`)
    ElMessage.success('删除成功')
    getLogList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除积分记录失败:', error)
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
.point-log-container {
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

.text-green {
  color: #67c23a;
}

.text-red {
  color: #f56c6c;
}
</style>