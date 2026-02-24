<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => { authStore.init() })

const navIcons: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  qa: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  health: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z',
  menu: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
}

// Role-based nav items
const knowledgeSubItems = computed(() => {
  const items = [{ name: '智能对话', path: '/knowledge', icon: '💬' }]
  // Show management items for all authenticated users (or always show them)
  items.push(
    { name: '知识库管理', path: '/knowledge/manage', icon: '📚' },
    { name: '模型配置', path: '/knowledge/models', icon: '⚙️' },
    { name: '提示词管理', path: '/knowledge/prompts', icon: '📝' },
  )
  return items
})

const menuSubItems = computed(() => {
  const items: { name: string; path: string; icon: string }[] = []
  // Personal meal plan - for personal users and unauthenticated
  if (!authStore.isAuthenticated || !authStore.canManageCafeteria || authStore.isAdmin) {
    items.push({ name: '个人餐单', path: '/menu', icon: '📅' })
  }
  // Cafeteria plan - for cafeteria staff and school admins
  if (authStore.canManageCafeteria || authStore.isSchoolAdmin || authStore.isAdmin) {
    items.push({ name: '食堂餐单', path: '/menu/cafeteria', icon: '🏫' })
  }
  // Recipes always visible
  items.push({ name: '食谱库', path: '/recipes', icon: '🍳' })
  // No shopping list here - it's inside the menu page
  return items
})

// Admin items based on role
const adminItems = computed(() => {
  const items: { name: string; path: string; icon: string }[] = []
  if (authStore.isAdmin || authStore.isSchoolAdmin) {
    items.push({ name: '学校管理', path: '/admin/school', icon: '🏫' })
    items.push({ name: '学生管理', path: '/admin/students', icon: '👨‍🎓' })
  }
  if (authStore.isAdmin || authStore.canManageCafeteria) {
    items.push({ name: '食堂管理', path: '/admin/cafeteria', icon: '🍽️' })
  }
  if (authStore.isAdmin) {
    items.push({ name: '用户管理', path: '/admin/users', icon: '👥' })
  }
  return items
})

// Health nav - show scan only for non-cook roles
const showHealthScan = computed(() =>
  !authStore.isAuthenticated || !authStore.isCafeteriaCook
)

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isMobileMenuOpen = ref(false)
const expandedMenu = ref<string | null>(null)
const toggleMenu = (menu: string) => { expandedMenu.value = expandedMenu.value === menu ? null : menu }
const closeMobileMenu = () => { isMobileMenuOpen.value = false; expandedMenu.value = null }

// Role display
const roleLabel = computed(() => authStore.getRoleName(authStore.userRole))
const roleBadge = computed(() => authStore.roleBadgeColor)
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-gray-100">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span class="text-lg font-bold text-emerald-600">NutriMind</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <div class="hidden lg:flex items-center gap-0.5">
          <!-- Home -->
          <NuxtLink to="/" class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            :class="isActive('/') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.home"/>
            </svg>
            首页
          </NuxtLink>

          <!-- 智能问答 dropdown -->
          <div class="relative group">
            <NuxtLink to="/knowledge" class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              :class="isActive('/knowledge') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.qa"/>
              </svg>
              智能问答
              <svg class="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </NuxtLink>
            <div class="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
              <NuxtLink v-for="sub in knowledgeSubItems" :key="sub.path" :to="sub.path"
                class="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                :class="{ 'bg-emerald-50 text-emerald-700': isActive(sub.path) }">
                <span>{{ sub.icon }}</span>{{ sub.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- 健康管理 -->
          <NuxtLink to="/health/records" class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            :class="isActive('/health') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.health"/>
            </svg>
            健康管理
          </NuxtLink>

          <!-- 餐单食谱 dropdown -->
          <div class="relative group">
            <NuxtLink to="/menu" class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              :class="isActive('/menu') || isActive('/recipes') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.menu"/>
              </svg>
              餐单食谱
              <svg class="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </NuxtLink>
            <div class="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
              <NuxtLink v-for="sub in menuSubItems" :key="sub.path" :to="sub.path"
                class="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                :class="{ 'bg-emerald-50 text-emerald-700': isActive(sub.path) }">
                <span>{{ sub.icon }}</span>{{ sub.name }}
              </NuxtLink>
            </div>
          </div>

          <!-- 后台管理 (staff only) -->
          <div v-if="authStore.isAuthenticated && adminItems.length > 0" class="relative group">
            <button class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
              :class="isActive('/admin') ? 'bg-purple-100 text-purple-700' : ''">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.admin"/>
              </svg>
              后台管理
              <svg class="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
              <NuxtLink v-for="item in adminItems" :key="item.path" :to="item.path"
                class="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                :class="{ 'bg-purple-50 text-purple-700': isActive(item.path) }">
                <span>{{ item.icon }}</span>{{ item.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-2">
          <!-- User badge (logged in) -->
          <div v-if="authStore.isAuthenticated" class="hidden sm:flex items-center gap-2">
            <NuxtLink to="/dashboard" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div class="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {{ authStore.userName?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <div class="leading-tight">
                <p class="text-xs font-medium text-gray-800">{{ authStore.userName }}</p>
                <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" :class="roleBadge">{{ roleLabel }}</span>
              </div>
            </NuxtLink>
            <button @click="authStore.logout()"
              class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>

          <!-- Login button -->
          <NuxtLink v-if="!authStore.isAuthenticated" to="/login"
            class="hidden sm:flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
            登录
          </NuxtLink>

          <!-- Mobile menu toggle -->
          <button @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100">
            <svg v-if="!isMobileMenuOpen" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="isMobileMenuOpen" class="lg:hidden py-4 border-t border-gray-100 space-y-2">
        <!-- User info -->
        <div v-if="authStore.isAuthenticated" class="p-3 bg-gray-50 rounded-xl flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
            {{ authStore.userName?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 text-sm">{{ authStore.userName }}</p>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="roleBadge">{{ roleLabel }}</span>
          </div>
          <button @click="authStore.logout()" class="p-2 text-gray-400 hover:text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
        <NuxtLink v-else to="/login" @click="closeMobileMenu"
          class="flex items-center justify-center w-full py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm mb-3">
          登录 / 注册
        </NuxtLink>

        <!-- Nav links -->
        <NuxtLink to="/" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
          :class="isActive('/') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.home"/></svg>
          首页
        </NuxtLink>
        <NuxtLink to="/health/records" @click="closeMobileMenu" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
          :class="isActive('/health') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.health"/></svg>
          健康管理
        </NuxtLink>

        <!-- 智能问答 expandable -->
        <div>
          <button @click="toggleMenu('knowledge')" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <span class="flex items-center gap-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.qa"/></svg>
              智能问答
            </span>
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': expandedMenu === 'knowledge' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div v-if="expandedMenu === 'knowledge'" class="pl-8 space-y-1 mt-1">
            <NuxtLink v-for="sub in knowledgeSubItems" :key="sub.path" :to="sub.path" @click="closeMobileMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <span>{{ sub.icon }}</span>{{ sub.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- 餐单食谱 expandable -->
        <div>
          <button @click="toggleMenu('menu')" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <span class="flex items-center gap-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.menu"/></svg>
              餐单食谱
            </span>
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': expandedMenu === 'menu' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div v-if="expandedMenu === 'menu'" class="pl-8 space-y-1 mt-1">
            <NuxtLink v-for="sub in menuSubItems" :key="sub.path" :to="sub.path" @click="closeMobileMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <span>{{ sub.icon }}</span>{{ sub.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- 后台管理 (staff only) -->
        <div v-if="authStore.isAuthenticated && adminItems.length > 0">
          <button @click="toggleMenu('admin')" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-purple-700 bg-purple-50 hover:bg-purple-100">
            <span class="flex items-center gap-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="navIcons.admin"/></svg>
              后台管理
            </span>
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': expandedMenu === 'admin' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div v-if="expandedMenu === 'admin'" class="pl-8 space-y-1 mt-1">
            <NuxtLink v-for="item in adminItems" :key="item.path" :to="item.path" @click="closeMobileMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-purple-50">
              <span>{{ item.icon }}</span>{{ item.name }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
