<script setup lang="ts">
const route = useRoute()

// 导航图标配置
const navIcons: Record<string, { path: string; gradient: string }> = {
  home: { path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', gradient: 'from-emerald-400 to-teal-500' },
  qa: { path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', gradient: 'from-blue-400 to-indigo-500' },
  health: { path: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z', gradient: 'from-rose-400 to-pink-500' },
  menu: { path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', gradient: 'from-amber-400 to-orange-500' },
}

// 主导航项
const navItems = [
  { name: '首页', path: '/', icon: 'home' },
  { name: '智能问答', path: '/knowledge', icon: 'qa', hasDropdown: true },
  { name: '健康管理', path: '/health', icon: 'health' },
  { name: '餐单食谱', path: '/menu', icon: 'menu' },
]

// 智能问答子页面
const knowledgeSubItems = [
  { name: '智能对话', path: '/knowledge', icon: '💬', description: '基于知识库的RAG问答' },
  { name: '知识库管理', path: '/knowledge/manage', icon: '📚', description: '管理知识条目和分类' },
  { name: '模型配置', path: '/knowledge/models', icon: '⚙️', description: '配置LLM和Embedding模型' },
  { name: '提示词管理', path: '/knowledge/prompts', icon: '📝', description: '管理系统提示词模板' },
]

// 判断是否激活
const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isMobileMenuOpen = ref(false)
const isQAMenuOpen = ref(false)
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-gray-100">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="relative">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">NutriMind</span>
        </NuxtLink>

        <!-- 桌面导航 -->
        <div class="hidden lg:flex items-center gap-1">
          <template v-for="item in navItems" :key="item.path">
            <!-- 智能问答带下拉菜单 -->
            <div
              v-if="item.hasDropdown"
              class="relative"
              @mouseenter="isQAMenuOpen = true"
              @mouseleave="isQAMenuOpen = false"
            >
              <NuxtLink
                :to="item.path"
                class="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                :class="isActive(item.path) ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'"
              >
                <!-- 激活状态背景 -->
                <div
                  v-if="isActive(item.path)"
                  class="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200"
                />
                <!-- 图标 -->
                <svg
                  class="w-5 h-5 relative z-10"
                  :class="isActive(item.path) ? `text-transparent bg-gradient-to-r ${navIcons[item.icon].gradient} bg-clip-text` : 'text-gray-400'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" :d="navIcons[item.icon].path" />
                </svg>
                <span class="relative z-10">{{ item.name }}</span>
                <svg
                  class="w-4 h-4 relative z-10 transition-transform"
                  :class="{ 'rotate-180': isQAMenuOpen }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </NuxtLink>

              <!-- 下拉菜单 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-if="isQAMenuOpen"
                  class="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                >
                  <NuxtLink
                    v-for="sub in knowledgeSubItems"
                    :key="sub.path"
                    :to="sub.path"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    :class="{ 'bg-emerald-50': isActive(sub.path) }"
                    @click="isQAMenuOpen = false"
                  >
                    <span class="text-xl">{{ sub.icon }}</span>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ sub.name }}</p>
                      <p class="text-xs text-gray-500">{{ sub.description }}</p>
                    </div>
                    <svg
                      v-if="isActive(sub.path)"
                      class="w-4 h-4 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </NuxtLink>
                </div>
              </Transition>
            </div>

            <!-- 普通导航项 -->
            <NuxtLink
              v-else
              :to="item.path"
              class="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              :class="isActive(item.path) ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'"
            >
              <!-- 激活状态背景 -->
              <div
                v-if="isActive(item.path)"
                class="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200"
              />
              <!-- 图标 -->
              <svg
                class="w-5 h-5 relative z-10"
                :class="isActive(item.path) ? `text-transparent bg-gradient-to-r ${navIcons[item.icon].gradient} bg-clip-text` : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="navIcons[item.icon].path" />
              </svg>
              <span class="relative z-10">{{ item.name }}</span>
            </NuxtLink>
          </template>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- GitHub -->
          <a
            href="https://github.com/anthropics/NutriMind"
            target="_blank"
            class="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
          >
            <svg class="w-5 h-5 text-gray-600" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
            </svg>
          </a>

          <!-- 移动端菜单按钮 -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
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
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="isMobileMenuOpen" class="lg:hidden py-4 border-t border-gray-100">
          <!-- 主导航项 -->
          <div class="flex flex-wrap gap-2 mb-4">
            <NuxtLink
              v-for="item in navItems.filter(i => !i.hasDropdown)"
              :key="item.path"
              :to="item.path"
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
              :class="isActive(item.path)
                ? `bg-gradient-to-r ${navIcons[item.icon].gradient} text-white shadow-lg`
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="navIcons[item.icon].path" />
              </svg>
              {{ item.name }}
            </NuxtLink>
          </div>

          <!-- 智能问答子菜单 -->
          <div class="px-4 py-3 bg-gray-50 rounded-xl">
            <p class="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              智能问答功能
            </p>
            <div class="flex flex-col gap-1">
              <NuxtLink
                v-for="sub in knowledgeSubItems"
                :key="sub.path"
                :to="sub.path"
                @click="isMobileMenuOpen = false"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                :class="isActive(sub.path)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-white'"
              >
                <span>{{ sub.icon }}</span>
                <span class="flex-1">{{ sub.name }}</span>
                <svg
                  v-if="isActive(sub.path)"
                  class="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>
