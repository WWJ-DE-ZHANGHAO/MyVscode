<template>
  <div class="dashboard-container">
    <h2 class="page-title">首页</h2>
    
    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 营业额分析 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>营业额分析</h3>
        </div>
        <div class="chart-content">
          <el-card shadow="hover">
            <div class="time-tabs">
              <el-radio-group v-model="salesTab" size="small">
                <el-radio-button label="yesterday">昨日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month" border-color="#409eff" text-color="#409eff">本月</el-radio-button>
              </el-radio-group>
            </div>
            <div ref="salesChartRef" class="chart"></div>
          </el-card>
        </div>
      </div>
      
      <!-- 销量数据统计 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>销量数据统计</h3>
        </div>
        <div class="chart-content">
          <el-card shadow="hover">
            <div ref="salesPieChartRef" class="chart"></div>
          </el-card>
        </div>
      </div>
      
      <!-- 用户分析 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>用户分析</h3>
        </div>
        <div class="chart-content">
          <el-card shadow="hover">
            <div class="time-tabs">
              <el-radio-group v-model="userTab" size="small">
                <el-radio-button label="yesterday">昨日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month" border-color="#409eff" text-color="#409eff">本月</el-radio-button>
              </el-radio-group>
            </div>
            <div ref="userChartRef" class="chart"></div>
          </el-card>
        </div>
      </div>
      
      <!-- 商品销量排行 -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>商品销量排行</h3>
        </div>
        <div class="chart-content">
          <el-card shadow="hover">
            <div ref="productChartRef" class="chart"></div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'



// 营业额分析标签
const salesTab = ref('month')

// 用户分析标签
const userTab = ref('month')

// 图表引用
const salesChartRef = ref(null)
const salesPieChartRef = ref(null)
const userChartRef = ref(null)
const productChartRef = ref(null)

// 图表实例
let salesChart = null
let salesPieChart = null
let userChart = null
let productChart = null

// 响应式数据 - 营业额分析
const salesData = ref({
  dates: [],
  sales: []
})

// 响应式数据 - 销量数据统计
const salesPieData = ref([])

// 响应式数据 - 用户分析
const userData = ref({
  yesterday: {
    labels: [],
    totalUsers: [],
    newUsers: []
  },
  week: {
    labels: [],
    totalUsers: [],
    newUsers: []
  },
  month: {
    labels: [],
    totalUsers: [],
    newUsers: []
  }
})

// 响应式数据 - 商品销量排行
const productData = ref({
  names: [],
  sales: []
})

// 日期计算函数
const getDateRange = (type) => {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 1) // 明天作为结束日期
  
  const startDate = new Date(today)
  
  if (type === 'yesterday') {
    // 昨天作为开始和结束日期
    startDate.setDate(today.getDate() - 1)
    endDate.setDate(today.getDate()) // 昨天的结束日期是今天的开始
  } else if (type === 'week') {
    // 七天前作为开始日期
    startDate.setDate(today.getDate() - 7)
  } else if (type === 'month') {
    // 一个月前作为开始日期
    startDate.setMonth(today.getMonth() - 1)
  }
  
  // 格式化为 yyyy-MM-dd
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  }
}

// API请求函数
// 获取销量前十的商品
const fetchTopTenProducts = async () => {
  try {
    const res = await request.get('/admin/home/topTen')
    if (res && res.data) {
      // 反转数据，使销量最高的商品显示在图表的最上面
      const reversedData = res.data.reverse()
      productData.value.names = reversedData.map(item => item.bookName)
      productData.value.sales = reversedData.map(item => item.salesCount)
      initProductChart()
    }
  } catch (error) {
    console.error('获取销量前十商品失败:', error)
  }
}

// 获取商品类别销量占比
const fetchCategorySales = async () => {
  try {
    const res = await request.get('/admin/home/categorySales')
    if (res && res.data) {
      salesPieData.value = res.data.map(item => ({
        name: item.categoryName,
        value: item.saleRate
      }))
      initSalesPieChart()
    }
  } catch (error) {
    console.error('获取商品类别销量占比失败:', error)
  }
}

// 获取营业额数据
const fetchTurnoverData = async (type) => {
  try {
    const { startDate, endDate } = getDateRange(type)
    const res = await request.get('/admin/home/turnover', {
      params: { startDate, endDate }
    })
    if (res && res.data) {
      salesData.value.dates = res.data.map(item => item.data)
      salesData.value.sales = res.data.map(item => item.turnover)
      initSalesChart()
    }
  } catch (error) {
    console.error('获取营业额数据失败:', error)
  }
}

// 获取用户分析数据
const fetchUserData = async (type) => {
  try {
    const { startDate, endDate } = getDateRange(type)
    const res = await request.get('/admin/home/userAnalysis', {
      params: { startDate, endDate }
    })
    if (res && res.data) {
      userData.value[type].labels = res.data.map(item => item.date)
      userData.value[type].totalUsers = res.data.map(item => item.totalUser)
      userData.value[type].newUsers = res.data.map(item => item.newUser)
      initUserChart()
    }
  } catch (error) {
    console.error('获取用户分析数据失败:', error)
  }
}

// 初始化营业额分析图表
const initSalesChart = () => {
  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['营业额'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: salesData.value.dates,
        name: '日期'
      },
      yAxis: {
        type: 'value',
        name: '营业额',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '营业额',
          type: 'line',
          data: salesData.value.sales,
          lineStyle: {
            color: '#409eff'
          }
        }
      ]
    }
    salesChart.setOption(option)
  }
}

// 初始化销量数据统计图表
const initSalesPieChart = () => {
  if (salesPieChartRef.value) {
    salesPieChart = echarts.init(salesPieChartRef.value)
    const option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center'
      },
      series: [
        {
          name: '销量占比',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: salesPieData.value
        }
      ]
    }
    salesPieChart.setOption(option)
  }
}

// 初始化用户分析图表
const initUserChart = () => {
  if (userChartRef.value) {
    userChart = echarts.init(userChartRef.value)
    const currentData = userData.value[userTab.value]
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['总用户', '新用户'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: currentData.labels,
        name: '日期'
      },
      yAxis: {
        type: 'value',
        name: '数量',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '总用户',
          type: 'line',
          data: currentData.totalUsers,
          lineStyle: { color: '#409eff' }
        },
        {
          name: '新用户',
          type: 'line',
          data: currentData.newUsers,
          lineStyle: { color: '#67c23a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ])
          }
        }
      ]
    }
    userChart.setOption(option)
  }
}

// 初始化商品销量排行图表
const initProductChart = () => {
  if (productChartRef.value) {
    productChart = echarts.init(productChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}'
        }
      },
      yAxis: {
        type: 'category',
        data: productData.value.names,
        axisLabel: {
          interval: 0,
          rotate: 0
        }
      },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: productData.value.sales,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#66b1ff' }
            ])
          }
        }
      ]
    }
    productChart.setOption(option)
  }
}

// 响应式处理
const handleResize = () => {
  salesChart?.resize()
  salesPieChart?.resize()
  userChart?.resize()
  productChart?.resize()
}

// 监听营业额分析标签变化
watch(salesTab, (newType) => {
  fetchTurnoverData(newType)
})

// 监听用户标签变化
watch(userTab, (newType) => {
  fetchUserData(newType)
})

// 初始化
onMounted(() => {
  // 获取初始数据
  fetchTopTenProducts() // 销量前十的商品
  fetchCategorySales() // 商品类别销量占比
  fetchTurnoverData('yesterday') // 昨日营业额数据
  fetchUserData('yesterday') // 昨日用户分析数据
  
  // 添加响应式监听
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-container {
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



.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}



.chart-content {
  padding: 20px;
}

.chart {
  width: 100%;
  height: 300px;
}

.time-tabs {
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}
</style>