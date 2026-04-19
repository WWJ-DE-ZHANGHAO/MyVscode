import { createRouter, createWebHistory } from 'vue-router'

// 登录和注册页面
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

// 您已有的页面
import Ad from '@/views/ad.vue'  // 根据您的实际路径调整
import Category from '@/views/Category.vue'  // 分类管理页面
import ProductList from '@/views/ProductList.vue'  // 商品列表页面
import OrderList from '@/views/OrderList.vue'  // 订单管理页面
import StockManage from '@/views/StockManage.vue'  // 库存管理页面
import StockLog from '@/views/StockLog.vue'  // 库存日志页面
import Comment from '@/views/Comment.vue'  // 评价管理页面
import ShippingTemplate from '@/views/ShippingTemplate.vue'  // 运费模板页面
import ShippingRule from '@/views/ShippingRule.vue'  // 运费规则页面
import UserManager from '@/views/UserManager.vue'  // 用户管理页面
import Topic from '@/views/Topic.vue'  // 专题管理页面
import Dashboard from '@/views/Dashboard.vue'  // 数据统计首页
import MemberLevel from '@/views/MemberLevel.vue'  // 会员权益管理页面
import CouponTemplate from '@/views/CouponTemplate.vue'  // 优惠券模板管理页面
import PointLog from '@/views/PointLog.vue'  // 积分日志页面
import CouponLog from '@/views/CouponLog.vue'  // 优惠券日志页面
import CustomerService from '@/views/CustomerService.vue'  // 客服中心页面

// 暂时还没写的页面，用简单占位
import Placeholder from '@/views/Placeholder.vue'
// `Test.vue` 文件缺失，使用占位页面以避免导入失败
import Test from '@/views/Placeholder.vue'  // 测试页面（临时占位）
// `TestPage.vue` 文件缺失，使用占位页面以避免导入失败
import TestPage from '@/views/Placeholder.vue'  // 测试页面2（临时占位）
// `SimpleLogin.vue` 文件缺失，使用占位页面以避免导入失败
import SimpleLogin from '@/views/Placeholder.vue'  // 简单登录页面（临时占位）

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '注册' }
  },
  {
    path: '/home',
    name: 'Home',
    component: Dashboard,
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/ad',
    name: 'Ad',
    component: Ad,  // 您已有的广告管理页面
    meta: { title: '广告管理', requiresAuth: true }
  },
  {
    path: '/category',
    name: 'Category',
    component: Category,
    meta: { title: '类目管理', requiresAuth: true }
  },
  {
    path: '/product/list',
    name: 'ProductList',
    component: ProductList,
    meta: { title: '商品列表', requiresAuth: true }
  },
  {
    path: '/stock/manage',
    name: 'StockManage',
    component: StockManage,
    meta: { title: '库存管理', requiresAuth: true }
  },
  {
    path: '/stock/log',
    name: 'StockLog',
    component: StockLog,
    meta: { title: '库存日志', requiresAuth: true }
  },
  {
    path: '/comment',
    name: 'Comment',
    component: Comment,
    meta: { title: '评价管理', requiresAuth: true }
  },
  {
    path: '/freight/template',
    name: 'FreightTemplate',
    component: ShippingTemplate,
    meta: { title: '运费模板', requiresAuth: true }
  },
  {
    path: '/freight/rule',
    name: 'FreightRule',
    component: ShippingRule,
    meta: { title: '运费规则', requiresAuth: true }
  },
  {
    path: '/order',
    name: 'Order',
    component: OrderList,
    meta: { title: '订单管理', requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    component: UserManager,
    meta: { title: '用户管理', requiresAuth: true }
  },
  {
    path: '/topic',
    name: 'Topic',
    component: Topic,
    meta: { title: '专题管理', requiresAuth: true }
  },
  {
    path: '/marketing/coupon',
    name: 'CouponManage',
    component: Placeholder,
    meta: { title: '优惠券管理', requiresAuth: true }
  },
  {
    path: '/marketing/member',
    name: 'MemberSystem',
    component: MemberLevel,
    meta: { title: '会员权益管理', requiresAuth: true }
  },
  {
    path: '/marketing/coupon-template',
    name: 'CouponTemplate',
    component: CouponTemplate,
    meta: { title: '优惠券模版管理', requiresAuth: true }
  },
  {
    path: '/marketing/point-log',
    name: 'PointLog',
    component: PointLog,
    meta: { title: '积分日志', requiresAuth: true }
  },
  {
    path: '/marketing/coupon-log',
    name: 'CouponLog',
    component: CouponLog,
    meta: { title: '优惠券日志', requiresAuth: true }
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: CustomerService,
    meta: { title: '客服中心', requiresAuth: true }
  },
  {
    path: '/marketing/points',
    name: 'PointsMall',
    component: Placeholder,
    meta: { title: '积分商城', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人资料', requiresAuth: true }
  },
  {
    path: '/test',
    name: 'Test',
    component: Test,
    meta: { title: '测试页面' }
  },
  {
    path: '/testpage',
    name: 'TestPage',
    component: TestPage,
    meta: { title: '测试页面2' }
  },
  {
    path: '/simplelogin',
    name: 'SimpleLogin',
    component: SimpleLogin,
    meta: { title: '简单登录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 云图书城管理端` : '云图书城管理端'
  
  console.log('路由守卫 - 目标路由:', to.path)
  console.log('路由守卫 - 是否需要认证:', to.meta.requiresAuth)
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    // 检查是否已登录
    const token = sessionStorage.getItem('token')
    console.log('路由守卫 - token:', token)
    if (token) {
      console.log('路由守卫 - 有token，继续访问')
      next()
    } else {
      console.log('路由守卫 - 无token，跳转到登录页')
      // 未登录，跳转到登录页
      next('/login')
    }
  } else {
    console.log('路由守卫 - 不需要认证，继续访问')
    next()
  }
})

export default router