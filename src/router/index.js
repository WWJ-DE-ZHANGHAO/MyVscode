import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Category from '../views/Category.vue' 
import MainLayout from '@/layouts/MainLayout.vue'
import BookDetail from '@/views/BookDetail.vue' 
import SearchResult from '@/views/SearchResult.vue'
import SpecialPriceView from '@/views/SpecialPrice.vue'
import NewBooks from '../views/NewBooks.vue'
import SpecialTopics from '@/views/SpecialTopics.vue'
// import bookData from '@/mock/bookData.js'   // 已移除，不再需要
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import User from '@/views/User.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Home', component: Home },
      { path: 'category', name: 'Category', component: Category },
      { path: 'book/:id', name: 'BookDetail', component: BookDetail, props: true },
      { path: 'search', name: 'SearchResult', component: SearchResult },
      { path: 'special-price', name: 'SpecialPrice', component: SpecialPriceView },
      { path: 'new-books', name: 'NewBooks', component: NewBooks },
      { path: 'topics', name: 'SpecialTopics', component: SpecialTopics },
      { path: 'cart', name: 'Cart', component: () => import('@/views/Cart.vue') },
      { path: 'user', name: 'User', component: User }
    ]
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 可选：如果需要登录保护，可以保留一个简单的认证守卫
// 全局路由守卫：除登录/注册外均需登录
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('authToken')
  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(to.path)) {
    next()
    return
  }
  if (!token) {
    // 带上重定向信息，登录后返回原路径
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router