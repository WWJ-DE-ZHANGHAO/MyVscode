<template>
  <div class="member-level-container">
    <h2 class="page-title">会员权益管理</h2>
    
    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增会员等级
      </el-button>
    </div>
    
    <!-- 会员等级列表 -->
    <div class="level-table">
      <el-table :data="levelList" style="width: 100%">
        <el-table-column prop="id" label="等级ID" width="100" />
        <el-table-column prop="levelName" label="等级名称" width="150" />
        <el-table-column prop="minGrowthValue" label="最低成长值" width="150" />
        <el-table-column label="全场默认折扣" width="150">
          <template #default="scope">
            {{ (scope.row.discount * 100).toFixed(0) }}折
          </template>
        </el-table-column>
        <el-table-column prop="couponQuota" label="每月优惠券数量" width="150" />
        <el-table-column label="免运费门槛" width="150">
          <template #default="scope">
            ¥{{ scope.row.freeShippingThreshold || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="积分抵扣比例" width="180">
          <template #default="scope">
            {{ (1 / scope.row.pointsExchangeRate).toFixed(0) }}积分 = ¥1
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
      width="600px"
      :append-to-body="true"
    >
      <el-form :model="levelForm" label-width="150px" :rules="formRules" ref="formRef">
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="levelForm.levelName" placeholder="请输入等级名称" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最低成长值" prop="minGrowthValue">
          <el-input-number 
            v-model="levelForm.minGrowthValue" 
            :min="0" 
            :step="100" 
            style="width: 100%"
            placeholder="请输入最低成长值"
          />
        </el-form-item>
        <el-form-item label="全场默认折扣" prop="discount">
          <el-input-number 
            v-model="levelForm.discount" 
            :min="0.1" 
            :max="1" 
            :step="0.05" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入折扣（如0.95代表95折）"
          />
        </el-form-item>
        <el-form-item label="每月优惠券数量" prop="couponQuota">
          <el-input-number 
            v-model="levelForm.couponQuota" 
            :min="0" 
            :step="1" 
            style="width: 100%"
            placeholder="请输入每月优惠券数量"
          />
        </el-form-item>
        <el-form-item label="免运费门槛" prop="freeShippingThreshold">
          <el-input-number 
            v-model="levelForm.freeShippingThreshold" 
            :min="0" 
            :step="10" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入免运费门槛"
          />
        </el-form-item>
        <el-form-item label="积分抵扣比例" prop="pointsExchangeRate">
          <el-input-number 
            v-model="levelForm.pointsExchangeRate" 
            :min="0.01" 
            :max="1" 
            :step="0.01" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入积分抵扣比例（如0.01表示100积分抵扣1元）"
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

// 会员等级列表
const levelList = ref([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const levelForm = reactive({
  id: null,
  levelName: '',
  minGrowthValue: 0,
  discount: 1,
  couponQuota: 0,
  freeShippingThreshold: 0,
  pointsExchangeRate: 0.01
})

// 表单验证规则
const formRules = {
  levelName: [
    { required: true, message: '请输入等级名称', trigger: 'blur' }
  ],
  minGrowthValue: [
    { required: true, message: '请输入最低成长值', trigger: 'blur' }
  ],
  discount: [
    { required: true, message: '请输入全场默认折扣', trigger: 'blur' }
  ],
  couponQuota: [
    { required: true, message: '请输入每月优惠券数量', trigger: 'blur' }
  ],
  freeShippingThreshold: [
    { required: true, message: '请输入免运费门槛', trigger: 'blur' }
  ],
  pointsExchangeRate: [
    { required: true, message: '请输入积分抵扣比例', trigger: 'blur' }
  ]
}

// 表单引用
const formRef = ref(null)

// 获取会员等级列表
const getLevelList = async () => {
  try {
    const res = await request.get('/admin/member-level/list')
    console.log('获取会员等级列表响应:', res)
    if (res && res.code === 1 && res.data) {
      levelList.value = res.data
    } else {
      ElMessage.error(res.msg || '获取会员等级列表失败')
    }
  } catch (error) {
    console.error('获取会员等级列表失败:', error)
    ElMessage.error('获取会员等级列表失败')
  }
}

// 新增会员等级
const handleAdd = () => {
  dialogTitle.value = '新增会员等级'
  levelForm.id = null
  levelForm.levelName = ''
  levelForm.minGrowthValue = 0
  levelForm.discount = 1
  levelForm.couponQuota = 0
  levelForm.freeShippingThreshold = 0
  levelForm.pointsExchangeRate = 0.01
  dialogVisible.value = true
}

// 编辑会员等级
const handleEdit = async (level) => {
  try {
    const res = await request.get(`/admin/member-level/detail/${level.id}`)
    console.log('获取会员等级详情响应:', res)
    if (res && res.code === 1 && res.data) {
      dialogTitle.value = '编辑会员等级'
      levelForm.id = res.data.id
      levelForm.levelName = res.data.levelName
      levelForm.minGrowthValue = res.data.minGrowthValue
      levelForm.discount = res.data.discount
      levelForm.couponQuota = res.data.couponQuota
      levelForm.freeShippingThreshold = res.data.freeShippingThreshold
      levelForm.pointsExchangeRate = res.data.pointsExchangeRate
      dialogVisible.value = true
    } else {
      ElMessage.error(res.msg || '获取会员等级详情失败')
    }
  } catch (error) {
    console.error('获取会员等级详情失败:', error)
    ElMessage.error('获取会员等级详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const requestData = {
      levelName: levelForm.levelName,
      minGrowthValue: levelForm.minGrowthValue,
      discount: levelForm.discount,
      couponQuota: levelForm.couponQuota,
      freeShippingThreshold: levelForm.freeShippingThreshold,
      pointsExchangeRate: levelForm.pointsExchangeRate
    }
    
    if (levelForm.id) {
      // 修改
      requestData.id = levelForm.id
      const res = await request.put('/admin/member-level/update', requestData)
      console.log('修改会员等级响应:', res)
      if (res && res.code === 0) {
        ElMessage.success('修改成功')
      } else {
        ElMessage.error(res.msg || '修改失败')
        return
      }
    } else {
      // 新增
      const res = await request.post('/admin/member-level/add', requestData)
      console.log('新增会员等级响应:', res)
      if (res && res.code === 0) {
        ElMessage.success('添加成功')
      } else {
        ElMessage.error(res.msg || '添加失败')
        return
      }
    }
    
    dialogVisible.value = false
    getLevelList()
  } catch (error) {
    console.error('保存会员等级失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  }
}

// 删除会员等级
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个会员等级吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.delete(`/admin/member-level/delete/${id}`)
    console.log('删除会员等级响应:', res)
    if (res && res.code === 0) {
      ElMessage.success('删除成功')
      getLevelList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会员等级失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  getLevelList()
})
</script>

<style scoped>
.member-level-container {
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

.action-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.level-table {
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