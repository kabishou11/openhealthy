<script setup lang="ts">
import type { CurrentFood } from '~/types'
import { useStorage } from '@vueuse/core'

const isPlaying = ref(false)
const currentFood = ref<CurrentFood>()
const shakeTitle = ref(false)

// Demo data for NutriMind
const categories = ref(['营养分析', '食谱推荐', '健康咨询', '餐单规划'])
const selectedCategories = useStorage<string[]>('selected-categories', [...categories.value])
const isAllSelected = computed(() => selectedCategories.value.length === categories.value.length)
const { playAnimation } = useEmojiAnimation()

// Service data with icons
const services = [
  { name: '智能问答', description: '营养知识智能问答', icon: 'chat', color: 'from-blue-400 to-indigo-500', path: '/knowledge' },
  { name: '餐单规划', description: '制定每周健康餐单', icon: 'menu', color: 'from-amber-400 to-orange-500', path: '/menu' },
  { name: '食谱浏览', description: '查看健康食谱', icon: 'recipes', color: 'from-rose-400 to-pink-500', path: '/recipes' },
  { name: '健康管理', description: '体检数据/健康档案', icon: 'health', color: 'from-rose-400 to-red-500', path: '/health' },
]

// Icons
const icons = {
  logo: `<svg class="w-20 h-20" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="50%" style="stop-color:#059669"/>
        <stop offset="100%" style="stop-color:#047857"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#logoGrad)" opacity="0.15"/>
    <circle cx="32" cy="32" r="24" fill="none" stroke="url(#logoGrad)" stroke-width="2" opacity="0.5"/>
    <path d="M32 14c0 0-8 8-8 16 0 4 2 8 8 12 6-4 8-8 8-12 0-8-8-16-8-16z" fill="url(#logoGrad)"/>
    <path d="M32 26v20M24 36c0 0 4 6 8 8M40 36c0 0-4 6-8 8" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
}

let randomTimer: ReturnType<typeof setTimeout> | null = null

function togglePlay() {
  if (isPlaying.value) {
    stopRandom()
  }
  else {
    startRandom()
  }
  isPlaying.value = !isPlaying.value
}

function startRandom() {
  if (!import.meta.client) return

  currentFood.value = undefined
  shakeTitle.value = true

  const loop = () => {
    const service = services[Math.floor(Math.random() * services.length)]
    currentFood.value = {
      id: Date.now().toString(),
      name: service.name,
      image_path: null,
      description: service.description,
      source_path: '',
    }
    createFloatingText(service.icon)
    randomTimer = setTimeout(loop, 100)
  }

  loop()
}

function stopRandom() {
  shakeTitle.value = false
  if (randomTimer) {
    clearTimeout(randomTimer)
    randomTimer = null
  }
}

function createFloatingText(iconName = '') {
  const container = document.getElementById('temp_container')
  if (!container) return

  const temp = document.createElement('div')
  const colors = [
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
  ]
  const sizes = ['1rem', '1.5rem', '2rem', '2.5rem']
  const rotate = (Math.random() - 0.5) * 30

  // Create emoji based on icon name
  const emojiMap: Record<string, string> = {
    chat: '💬',
    menu: '📅',
    recipes: '🍳',
    health: '❤️',
  }
  temp.innerHTML = emojiMap[iconName] || '🍽️'

  temp.className = 'absolute font-medium animate-float-up select-none'
  temp.style.color = colors[Math.floor(Math.random() * colors.length)]!
  temp.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)]!
  temp.style.left = `${Math.random() * 70 + 15}%`
  temp.style.top = `${Math.random() * 60 + 20}%`
  temp.style.transform = `rotate(${rotate}deg)`

  container.appendChild(temp)
  setTimeout(() => temp.remove(), 1600)
}

onUnmounted(() => {
  if (randomTimer) clearTimeout(randomTimer)
})
</script>

<template>
  <ClientOnly>
    <FluidCursor />
  </ClientOnly>

  <div class="relative overflow-hidden min-h-screen">
    <!-- 背景 -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
      :class="{ 'animate-paused': isPlaying }"
    />
    <div id="temp_container" class="absolute inset-0 overflow-hidden pointer-events-none z-10" />

    <!-- 主内容 -->
    <div class="relative z-20 container mx-auto px-4 py-16">
      <!-- Logo -->
      <div class="flex justify-center mb-6" v-html="icons.logo"></div>

      <!-- 标题 -->
      <div class="text-center mb-8">
        <h1
          class="text-4xl md:text-5xl font-bold text-gray-800 mb-3"
          :class="{ 'animate-shake': shakeTitle }"
        >
          <span class="text-gray-700">智能</span>
          <span class="text-emerald-600">营养</span>
          <span class="text-gray-700">助手</span>
        </h1>
        <p class="text-gray-500">您的AI营养健康管理专家</p>
      </div>

      <!-- 当前推荐显示 -->
      <div v-if="currentFood" class="mb-8 px-4">
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-5 max-w-md mx-auto shadow-lg border border-emerald-100">
          <p class="text-lg font-semibold text-gray-800 text-center">{{ currentFood.name }}</p>
          <p class="text-sm text-gray-500 text-center mt-1">{{ currentFood.description }}</p>
        </div>
      </div>

      <!-- 快捷功能入口 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
        <NuxtLink
          v-for="service in services"
          :key="service.name"
          :to="service.path"
          class="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-1"
        >
          <div class="flex flex-col items-center text-center">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform group-hover:scale-110"
              :class="service.color"
            >
              <span class="text-2xl">
                {{ service.icon === 'chat' ? '💬' : service.icon === 'menu' ? '📅' : service.icon === 'recipes' ? '🍳' : '❤️' }}
              </span>
            </div>
            <h3 class="font-semibold text-gray-800 mb-1">{{ service.name }}</h3>
            <p class="text-xs text-gray-500">{{ service.description }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- 主要操作按钮 -->
      <div class="flex flex-wrap justify-center gap-4 mb-12">
        <NuxtLink to="/knowledge" class="group">
          <div class="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all group-hover:scale-105">
            开始智能问答
          </div>
        </NuxtLink>
        <NuxtLink to="/menu" class="group">
          <div class="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-500 rounded-full font-semibold hover:bg-emerald-50 transition-all group-hover:scale-105">
            制定健康餐单
          </div>
        </NuxtLink>
      </div>

      <!-- 底部说明 -->
      <div class="text-center text-gray-400 text-sm">
        <p>Powered by AI · 基于专业知识库提供健康建议</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  80% {
    opacity: 1;
    transform: translateY(-15px) scale(1.02);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(1.05);
  }
}

.animate-float-up {
  animation: floatUp 1.6s ease-out forwards;
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}

.animate-paused {
  animation-play-state: paused;
}
</style>
