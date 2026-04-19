import { ref } from 'vue'
import request from '@/utils/request'

// 全局分类缓存（id->name 列表）
export const categories = ref([])
export const categoryMap = ref({})

export const loadCategories = async () => {
  try {
    // 检查是否已登录
    const token = sessionStorage.getItem('token')
    if (!token) {
      // 未登录时使用模拟数据
      const mockCategories = [
        { id: 1, name: '文学' },
        { id: 2, name: '历史' },
        { id: 3, name: '哲学' },
        { id: 4, name: '科学' },
        { id: 5, name: '技术' },
        { id: 6, name: '艺术' },
        { id: 7, name: '教育' },
        { id: 8, name: '生活' }
      ]
      categories.value = mockCategories
      const map = {}
      mockCategories.forEach(c => { map[String(c.id)] = c.name })
      categoryMap.value = map
      try { sessionStorage.setItem('categoryMap', JSON.stringify(map)) } catch (e) {}
      return categories.value
    }
    
    // 已登录时发送请求
    const res = await request.get('/user/category/list')
    // debug the raw response shape
    try { console.debug('loadCategories raw response:', res) } catch (e) {}
    let arr = []
    if (Array.isArray(res)) arr = res
    else if (res && Array.isArray(res.data)) arr = res.data
    else if (res && Array.isArray(res.list)) arr = res.list
    else if (res && typeof res === 'object') {
      // sometimes backend returns an object keyed by index or id -> convert to array
      const vals = Object.values(res)
      // prefer arrays inside values
      const found = vals.find(v => Array.isArray(v))
      if (found) arr = found
      else if (vals.length > 0 && vals.every(v => v && typeof v === 'object' && ('id' in v || 'name' in v))) arr = vals
      else arr = []
    }
    categories.value = arr || []
    const map = {}
    // ensure we have an array to iterate
    const items = Array.isArray(categories.value) ? categories.value : (categories.value && typeof categories.value === 'object' ? Object.values(categories.value) : [])
    try {
      items.forEach(c => { map[String(c.id)] = c && c.name != null ? String(c.name) : '' })
    } catch (iterErr) {
      console.error('category mapping iteration failed, items:', items, iterErr)
    }
    categoryMap.value = map
    try { sessionStorage.setItem('categoryMap', JSON.stringify(map)) } catch (e) {}
    // debug: 输出已加载的映射，方便在浏览器控制台确认
    try { console.debug('loadCategories -> categoryMap', categoryMap.value) } catch (e) {}
    return categories.value
  } catch (e) {
    console.error('loadCategories failed', e)
    // fallback: try from sessionStorage
    try {
      const raw = sessionStorage.getItem('categoryMap')
      if (raw) {
        categoryMap.value = JSON.parse(raw)
        // convert to categories array
        categories.value = Object.keys(categoryMap.value).map(k => ({ id: Number(k), name: categoryMap.value[k] }))
        return categories.value
      }
    } catch (inner) { console.error(inner) }
    // 如果没有缓存，使用模拟数据
    const mockCategories = [
      { id: 1, name: '文学' },
      { id: 2, name: '历史' },
      { id: 3, name: '哲学' },
      { id: 4, name: '科学' },
      { id: 5, name: '技术' },
      { id: 6, name: '艺术' },
      { id: 7, name: '教育' },
      { id: 8, name: '生活' }
    ]
    categories.value = mockCategories
    const map = {}
    mockCategories.forEach(c => { map[String(c.id)] = c.name })
    categoryMap.value = map
    try { sessionStorage.setItem('categoryMap', JSON.stringify(map)) } catch (e) {}
    return categories.value
  }
}

export const getCategoryName = (id) => {
  if (id == null) return ''
  return categoryMap.value[String(id)] || ''
}

// WebSocket helper: subscribe to category updates (管理端可推送最新分类)
export const subscribeCategoryUpdates = (wsUrl) => {
  if (!wsUrl) return null
  try {
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'category:update' && Array.isArray(msg.data)) {
          // update local cache
          categories.value = msg.data
          const map = {}
          const items = Array.isArray(msg.data) ? msg.data : (msg.data && typeof msg.data === 'object' ? Object.values(msg.data) : [])
          try {
            items.forEach(c => { map[String(c.id)] = c && c.name != null ? String(c.name) : '' })
          } catch (iterErr) {
            console.error('ws category mapping iteration failed, items:', items, iterErr)
          }
          categoryMap.value = map
          try { sessionStorage.setItem('categoryMap', JSON.stringify(map)) } catch (e) {}
          try { console.debug('ws category update -> categoryMap', categoryMap.value) } catch (e) {}
        }
      } catch (e) { console.error('ws message parse failed', e) }
    }
    ws.onopen = () => console.log('category WS connected')
    ws.onerror = (e) => console.warn('category WS error', e)
    ws.onclose = () => console.log('category WS closed')
    return ws
  } catch (e) {
    console.error('subscribeCategoryUpdates failed', e)
    return null
  }
}

export default {
  categories,
  categoryMap,
  loadCategories,
  getCategoryName,
  subscribeCategoryUpdates
}
