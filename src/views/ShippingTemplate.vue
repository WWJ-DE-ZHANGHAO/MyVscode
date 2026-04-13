<template>
  <div class="shipping-template-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>运费模板列表</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增
      </el-button>
    </div>
    
    <!-- 模板列表 -->
    <div class="template-table">
      <el-table :data="templateList" style="width: 100%">
        <el-table-column prop="id" label="模板ID" width="100" />
        <el-table-column prop="name" label="模板名称" min-width="200" />
        <el-table-column label="是否包邮" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isFree === 1 ? 'success' : 'info'">
              {{ scope.row.isFree === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
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
      width="400px"
      :append-to-body="true"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="是否包邮">
          <el-switch v-model="templateForm.isFree" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 模板列表
const templateList = ref([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const templateForm = reactive({
  id: null,
  name: '',
  isFree: 0
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 获取模板列表
const getTemplateList = async () => {
  try {
    const res = await request.get('/admin/shipping-template/list')
    if (res && res.data) {
      templateList.value = res.data
    }
  } catch (error) {
    console.error('获取运费模板列表错误:', error)
    ElMessage.error('获取运费模板列表失败')
  }
}

// 新增模板
const handleAdd = () => {
  dialogTitle.value = '新增运费模板'
  templateForm.id = null
  templateForm.name = ''
  templateForm.isFree = 0
  dialogVisible.value = true
}

// 编辑模板
const handleEdit = async (template) => {
  try {
    const res = await request.get(`/admin/shipping-template/${template.id}`)
    if (res && res.data) {
      dialogTitle.value = '编辑运费模板'
      templateForm.id = res.data.id
      templateForm.name = res.data.name
      templateForm.isFree = res.data.isFree
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取运费模板详情错误:', error)
    ElMessage.error('获取运费模板详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!templateForm.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  try {
    if (templateForm.id) {
      // 修改
      await request.post('/admin/shipping-template/update', templateForm)
      ElMessage.success('修改成功')
    } else {
      // 新增
      await request.post('/admin/shipping-template/add', templateForm)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getTemplateList()
  } catch (error) {
    console.error('保存运费模板错误:', error)
    ElMessage.error('保存失败')
  }
}

// 删除模板
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个运费模板吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/shipping-template/delete/${id}`)
    ElMessage.success('删除成功')
    getTemplateList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除运费模板错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  getTemplateList()
})
</script>

<style scoped>
.shipping-template-container {
  padding: 24px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.template-table {
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
</style>