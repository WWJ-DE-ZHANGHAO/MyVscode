<template>
  <div class="coupon-template-container">
    <h2 class="page-title">优惠券模版管理</h2>
    
    <!-- 搜索与筛选 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="优惠券关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select v-model="searchForm.type" placeholder="请选择优惠券类型">
            <el-option label="满减券" value="1" />
            <el-option label="折扣券" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用范围">
          <el-select v-model="searchForm.scope" placeholder="请选择使用范围">
            <el-option label="全场可用" value="1" />
            <el-option label="特价专区可用" value="2" />
            <el-option label="新书专区可用" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券来源">
          <el-select v-model="searchForm.source" placeholder="请选择优惠券来源">
            <el-option label="会员权益" value="1" />
            <el-option label="促销活动" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增优惠券模板
      </el-button>
    </div>
    
    <!-- 优惠券模板列表 -->
    <div class="template-table">
      <el-table :data="templateList" style="width: 100%">
        <el-table-column prop="id" label="模板ID" width="100" />
        <el-table-column prop="name" label="优惠券名称" width="180" />
        <el-table-column label="优惠券类型" width="120">
          <template #default="scope">
            {{ scope.row.type === 1 ? '满减券' : '折扣券' }}
          </template>
        </el-table-column>
        <el-table-column label="优惠数值" width="120">
          <template #default="scope">
            {{ scope.row.type === 1 ? `¥${scope.row.discountValue}` : `${scope.row.discountValue * 100}折` }}
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" width="120">
          <template #default="scope">
            ¥{{ scope.row.minOrderAmount }}
          </template>
        </el-table-column>
        <el-table-column label="使用范围" width="150">
          <template #default="scope">
            <template v-if="scope.row.scope === 1">全场可用</template>
            <template v-else-if="scope.row.scope === 2">特价专区可用</template>
            <template v-else>新书专区可用</template>
          </template>
        </el-table-column>
        <el-table-column label="优惠券来源" width="120">
          <template #default="scope">
            {{ scope.row.source === 1 ? '会员权益' : '促销活动' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalStock" label="发行总数量" width="120" />
        <el-table-column prop="limitPerUser" label="每个用户限领数量" width="150" />
        <el-table-column label="有效期" width="250">
          <template #default="scope">
            {{ formatDateTime(scope.row.validStartTime) }} 至 {{ formatDateTime(scope.row.validEndTime) }}
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
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :append-to-body="true"
    >
      <el-form :model="templateForm" label-width="150px" :rules="formRules" ref="formRef">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入优惠券名称" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="请选择优惠券类型" style="width: 100%">
            <el-option label="满减券" value="1" />
            <el-option label="折扣券" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠数值" prop="discountValue">
          <el-input-number 
            v-model="templateForm.discountValue" 
            :min="0.01" 
            :step="0.01" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入优惠数值"
          />
        </el-form-item>
        <el-form-item label="使用门槛" prop="minOrderAmount">
          <el-input-number 
            v-model="templateForm.minOrderAmount" 
            :min="0" 
            :step="10" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入使用门槛"
          />
        </el-form-item>
        <el-form-item label="使用范围" prop="scope">
          <el-select v-model="templateForm.scope" placeholder="请选择使用范围" style="width: 100%">
            <el-option label="全场可用" value="1" />
            <el-option label="特价专区可用" value="2" />
            <el-option label="新书专区可用" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券来源" prop="source">
          <el-select v-model="templateForm.source" placeholder="请选择优惠券来源" style="width: 100%">
            <el-option label="会员权益" value="1" />
            <el-option label="促销活动" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发行总数量" prop="totalStock">
          <el-input-number 
            v-model="templateForm.totalStock" 
            :min="1" 
            :step="100" 
            style="width: 100%"
            placeholder="请输入发行总数量"
          />
        </el-form-item>
        <el-form-item label="每个用户限领数量" prop="limitPerUser">
          <el-input-number 
            v-model="templateForm.limitPerUser" 
            :min="0" 
            :step="1" 
            style="width: 100%"
            placeholder="请输入每个用户限领数量，0表示无限制"
          />
        </el-form-item>
        <el-form-item label="有效期开始时间" prop="validStartTime">
          <el-date-picker
            v-model="templateForm.validStartTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="有效期结束时间" prop="validEndTime">
          <el-date-picker
            v-model="templateForm.validEndTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 优惠券模板列表
const templateList = ref([])

// 分页信息
const pageInfo = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: null,
  scope: null,
  source: null
})

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const templateForm = reactive({
  id: null,
  name: '',
  type: 1,
  discountValue: 0,
  minOrderAmount: 0,
  scope: 1,
  source: 1,
  totalStock: 1000,
  limitPerUser: 1,
  validStartTime: new Date(),
  validEndTime: new Date()
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入优惠券名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择优惠券类型', trigger: 'change' }
  ],
  discountValue: [
    { required: true, message: '请输入优惠数值', trigger: 'blur' }
  ],
  minOrderAmount: [
    { required: true, message: '请输入使用门槛', trigger: 'blur' }
  ],
  scope: [
    { required: true, message: '请选择使用范围', trigger: 'change' }
  ],
  source: [
    { required: true, message: '请选择优惠券来源', trigger: 'change' }
  ],
  totalStock: [
    { required: true, message: '请输入发行总数量', trigger: 'blur' }
  ],
  limitPerUser: [
    { required: true, message: '请输入每个用户限领数量', trigger: 'blur' }
  ],
  validStartTime: [
    { required: true, message: '请选择有效期开始时间', trigger: 'change' }
  ],
  validEndTime: [
    { required: true, message: '请选择有效期结束时间', trigger: 'change' }
  ]
}

// 表单引用
const formRef = ref(null)

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

// 获取优惠券模板列表
const getTemplateList = async () => {
  try {
    const params = {
      page: pageInfo.current,
      size: pageInfo.size,
      keyword: searchForm.keyword,
      type: searchForm.type,
      scope: searchForm.scope,
      source: searchForm.source
    }
    const res = await request.get('/admin/coupon-template/list', { params })
    if (res && res.data) {
      templateList.value = res.data.list || []
      pageInfo.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取优惠券模板列表失败:', error)
    ElMessage.error('获取优惠券模板列表失败')
  }
}

// 搜索
const handleSearch = () => {
  pageInfo.current = 1
  getTemplateList()
}

// 重置搜索表单
const resetForm = () => {
  searchForm.keyword = ''
  searchForm.type = null
  searchForm.scope = null
  searchForm.source = null
  pageInfo.current = 1
  getTemplateList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageInfo.size = size
  getTemplateList()
}

// 当前页码变化
const handleCurrentChange = (current) => {
  pageInfo.current = current
  getTemplateList()
}

// 新增优惠券模板
const handleAdd = () => {
  dialogTitle.value = '新增优惠券模板'
  templateForm.id = null
  templateForm.name = ''
  templateForm.type = 1
  templateForm.discountValue = 0
  templateForm.minOrderAmount = 0
  templateForm.scope = 1
  templateForm.source = 1
  templateForm.totalStock = 1000
  templateForm.limitPerUser = 1
  templateForm.validStartTime = new Date()
  templateForm.validEndTime = new Date()
  dialogVisible.value = true
}

// 编辑优惠券模板
const handleEdit = async (template) => {
  try {
    const res = await request.get(`/admin/coupon-template/${template.id}`)
    if (res && res.data) {
      dialogTitle.value = '编辑优惠券模板'
      templateForm.id = res.data.id
      templateForm.name = res.data.name
      templateForm.type = res.data.type
      templateForm.discountValue = res.data.discountValue
      templateForm.minOrderAmount = res.data.minOrderAmount
      templateForm.scope = res.data.scope
      templateForm.source = res.data.source
      templateForm.totalStock = res.data.totalStock
      templateForm.limitPerUser = res.data.limitPerUser
      templateForm.validStartTime = new Date(res.data.validStartTime)
      templateForm.validEndTime = new Date(res.data.validEndTime)
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取优惠券模板详情失败:', error)
    ElMessage.error('获取优惠券模板详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const requestData = {
      name: templateForm.name,
      type: templateForm.type,
      discountValue: templateForm.discountValue,
      minOrderAmount: templateForm.minOrderAmount,
      scope: templateForm.scope,
      source: templateForm.source,
      totalStock: templateForm.totalStock,
      limitPerUser: templateForm.limitPerUser,
      validStartTime: templateForm.validStartTime,
      validEndTime: templateForm.validEndTime
    }
    
    if (templateForm.id) {
      // 修改
      requestData.id = templateForm.id
      await request.post('/admin/coupon-template/update', requestData)
      ElMessage.success('修改成功')
    } else {
      // 新增
      await request.post('/admin/coupon-template/add', requestData)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    getTemplateList()
  } catch (error) {
    console.error('保存优惠券模板失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  }
}

// 删除优惠券模板
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个优惠券模板吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/admin/coupon-template/delete/${id}`)
    ElMessage.success('删除成功')
    getTemplateList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除优惠券模板失败:', error)
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
.coupon-template-container {
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

.action-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.template-table {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-top: 1px solid #dcdfe6;
}
</style>