<template>
  <div class="pagination-bar">
    <div class="pagination-info">
      共 <span class="highlight">{{ total }}</span> 个商品
    </div>
    
    <div class="pagination-controls">
      <!-- 每页显示数量 -->
      <div class="page-size-selector">
        <span class="label">每页显示:</span>
        <el-select v-model="localPageSize" size="small" @change="handlePageSizeChange">
          <el-option label="10" :value="10" />
          <el-option label="20" :value="20" />
          <el-option label="50" :value="50" />
          <el-option label="100" :value="100" />
        </el-select>
      </div>

      <!-- 页码控制 -->
      <el-pagination
        v-model:current-page="localCurrentPage"
        :page-size="localPageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  total: {
    type: Number,
    required: true,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'change']);

// 本地状态，用于双向绑定
const localCurrentPage = ref(props.currentPage);
const localPageSize = ref(props.pageSize);

// 监听外部变化，同步本地状态
watch(() => props.currentPage, (val) => {
  if (val !== localCurrentPage.value) localCurrentPage.value = val;
});

watch(() => props.pageSize, (val) => {
  if (val !== localPageSize.value) localPageSize.value = val;
});

// 处理页码变化
const handlePageChange = (page) => {
  emit('update:currentPage', page);
  emit('change', { page, pageSize: localPageSize.value });
};

// 处理每页数量变化
const handlePageSizeChange = (size) => {
  // 切换每页数量时，通常重置回第一页
  localCurrentPage.value = 1;
  emit('update:currentPage', 1);
  emit('update:pageSize', size);
  emit('change', { page: 1, pageSize: size });
};
</script>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

.highlight {
  color: #0072ff;
  font-weight: bold;
  font-size: 16px;
  margin: 0 4px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.label {
  font-size: 13px;
}

/* 调整 Element Plus 分页样式以匹配整体风格 */
:deep(.el-pagination) {
  --el-pagination-text-color: #606266;
  --el-pagination-hover-color: #0072ff;
}
:deep(.el-pager li.is-active) {
  background-color: #0072ff;
  color: #fff;
  border-radius: 4px;
}
</style>