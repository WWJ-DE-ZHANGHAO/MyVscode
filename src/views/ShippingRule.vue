<template>
  <div class="shipping-rule-container">
    <h2 class="page-title">运费规则</h2>
    
    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
    </div>
    
    <!-- 规则列表 -->
    <div class="rule-table">
      <el-table :data="ruleList" style="width: 100%">
        <el-table-column prop="id" label="规则ID" width="100" />
        <el-table-column prop="shippingTemplateName" label="模板名称" width="150" />
        <el-table-column label="地区" min-width="200">
          <template #default="scope">
            {{ formatRegion(scope.row.region) }}
          </template>
        </el-table-column>
        <el-table-column prop="freight" label="运费" width="100">
          <template #default="scope">
            ¥{{ scope.row.freight || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.updateAt) }}
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
      width="500px"
      :append-to-body="true"
    >
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="模板" required>
          <el-select v-model="ruleForm.shippingTemplateId" placeholder="请选择运费模板" style="width: 100%">
            <el-option 
              v-for="template in templateList" 
              :key="template.id" 
              :label="template.name" 
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地区" required>
          <el-cascader
            v-model="regionValue"
            :options="provinceOptions"
            :props="cascaderProps"
            placeholder="请选择地区"
            @change="handleRegionChange"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="运费" required>
          <el-input-number 
            v-model="ruleForm.freight" 
            :min="0" 
            :step="0.01" 
            :precision="2" 
            style="width: 100%"
            placeholder="请输入运费金额"
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import regionData from '@/assets/data.json'

// 规则列表
const ruleList = ref([])

// 模板列表
const templateList = ref([])

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const ruleForm = reactive({
  id: null,
  shippingTemplateId: null,
  region: {
    provinceName: '',
    cityName: '',
    districtName: ''
  },
  freight: 0
})

// 地区选择值
const regionValue = ref([])

// 省份选项
const provinceOptions = ref([])

// 级联选择器配置
const cascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children'
}

// 初始化地区数据
const initRegionData = () => {
  // 构建省份选项
  const provinces = regionData['86']
  if (provinces) {
    provinceOptions.value = Object.entries(provinces).map(([code, name]) => {
      const cities = regionData[code]
      const cityOptions = cities ? Object.entries(cities).map(([cityCode, cityName]) => {
        const districts = regionData[cityCode]
        const districtOptions = districts ? Object.entries(districts).map(([districtCode, districtName]) => ({
          code: districtCode,
          name: districtName
        })) : []
        return {
          code: cityCode,
          name: cityName,
          children: districtOptions
        }
      }) : []
      return {
        code: code,
        name: name,
        children: cityOptions
      }
    })
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 格式化地区
const formatRegion = (region) => {
  if (!region || typeof region !== 'object') return ''
  // 同时支持新旧格式
  const province = region.provinceName || region.province || ''
  const city = region.cityName || region.city || ''
  const district = region.districtName || region.district || ''
  return `${province}${city}${district}`
}

// 地区选择变化
const handleRegionChange = (value) => {
  if (value && value.length === 3) {
    const [provinceCode, cityCode, districtCode] = value
    
    // 从省份选项中查找名称
    const provinceOption = provinceOptions.value.find(option => option.code === provinceCode)
    const provinceName = provinceOption ? provinceOption.name : ''
    
    // 从城市选项中查找名称
    let cityName = ''
    if (provinceOption) {
      const cityOption = provinceOption.children.find(option => option.code === cityCode)
      cityName = cityOption ? cityOption.name : ''
    }
    
    // 从区县选项中查找名称
    let districtName = ''
    if (provinceOption) {
      const cityOption = provinceOption.children.find(option => option.code === cityCode)
      if (cityOption) {
        const districtOption = cityOption.children.find(option => option.code === districtCode)
        districtName = districtOption ? districtOption.name : ''
      }
    }
    
    ruleForm.region = {
      provinceName: provinceName,
      cityName: cityName,
      districtName: districtName
    }
    console.log('地区选择变化:', ruleForm.region)
  }
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

// 获取规则列表
const getRuleList = async () => {
  try {
    console.log('开始获取运费规则列表...')
    const res = await request.get('/admin/shipping-rule/list')
    console.log('运费规则列表响应:', res)
    if (res && res.data) {
      ruleList.value = res.data
      console.log('运费规则列表数据:', ruleList.value)
    }
  } catch (error) {
    console.error('获取运费规则列表错误:', error)
    ElMessage.error('获取运费规则列表失败')
  }
}

// 新增规则
const handleAdd = () => {
  dialogTitle.value = '新增运费规则'
  ruleForm.id = null
  ruleForm.shippingTemplateId = null
  ruleForm.region = {
    provinceName: '',
    cityName: '',
    districtName: ''
  }
  ruleForm.freight = 0
  regionValue.value = []
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = async (rule) => {
  try {
    console.log('开始获取运费规则详情...', rule.id)
    const res = await request.get(`/admin/shipping-rule/getRule/${rule.id}`)
    console.log('运费规则详情响应:', res)
    if (res && res.data) {
      dialogTitle.value = '编辑运费规则'
      ruleForm.id = res.data.id
      ruleForm.shippingTemplateId = res.data.shippingTemplateId
      ruleForm.region = res.data.region || {
        provinceName: '',
        cityName: '',
        districtName: ''
      }
      ruleForm.freight = res.data.freight || 0
      console.log('运费规则详情数据:', res.data)
      
      // 初始化地区选择值
      const { provinceName, cityName, districtName } = ruleForm.region
      regionValue.value = []
      
      // 查找对应的代码
      if (provinceName) {
        const provinceEntry = Object.entries(regionData['86']).find(([code, name]) => name === provinceName)
        if (provinceEntry) {
          const provinceCode = provinceEntry[0]
          regionValue.value.push(provinceCode)
          
          if (cityName) {
            const cityEntry = Object.entries(regionData[provinceCode] || {}).find(([code, name]) => name === cityName)
            if (cityEntry) {
              const cityCode = cityEntry[0]
              regionValue.value.push(cityCode)
              
              if (districtName) {
                const districtEntry = Object.entries(regionData[cityCode] || {}).find(([code, name]) => name === districtName)
                if (districtEntry) {
                  const districtCode = districtEntry[0]
                  regionValue.value.push(districtCode)
                }
              }
            }
          }
        }
      }
      
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取运费规则详情错误:', error)
    ElMessage.error('获取运费规则详情失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!ruleForm.shippingTemplateId) {
    ElMessage.warning('请选择运费模板')
    return
  }
  
  if (!ruleForm.region.provinceName) {
    ElMessage.warning('请选择地区')
    return
  }
  
  if (!ruleForm.freight && ruleForm.freight !== 0) {
    ElMessage.warning('请输入运费金额')
    return
  }
  
  try {
    // 构建请求数据，确保新增和修改使用相同的格式
    const requestData = {
      shippingTemplateId: ruleForm.shippingTemplateId,
      region: ruleForm.region,
      freight: ruleForm.freight,
      shippingTemplateName: ''
    }
    
    // 只有修改时才添加id字段
    if (ruleForm.id) {
      requestData.id = ruleForm.id
    }
    
    console.log('提交运费规则数据:', requestData)
    console.log('提交运费规则数据类型:', typeof requestData)
    console.log('region字段类型:', typeof requestData.region)
    console.log('region字段内容:', requestData.region)
    
    if (ruleForm.id) {
      // 修改
      console.log('开始修改运费规则...')
      const updateResponse = await request.post('/admin/shipping-rule/updateRule', requestData)
      console.log('修改响应:', updateResponse)
      ElMessage.success('修改成功')
    } else {
      // 新增
      console.log('开始新增运费规则...')
      console.log('新增请求URL:', '/admin/shipping-rule/addRule')
      console.log('新增请求数据:', requestData)
      const addResponse = await request.post('/admin/shipping-rule/addRule', requestData)
      console.log('新增响应:', addResponse)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getRuleList()
  } catch (error) {
    console.error('保存运费规则错误:', error)
    console.error('错误响应:', error.response)
    console.error('错误状态码:', error.response?.status)
    console.error('错误数据:', error.response?.data)
    ElMessage.error('保存失败')
  }
}

// 删除规则
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个运费规则吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    console.log('开始删除运费规则...', id)
    await request.delete(`/admin/shipping-rule/deleteRule/${id}`)
    ElMessage.success('删除成功')
    getRuleList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除运费规则错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  initRegionData()
  getTemplateList()
  getRuleList()
})
</script>

<style scoped>
.shipping-rule-container {
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

.rule-table {
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