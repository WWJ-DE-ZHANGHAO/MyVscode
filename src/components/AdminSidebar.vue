<template>
  <div class="layout-with-topbar">
    <aside class="sidebar">
    <div class="logo-area">
      <h2>云图书城</h2>
      <p>管理端 · 智慧运营</p>
    </div>

    <el-menu
      :default-active="$route.path"
      background-color="#ffffff"
      text-color="#2c3e50"
      active-text-color="#2266c7"
      class="sidebar-menu"
      router
    >
      <el-menu-item v-if="hasPermission('dashboard:view')" index="/home">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>

      <el-menu-item v-if="hasPermission('ad:view')" index="/ad" @click="emitMenuClick('/ad')">
        <el-icon><Monitor /></el-icon>
        <span>广告管理</span>
      </el-menu-item>

      <el-menu-item v-if="hasPermission('category:view')" index="/category">
        <el-icon><Folder /></el-icon>
        <span>类目管理</span>
      </el-menu-item>

      <el-sub-menu v-if="hasAnyChildPermission(['product:list:view', 'product:stock:view', 'product:stock:log:view'])" index="product-group">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>商品管理</span>
        </template>
        <el-menu-item v-if="hasPermission('product:list:view')" index="/product/list">
          <el-icon><Document /></el-icon>
          <span>商品列表</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('product:stock:view')" index="/stock/manage">
          <el-icon><DataAnalysis /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('product:stock:log:view')" index="/stock/log">
          <el-icon><Tickets /></el-icon>
          <span>库存日志</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-if="hasPermission('comment:view')" index="/comment">
        <el-icon><Star /></el-icon>
        <span>评价管理</span>
      </el-menu-item>

      <el-sub-menu v-if="hasAnyChildPermission(['freight:template:view', 'freight:rule:view'])" index="freight-group">
        <template #title>
          <el-icon><SetUp /></el-icon>
          <span>运费管理</span>
        </template>
        <el-menu-item v-if="hasPermission('freight:template:view')" index="/freight/template">
          <el-icon><Files /></el-icon>
          <span>运费模板</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('freight:rule:view')" index="/freight/rule">
          <el-icon><Setting /></el-icon>
          <span>运费规则</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-if="hasPermission('order:view')" index="/order">
        <el-icon><Tickets /></el-icon>
        <span>订单管理</span>
      </el-menu-item>

      <el-menu-item v-if="hasPermission('topic:view')" index="/topic">
        <el-icon><Star /></el-icon>
        <span>专题管理</span>
      </el-menu-item>

      <el-menu-item v-if="hasPermission('user:view')" index="/user">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>

      <el-menu-item v-if="hasPermission('system:admin:view')" index="/employee">
        <el-icon><UserFilled /></el-icon>
        <span>员工管理</span>
      </el-menu-item>

      <el-sub-menu v-if="hasAnyChildPermission(['marketing:member:view', 'marketing:coupon:view', 'marketing:point:log:view', 'marketing:coupon:log:view'])" index="marketing-group">
        <template #title>
          <el-icon><Present /></el-icon>
          <span>营销中心</span>
        </template>
        <el-menu-item v-if="hasPermission('marketing:member:view')" index="/marketing/member">
          <el-icon><UserFilled /></el-icon>
          <span>会员权益管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('marketing:coupon:view')" index="/marketing/coupon-template">
          <el-icon><Tickets /></el-icon>
          <span>优惠券模版管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('marketing:point:log:view')" index="/marketing/point-log">
          <el-icon><DataAnalysis /></el-icon>
          <span>积分日志</span>
        </el-menu-item>
        <el-menu-item v-if="hasPermission('marketing:coupon:log:view')" index="/marketing/coupon-log">
          <el-icon><Document /></el-icon>
          <span>优惠券日志</span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item v-if="hasPermission('service:view')" index="/customer-service">
        <el-icon><Message /></el-icon>
        <span>客服中心</span>
      </el-menu-item>
    </el-menu>
    </aside>

    <!-- 顶部栏（组件一部分） -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-left">
          <!-- 可放置面包屑或页面标题 -->
        </div>
        <div class="topbar-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><User /></el-icon>
              <span class="admin-name">管理员</span>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  HomeFilled,
  Monitor,
  Folder,
  Box,
  Document,
  DataAnalysis,
  Tickets,
  Star,
  SetUp,
  Files,
  Setting,
  User,
  Present,
  UserFilled,
  Message
} from '@element-plus/icons-vue'

const router = useRouter()

// 权限判断函数
const hasPermission = (permission) => {
  const permissions = JSON.parse(sessionStorage.getItem('permissions') || '[]')
  return permissions.includes(permission)
}

// 判断子菜单是否有至少一个权限
const hasAnyChildPermission = (permissions) => {
  return permissions.some(p => hasPermission(p))
}

function handleCommand(command) {
  if (command === 'logout') {
    try {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('userInfo')
      sessionStorage.removeItem('permissions')
      sessionStorage.removeItem('roleCode')
      sessionStorage.removeItem('roleName')
      sessionStorage.removeItem('realName')
      sessionStorage.removeItem('username')
    } catch (e) {}
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

function emitMenuClick(path) {
  try {
    window.dispatchEvent(new CustomEvent('menu-click', { detail: path }))
  } catch (e) {}
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, #f0f4f8 0%, #e8eef5 50%, #f5f7fa 100%);
  border-right: 1px solid rgba(200, 210, 225, 0.6);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.topbar {
  position: fixed;
  left: 260px;
  right: 0;
  top: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(230, 235, 242, 0.6);
  display: flex;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.topbar-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-dropdown-link:hover {
  background: rgba(102, 126, 234, 0.1);
}

.admin-name {
  margin: 0 8px;
  color: #1a202c;
  font-weight: 500;
  font-size: 14px;
}

.logo-area {
  padding: 32px 24px 24px 24px;
  border-bottom: 1px solid rgba(230, 235, 242, 0.5);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 10;
}

.logo-area::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.logo-area::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.logo-area h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-area p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.3px;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding: 16px 12px;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.el-menu-item),
:deep(.el-sub-menu .el-sub-menu__title) {
  border-radius: 12px;
  margin: 4px 0;
  height: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

:deep(.el-menu-item::before),
:deep(.el-sub-menu .el-sub-menu__title::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.el-menu-item:nth-child(1)::before),
:deep(.el-sub-menu:nth-child(1) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(2)::before),
:deep(.el-sub-menu:nth-child(2) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(240, 147, 251, 0.15) 0%, rgba(240, 147, 251, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(3)::before),
:deep(.el-sub-menu:nth-child(3) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(4)::before),
:deep(.el-sub-menu:nth-child(4) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(5)::before),
:deep(.el-sub-menu:nth-child(5) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(6)::before),
:deep(.el-sub-menu:nth-child(6) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(7)::before),
:deep(.el-sub-menu:nth-child(7) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%);
}

:deep(.el-menu-item:nth-child(8)::before),
:deep(.el-sub-menu:nth-child(8) .el-sub-menu__title::before) {
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%);
}

:deep(.el-menu-item:hover::before),
:deep(.el-sub-menu .el-sub-menu__title:hover::before) {
  opacity: 1;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu .el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.8) !important;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu .el-sub-menu__title .el-icon) {
  font-size: 18px;
  color: #64748b;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:nth-child(1):hover .el-icon),
:deep(.el-sub-menu:nth-child(1) .el-sub-menu__title:hover .el-icon) {
  color: #667eea;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(2):hover .el-icon),
:deep(.el-sub-menu:nth-child(2) .el-sub-menu__title:hover .el-icon) {
  color: #f093fb;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(3):hover .el-icon),
:deep(.el-sub-menu:nth-child(3) .el-sub-menu__title:hover .el-icon) {
  color: #34d399;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(4):hover .el-icon),
:deep(.el-sub-menu:nth-child(4) .el-sub-menu__title:hover .el-icon) {
  color: #fb923c;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(5):hover .el-icon),
:deep(.el-sub-menu:nth-child(5) .el-sub-menu__title:hover .el-icon) {
  color: #3b82f6;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(6):hover .el-icon),
:deep(.el-sub-menu:nth-child(6) .el-sub-menu__title:hover .el-icon) {
  color: #ec4899;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(7):hover .el-icon),
:deep(.el-sub-menu:nth-child(7) .el-sub-menu__title:hover .el-icon) {
  color: #8b5cf6;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item:nth-child(8):hover .el-icon),
:deep(.el-sub-menu:nth-child(8) .el-sub-menu__title:hover .el-icon) {
  color: #14b8a6;
  transform: scale(1.15) rotate(5deg);
}

:deep(.el-menu-item span),
:deep(.el-sub-menu .el-sub-menu__title span) {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: color 0.3s ease;
}

:deep(.el-menu-item:hover span),
:deep(.el-sub-menu .el-sub-menu__title:hover span) {
  color: #1e293b;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(102, 126, 234, 0.08) 100%) !important;
  font-weight: 600;
  position: relative;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

:deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 70%;
  width: 4px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.5);
}

:deep(.el-menu-item.is-active .el-icon) {
  color: #667eea;
  transform: scale(1.1);
}

:deep(.el-menu-item.is-active span) {
  color: #1e293b;
  font-weight: 600;
}

:deep(.el-sub-menu.is-opened .el-sub-menu__title) {
  background: rgba(102, 126, 234, 0.08) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.el-sub-menu .el-menu) {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  margin: 4px 0;
  padding: 4px 0;
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
  height: 42px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.4);
  margin: 2px 8px;
  border-radius: 8px;
}

:deep(.el-sub-menu .el-menu-item .el-icon) {
  font-size: 16px;
  color: #64748b;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.8) !important;
  transform: translateX(2px);
}

:deep(.el-sub-menu .el-menu-item:hover .el-icon) {
  color: #667eea;
  transform: scale(1.1);
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0.05) 100%) !important;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(230, 235, 242, 0.5);
  background: linear-gradient(180deg, transparent 0%, rgba(240, 244, 248, 0.8) 100%);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #64748b;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.admin-info:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

:deep(.el-dropdown-menu) {
  border: 1px solid rgba(230, 235, 242, 0.8);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
}

:deep(.el-dropdown-menu__item) {
  border-radius: 8px;
  padding: 10px 16px;
  transition: all 0.3s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
  color: #667eea;
}

.sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.3) 0%, rgba(240, 147, 251, 0.3) 100%);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.5) 0%, rgba(240, 147, 251, 0.5) 100%);
}
</style>