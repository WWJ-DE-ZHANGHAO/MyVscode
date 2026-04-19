<template>
  <div class="product-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>商品管理</h2>
      <el-button type="primary" class="add-button" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增商品
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <el-card shadow="hover" class="search-card">
      <div class="search-form-container">
        <div class="search-fields">
          <el-form :model="searchForm" label-width="80px" inline>
            <el-form-item label="商品名称">
              <el-input v-model="searchForm.keyword" placeholder="请输入商品名称" style="width: 200px" />
            </el-form-item>
            <el-form-item label="商品类目">
              <el-select v-model="searchForm.categoryId" placeholder="请选择商品类目" style="width: 180px">
                <el-option label="所有类目" value="10" />
                <!-- 这里需要动态加载分类列表 -->
                <el-option
                  v-for="category in categoryList"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="商品状态">
              <el-select v-model="searchForm.status" placeholder="选择商品状态" style="width: 180px">
                <el-option label="上架" value="1" />
                <el-option label="下架" value="0" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="search-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 商品列表 -->
    <el-card shadow="hover" class="product-card">
      <el-table :data="productList" style="width: 100%" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品信息" min-width="320">
          <template #default="scope">
            <div class="product-info">
              <el-image
                :src="scope.row.coverUrl"
                fit="cover"
                style="width: 100px; height: 100px; border-radius: 4px; margin-right: 16px"
              />
              <div class="product-details">
                <div class="product-name">{{ scope.row.bookName }}</div>
                <div class="product-author">作者：{{ scope.row.author }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品类目" width="120">
          <template #default="scope">
            {{ getCategoryName(scope.row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120">
          <template #default="scope">
            <div>
              <span class="current-price">¥{{ scope.row.price }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="120" />
        <el-table-column prop="salesCount" label="销量" width="120" />
        <el-table-column label="特价" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.isSpecial"
              :active-value="1"
              :inactive-value="0"
              @change="handleSpecialChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="上下架" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增商品' : '编辑商品'"
      width="800px"
      :append-to-body="true"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 这里需要根据Product实体类添加表单字段 -->
        <el-form-item label="分类ID" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类">
            <el-option
              v-for="category in categoryList"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="书籍名称" prop="bookName">
          <el-input v-model="form.bookName" placeholder="请输入书籍名称" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="销售价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :step="0.01" controls-position="right" placeholder="请输入销售价格" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" controls-position="right" placeholder="请输入库存数量" />
        </el-form-item>
        <el-form-item label="封面图片" prop="coverUrl">
          <div class="upload-container">
            <el-upload
              class="cover-upload"
              :action="'/admin/upload/upload'"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleCoverUploadSuccess"
              :before-upload="beforeUpload"
            >
              <div class="upload-preview" v-if="form.coverUrl">
                <el-image
                  :src="form.coverUrl"
                  fit="cover"
                  style="width: 100px; height: 100px;"
                />
                <div class="upload-overlay">
                  <span>点击更换图片</span>
                </div>
              </div>
              <div class="upload-placeholder" v-else>
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>点击上传图片</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="书籍简介" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入书籍简介" />
        </el-form-item>
        
        <!-- 动态属性 -->
        <el-form-item label="商品属性" prop="attributes">
          <div v-for="(attribute, index) in attributesList" :key="index" class="attribute-item">
            <el-select v-model="attribute.key" placeholder="属性名称" style="width: 150px; margin-right: 10px">
              <el-option label="出版社" value="出版社" />
              <el-option label="出版时间" value="出版时间" />
              <el-option label="国际标准书号ISBN" value="国际标准书号ISBN" />
            </el-select>
            <el-input v-model="attribute.value" placeholder="属性值" style="flex: 1; margin-right: 10px" />
            <el-button type="danger" size="small" @click="removeAttribute(index)">删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addAttribute" style="margin-top: 10px">添加属性</el-button>
        </el-form-item>
        
        <!-- 商品轮播图 -->
        <el-form-item label="商品轮播图" prop="sliderImages">
          <div class="slider-images-container">
            <div v-for="(image, index) in sliderImagesList" :key="index" class="slider-image-item">
              <el-image :src="image" fit="cover" style="width: 100px; height: 100px; margin-right: 10px" />
              <el-button type="danger" size="small" @click="removeSliderImage(index)">删除</el-button>
            </div>
            <el-upload
              class="slider-upload"
              :action="'/admin/upload/upload'"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleSliderUploadSuccess"
              :before-upload="beforeUpload"
            >
              <div class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>点击上传轮播图</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        
        <!-- 商品描述（富文本） -->
        <el-form-item label="商品描述" prop="detailHtml">
          <Editor v-model="form.detailHtml" />
        </el-form-item>
        <el-form-item label="评分" prop="score">
          <el-rate v-model="form.score" :max="5" :precision="1" />
        </el-form-item>
        <el-form-item label="是否是特价书籍">
          <el-switch 
            v-model="form.isSpecial" 
            :active-value="1" 
            :inactive-value="0" 
          />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch 
            v-model="form.status" 
            :active-value="1" 
            :inactive-value="0" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Search, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import Editor from '@/components/Editor.vue'

const productList = ref([])
const categoryList = ref([])
const categoryMap = ref(new Map()) // 用于快速查找分类名称
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const loading = ref(false)
const uploadHeaders = ref({ token: sessionStorage.getItem('token') || '' })

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: 10, // 默认为10，表示查询所有类目
  status: null // 默认为null，表示不选择商品状态
})

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const form = reactive({
  id: null,
  categoryId: null,
  bookName: '',
  author: '',
  price: null,
  stock: 0,
  coverUrl: '',
  detailHtml: '',
  attributes: '',
  sliderImages: '',
  description: '',
  salesCount: 0,
  status: 1,
  score: null,
  isSpecial: 0
})

// 动态属性列表
const attributesList = ref([
  { key: '出版社', value: '' },
  { key: '出版时间', value: '' },
  { key: '国际标准书号ISBN', value: '' }
])

// 轮播图列表
const sliderImagesList = ref([])

// 表单验证规则
const rules = {
  categoryId: [
    { required: true, message: '分类ID不能为空', trigger: 'blur' }
  ],
  bookName: [
    { required: true, message: '书籍名称不能为空', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '作者名不能为空', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '销售价格不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '销售价格不能小于零', trigger: 'blur' }
  ],
  stock: [
    { type: 'number', min: 0, message: '库存数量不能小于零', trigger: 'blur' }
  ],
  coverUrl: [
    { required: true, message: '封面图片URL不能为空', trigger: 'blur' }
  ],
  detailHtml: [
    { required: true, message: '书籍详情(长描述)不能为空', trigger: 'blur' }
  ],
  attributes: [
    { required: true, message: '商品动态属性不能为空', trigger: 'blur' }
  ],
  sliderImages: [
    { required: true, message: '商品轮播图列表不能为空', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '书籍简介(短描述)不能为空', trigger: 'blur' }
  ],
  score: [
    { required: true, message: '评分不能为空', trigger: 'blur' }
  ]
}

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

// 获取分类列表（带缓存）
const getCategoryList = async () => {
  try {
    const res = await request.get('/admin/category/list')
    if (res && res.data) {
      categoryList.value = res.data
      // 构建分类映射，用于快速查找
      categoryMap.value.clear()
      res.data.forEach(category => {
        categoryMap.value.set(category.id, category.name)
      })
      console.log('【分类列表】成功加载:', categoryList.value.length, '个分类')
    }
  } catch (error) {
    console.error('获取分类列表错误:', error)
  }
}

// 根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return '未知'
  return categoryMap.value.get(categoryId) || '未知'
}

// 获取商品列表
const getProductList = async () => {
  try {
    const params = {
      pageNo: pagination.currentPage, // 使用pageNo而不是pageNum
      pageSize: pagination.pageSize,
      categoryId: searchForm.categoryId // 选择全部时传10
    }
    
    // 只有当status不为null时才添加到参数中
    if (searchForm.status !== null) {
      params.status = searchForm.status
    }
    
    if (searchForm.keyword && searchForm.keyword.trim()) {
      params.keyword = searchForm.keyword.trim()
    }
    
    console.log('【商品列表】请求参数:', params)
    const res = await request.get('/admin/book/list', { params })
    console.log('【商品列表】原始响应:', res)
    
    // 兼容多种响应格式
    let pageData = null
    
    // 格式1: { code: 1, data: { total, list } } - Result包装
    if (res && res.data && (res.data.list || res.data.records)) {
      pageData = res.data
    }
    // 格式2: { total, list } 直接返回 - PageResult
    else if (res && (res.list || res.records)) {
      pageData = res
    }
    // 格式3: 响应拦截器已经处理，直接返回数据
    else if (res && typeof res === 'object') {
      pageData = res
    }
    
    if (pageData) {
      productList.value = pageData.list || pageData.records || []
      pagination.total = pageData.total || pageData.count || 0
      console.log('【商品列表】成功加载:', productList.value.length, '条记录, 总数:', pagination.total)
    } else {
      productList.value = []
      pagination.total = 0
      console.warn('【商品列表】无法解析响应数据:', res)
    }
  } catch (error) {
    console.error('【商品列表】获取失败:', error)
    if (error.response?.status === 400) {
      ElMessage.error('请求参数错误，请检查筛选条件')
    } else {
      ElMessage.error('获取商品列表失败')
    }
    productList.value = []
    pagination.total = 0
  }
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getProductList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.categoryId = 10
  searchForm.status = null // 重置为null，表示不选择商品状态
  pagination.currentPage = 1
  getProductList()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getProductList()
}

// 当前页码变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  getProductList()
}

// 新增商品
const handleAdd = () => {
  // 清空表单数据并设置默认值
  form.id = null
  form.categoryId = null
  form.bookName = ''
  form.author = ''
  form.price = null
  form.stock = 0
  form.coverUrl = ''
  form.detailHtml = ''
  form.attributes = ''
  form.sliderImages = ''
  form.description = ''
  form.salesCount = 0
  form.status = 1 // 使用数字值
  form.score = 0
  form.isSpecial = 0 // 使用数字值
  
  // 重置动态属性列表
  attributesList.value = [
    { key: '出版社', value: '' },
    { key: '出版时间', value: '' },
    { key: '国际标准书号ISBN', value: '' }
  ]
  
  // 重置轮播图列表
  sliderImagesList.value = []
  
  dialogType.value = 'add'
  console.log('设置dialogVisible为true')
  dialogVisible.value = true
}

// 编辑商品
const handleEdit = async (product) => {
  try {
    console.log('开始编辑商品:', product.id)
    const res = await request.get(`/admin/book/${product.id}`)
    console.log('获取商品详情响应:', res)
    
    if (!res || !res.data) {
      console.error('获取商品详情失败：响应数据为空')
      ElMessage.error('获取商品详情失败')
      return
    }
    
    const productData = res.data
    console.log('商品详情数据:', productData)
    
    // 清空表单数据并设置默认值
    form.id = null
    form.categoryId = null
    form.bookName = ''
    form.author = ''
    form.price = null
    form.stock = 0
    form.coverUrl = ''
    form.detailHtml = ''
    form.attributes = ''
    form.sliderImages = ''
    form.description = ''
    form.salesCount = 0
    form.status = 1
    form.score = 0
    form.isSpecial = 0
    
    // 设置表单数据，添加默认值处理
    form.id = productData.id || null
    form.categoryId = productData.categoryId || null
    form.bookName = productData.bookName || ''
    form.author = productData.author || ''
    form.price = productData.price || null
    form.stock = productData.stock || 0
    form.coverUrl = productData.coverUrl || ''
    form.detailHtml = productData.detailHtml || ''
    form.attributes = productData.attributes || ''
    form.sliderImages = productData.sliderImages || ''
    form.description = productData.description || ''
    form.salesCount = productData.salesCount || 0
    // 直接使用后端返回的数字值，不需要转换
    form.status = productData.status || 1
    form.score = productData.score || 0
    // 直接使用后端返回的数字值，不需要转换
    form.isSpecial = productData.isSpecial || 0
    
    // 处理动态属性
    if (productData.attributes) {
      try {
        const attributes = JSON.parse(productData.attributes)
        attributesList.value = attributes
      } catch (error) {
        console.error('解析动态属性失败:', error)
        attributesList.value = [
          { key: '出版社', value: '' },
          { key: '出版时间', value: '' },
          { key: '国际标准书号ISBN', value: '' }
        ]
      }
    } else {
      attributesList.value = [
        { key: '出版社', value: '' },
        { key: '出版时间', value: '' },
        { key: '国际标准书号ISBN', value: '' }
      ]
    }
    
    // 处理轮播图
    if (productData.sliderImages) {
      try {
        const sliderImages = JSON.parse(productData.sliderImages)
        sliderImagesList.value = sliderImages
      } catch (error) {
        console.error('解析轮播图失败:', error)
        sliderImagesList.value = []
      }
    } else {
      sliderImagesList.value = []
    }
    
    dialogType.value = 'edit'
    console.log('设置dialogVisible为true')
    dialogVisible.value = true
  } catch (error) {
    console.error('获取商品详情错误:', error)
    ElMessage.error('获取商品详情失败，请稍后重试')
    // 即使出错也显示弹窗，避免页面卡住
    dialogType.value = 'edit'
    dialogVisible.value = true
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    // 更新动态属性和轮播图为JSON字符串
    form.attributes = JSON.stringify(attributesList.value)
    form.sliderImages = JSON.stringify(sliderImagesList.value)
    
    await formRef.value.validate()
    
    // 额外检查库存和售价不能小于0
    if (form.price < 0) {
      ElMessage.error('销售价格不能小于零')
      return
    }
    if (form.stock < 0) {
      ElMessage.error('库存数量不能小于零')
      return
    }
    
    loading.value = true
    
    // 准备提交数据，直接使用表单数据
    const submitData = {
      ...form
    }
    
    if (dialogType.value === 'add') {
      await request.post('/admin/book/add', submitData)
    } else {
      await request.put('/admin/book/update', submitData)
    }
    
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
    dialogVisible.value = false
    getProductList()
  } catch (error) {
    console.error('提交表单错误:', error)
    // 尽量展示后端返回的错误信息
    const msg = (error && (error.response?.data?.msg || error.response?.data?.message || error.message)) || '提交失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

// 状态变更（上下架）
const handleStatusChange = async (product) => {
  try {
    await request.put(`/admin/book/offSale/${product.id}`)
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('更新状态错误:', error)
    // 恢复原来的状态
    getProductList()
  }
}

// 处理特价状态变化
const handleSpecialChange = async (product) => {
  try {
    await request.put(`/admin/book/setSpecial/${product.id}`)
    ElMessage.success('特价状态更新成功')
  } catch (error) {
    console.error('更新特价状态错误:', error)
    // 恢复原来的状态
    getProductList()
  }
}

// 处理封面图片上传成功
const handleCoverUploadSuccess = (response) => {
  if (response && response.code === 1 && response.data) {
    form.coverUrl = response.data
    ElMessage.success('封面图片上传成功')
  } else {
    ElMessage.error('封面图片上传失败')
  }
}

// 处理轮播图上传成功
const handleSliderUploadSuccess = (response) => {
  if (response && response.code === 1 && response.data) {
    sliderImagesList.value.push(response.data)
    ElMessage.success('轮播图上传成功')
  } else {
    ElMessage.error('轮播图上传失败')
  }
}

// 添加动态属性
const addAttribute = () => {
  attributesList.value.push({ key: '', value: '' })
}

// 删除动态属性
const removeAttribute = (index) => {
  attributesList.value.splice(index, 1)
}

// 删除轮播图
const removeSliderImage = (index) => {
  sliderImagesList.value.splice(index, 1)
}

// 上传前验证
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 页面加载时获取数据
onMounted(() => {
  getCategoryList()
  getProductList()
})
</script>

<style scoped>
.product-management-container {
  padding: 24px;
  height: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  background-color: #f5f7fa;
  z-index: 100;
  padding-top: 12px;
  margin-top: -24px;
  margin-left: -24px;
  margin-right: -24px;
  padding-left: 24px;
  padding-right: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.search-card {
  margin-bottom: 20px;
}

.search-form-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding: 20px;
}

.search-fields {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.product-card {
  margin-top: 16px;
}

.product-info {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  gap: 16px;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.product-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.product-author {
  font-size: 12px;
  color: #909399;
}

.current-price {
  color: #f56c6c;
  font-size: 14px;
  font-weight: 600;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 20px;
}

.dialog-footer {
  text-align: right;
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

/* 图片上传样式 */
.upload-container {
  width: 100px;
}

.cover-upload {
  width: 100px;
}

.upload-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-preview:hover .upload-overlay {
  opacity: 1;
}

.upload-placeholder {
  width: 100px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9f9f9;
}

.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-placeholder span {
  font-size: 12px;
  font-weight: 500;
}

/* 动态属性样式 */
.attribute-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
}

/* 轮播图样式 */
.slider-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.slider-image-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.slider-upload {
  margin-top: 10px;
}


</style>