import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Category from '../views/Category.vue' 
import MainLayout from '@/layouts/MainLayout.vue'
import BookDetail from '@/views/BookDetail.vue' 
import SearchResult from '@/views/SearchResult.vue'
import SpecialPriceView from '@/views/SpecialPrice.vue'
// import NewBooks from '../views/NewBooks.vue'
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
      { path: 'new-books', name: 'NewBooks', component: () => import('@/views/NewBooks.vue') },
      { path: 'topics', name: 'SpecialTopics', component: SpecialTopics },
      { path: 'order/create', name: 'CreateOrder', component: () => import('@/views/Checkout.vue') },
      { path: 'checkout', name: 'Checkout', component: () => import('@/views/Checkout.vue') },
      { path: 'payment', name: 'Payment', component: () => import('@/views/Payment.vue') },
      { path: 'payment/success', name: 'PaymentSuccess', component: () => import('@/views/PaymentSuccess.vue') },
      { path: 'cart', name: 'Cart', component: () => import('@/views/Cart.vue') },
      { path: 'user', name: 'User', component: User }
    ]
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 全局路由守卫：除登录/注册外均需登录
router.beforeEach((to, from, next) => {
  // 兼容双Token和旧版单Token
  const accessToken = sessionStorage.getItem('accessToken')
  const oldToken = sessionStorage.getItem('token')
  const publicPaths = ['/login', '/register']
  
  // 公开路径直接放行
  if (publicPaths.includes(to.path)) {
    next()
    return
  }
  
  // 未登录则强制跳转登录页
  if (!accessToken && !oldToken) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router