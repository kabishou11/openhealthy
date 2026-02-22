<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const router = useRouter()

// Initialize auth state
onMounted(() => {
  authStore.init()
})

// 导航图标配置
const navIcons: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  qa: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  health: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z',
  menu: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
}

// 智能问答子页面
const knowledgeSubItems = [
  { name: '智能对话', path: '/knowledge', icon: '💬' },
  { name: '知识库管理', path: '/knowledge/manage', icon: '📚' },
  { name: '模型配置', path: '/knowledge/models', icon: '⚙️' },
  { name: '提示词管理', path: '/knowledge/prompts', icon: '📝' },
]

// 餐单食谱子页面
const menuSubItems = [
  { name: '餐单计划', path: '/menu', icon: '📅' },
  { name: '食谱库', path: '/recipes', icon: '🍳' },
]

// 主导航项
const navItems = [
  { name: '首页', path: '/', icon: 'home', subItems: null as typeof knowledgeSubItems | null },
  { name: '智能问答', path: '/knowledge', icon: 'qa', subItems: knowledgeSubItems },
  { name: '健康管理', path: '/health', icon: 'health', subItems: null as typeof knowledgeSubItems | null },
  { name: '餐单食谱', path: '/menu', icon: 'menu', subItems: menuSubItems },
]

// Admin management items
const adminItems = [
  { name: '学校管理', path: '/admin/school', icon: '🏫' },
  { name: '食堂管理', path: '/admin/cafeteria', icon: '🍽️' },
]

// 判断是否激活
const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isMobileMenuOpen = ref(false)
const expandedMenu = ref<string | null>(null)

// Toggle mobile menu expansion
const toggleMenu = (menu: string) => {
  expandedMenu.value = expandedMenu.value === menu ? null : menu
}

// Close mobile menu
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  expandedMenu.value = null
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-gray-100">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span class="text-xl font-bold text-emerald-600">NutriMind</span>
        </NuxtLink>

        <!-- 桌面导航 -->
        <div class="hidden lg:flex items-center gap-1">
          <template v-for="item in navItems" :key="item.path">
            <!-- 有子菜单的导航项 -->
            <div v-if="item.subItems" class="relative group">
              <NuxtLink
                :to="item.path"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                :class="isActive(item.path) ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons[item.icon]" />
                </svg>
                {{ item.name }}
                <svg class="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </NuxtLink>
              <div class="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <NuxtLink
                  v-for="sub in item.subItems"
                  :key="sub.path"
                  :to="sub.path"
                  class="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                  :class="{ 'bg-emerald-50 text-emerald-700': isActive(sub.path) }"
                >
                  <span>{{ sub.icon }}</span>
                  <span class="text-sm text-gray-700">{{ sub.name }}</span>
                </NuxtLink>
              </div>
            </div>
            <!-- 无子菜单的导航项 -->
            <NuxtLink
              v-else
              :to="item.path"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              :class="isActive(item.path) ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons[item.icon]" />
              </svg>
              {{ item.name }}
            </NuxtLink>
          </template>

          <!-- Admin dropdown for admins -->
          <div v-if="authStore.isAuthenticated && ['SCHOOL_ADMIN', 'CAFETERIA_MANAGER', 'ADMIN'].includes(authStore.userRole)" class="relative group">
            <button class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.admin" />
              </svg>
              后台管理
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <NuxtLink
                v-for="admin in adminItems"
                :key="admin.path"
                :to="admin.path"
                class="flex items-center gap-2 px-4 py-3 hover:bg-gray-50"
                :class="{ 'bg-purple-50': isActive(admin.path) }"
              >
                <span>{{ admin.icon }}</span>
                <span class="text-sm text-gray-700">{{ admin.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 用户信息 -->
          <NuxtLink
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg"
          >
            <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {{ authStore.userName?.charAt(0) || 'U' }}
            </div>
          </NuxtLink>
          <button
            v-if="authStore.isAuthenticated"
            @click="authStore.logout()"
            class="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <!-- 登录按钮 -->
          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="hidden sm:flex items-center justify-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium"
          >
            登录
          </NuxtLink>

          <!-- 移动端菜单按钮 -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50"
          >
            <svg v-if="!isMobileMenuOpen" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 移动端导航 -->
      <div v-if="isMobileMenuOpen" class="lg:hidden py-4 border-t border-gray-100">
        <!-- 用户状态 -->
        <div v-if="authStore.isAuthenticated" class="mb-4 p-3 bg-emerald-50 rounded-xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
              {{ authStore.userName?.charAt(0) || 'U' }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ authStore.userName || '用户' }}</p>
              <p class="text-sm text-emerald-600">{{ authStore.getRoleName(authStore.userRole) }}</p>
            </div>
            <button @click="authStore.logout()" class="p-2 text-gray-500 hover:text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        <div v-else class="mb-4">
          <NuxtLink
            to="/login"
            @click="closeMobileMenu"
            class="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-medium"
          >
            登录 / 注册
          </NuxtLink>
        </div>

        <!-- 主导航 -->
        <div class="space-y-1 mb-4">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="closeMobileMenu"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            :class="isActive(item.path) ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons[item.icon]" />
            </svg>
            <span class="font-medium">{{ item.name }}</span>
          </NuxtLink>
        </div>

        <!-- 智能问答子菜单 -->
        <div class="mb-4">
          <button
            @click="toggleMenu('knowledge')"
            class="flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-xl"
          >
            <span class="font-medium text-gray-700">智能问答功能</span>
            <svg class="w-5 h-5 text-gray-400 transition-transform" :class="{ 'rotate-180': expandedMenu === 'knowledge' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="expandedMenu === 'knowledge'" class="mt-2 space-y-1 pl-4">
            <NuxtLink
              v-for="sub in knowledgeSubItems"
              :key="sub.path"
              :to="sub.path"
              @click="closeMobileMenu"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <span>{{ sub.icon }}</span>
              <span>{{ sub.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Admin menu -->
        <div v-if="authStore.isAuthenticated && ['SCHOOL_ADMIN', 'CAFETERIA_MANAGER', 'ADMIN'].includes(authStore.userRole)">
          <div class="px-4 py-3 bg-purple-50 rounded-xl mb-2">
            <p class="text-sm font-medium text-purple-700">后台管理</p>
          </div>
          <div class="space-y-1">
            <NuxtLink
              v-for="admin in adminItems"
              :key="admin.path"
              :to="admin.path"
              @click="closeMobileMenu"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <span>{{ admin.icon }}</span>
              <span>{{ admin.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
