<script setup lang="ts">
useSeoMeta({
  title: '食谱库 - NutriMind',
  description: '丰富的营养食谱库，满足各种健康饮食需求',
})

interface Recipe {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
  nutrition: {
    calories: number
    protein: number
    carbohydrates: number
    fat: number
  }
  tags: string[]
}

// Premium SVG Icons
const icons = {
  search: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <circle cx="11" cy="11" r="8" stroke="url(#searchGrad)"/>
    <path d="M21 21l-4.35-4.35" stroke="url(#searchGrad)" stroke-linecap="round"/>
  </svg>`,

  dish: `<svg class="w-20 h-20" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="dishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <ellipse cx="32" cy="32" rx="28" ry="12" fill="url(#dishGrad)" opacity="0.3"/>
    <ellipse cx="32" cy="30" rx="24" ry="10" fill="none" stroke="url(#dishGrad)" stroke-width="2"/>
    <path d="M20 30 Q32 40 44 30" fill="url(#dishGrad)"/>
    <ellipse cx="32" cy="26" rx="8" ry="4" fill="url(#dishGrad)"/>
  </svg>`,

  time: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="timeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#D97706"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#timeGrad)"/>
    <path d="M12 6v6l4 4" stroke="url(#timeGrad)" stroke-linecap="round"/>
  </svg>`,

  calories: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EF4444"/>
        <stop offset="100%" style="stop-color:#DC2626"/>
      </linearGradient>
    </defs>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="url(#calGrad)"/>
    <path d="M12 6v6l4 4" stroke="url(#calGrad)" stroke-linecap="round"/>
  </svg>`,

  easy: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="easyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <path d="M9 12l2 2 4-4" stroke="url(#easyGrad)" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  all: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="allGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6366F1"/>
        <stop offset="100%" style="stop-color:#8B5CF6"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="3" stroke="url(#allGrad)"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 7.34l1.41-1.41" stroke="url(#allGrad)" stroke-linecap="round"/>
  </svg>`,

  medium: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#D97706"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#medGrad)"/>
    <path d="M12 8v4M12 16v.01" stroke="url(#medGrad)" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  hard: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="hardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EF4444"/>
        <stop offset="100%" style="stop-color:#DC2626"/>
      </linearGradient>
    </defs>
    <polygon points="12,2 15,8.5 22,9.5 17,14 18.5,21 12,18 5.5,21 7,14 2,9.5 9,8.5" stroke="url(#hardGrad)" fill="none" stroke-linejoin="round"/>
  </svg>`,

  empty: `<svg class="w-24 h-24" viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#9CA3AF"/>
        <stop offset="100%" style="stop-color:#6B7280"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="45" r="30" stroke="url(#emptyGrad)" stroke-width="3" fill="none"/>
    <path d="M35 50 L45 60 L65 40" stroke="url(#emptyGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M25 80 Q50 70 75 80" stroke="url(#emptyGrad)" stroke-width="2" stroke-linecap="round" fill="none"/>
  </svg>`,

  star: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FCD34D"/>
        <stop offset="100%" style="stop-color:#F59E0B"/>
      </linearGradient>
    </defs>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#starGrad)"/>
  </svg>`,

  category: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <defs>
      <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8B5CF6"/>
        <stop offset="100%" style="stop-color:#7C3AED"/>
      </linearGradient>
    </defs>
    <path d="M4 4h16v16H4z" stroke="url(#catGrad)"/>
    <path d="M4 9h16M9 4v16" stroke="url(#catGrad)"/>
  </svg>`,
}

const recipes = ref<Recipe[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedDifficulty = ref('all')

// Category mapping: frontend display name -> backend category value
const categoryMap: Record<string, string> = {
  'all': 'all',
  '凉菜': '凉菜',
  '主菜': '荤菜',
  '蔬菜': '素菜',
  '早餐': '早餐',
  '汤类': '汤',
  '主食': '主食',
  '水产': '水产',
  '甜品': '甜品',
}

const categories = ['all', '凉菜', '主菜', '蔬菜', '早餐', '汤类', '主食', '水产', '甜品']
const difficulties = ['all', 'easy', 'medium', 'hard']

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const fetchRecipes = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.set('query', searchQuery.value)
    // Map frontend category to backend category
    if (selectedCategory.value !== 'all') {
      params.set('category', categoryMap[selectedCategory.value] || selectedCategory.value)
    }
    if (selectedDifficulty.value !== 'all') params.set('difficulty', selectedDifficulty.value)

    const response = await fetch(`${apiBase}/menu/recipes?${params}`)
    const data = await response.json()
    recipes.value = data.recipes || []
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    recipes.value = getMockRecipes()
  } finally {
    loading.value = false
  }
}

const getMockRecipes = (): Recipe[] => [
  {
    id: 'recipe-1',
    name: '凉拌木耳',
    description: '清爽的木耳凉拌菜，护肝佳品',
    category: '凉菜',
    difficulty: 'easy',
    cookingTime: 15,
    nutrition: { calories: 120, protein: 3, carbohydrates: 15, fat: 5 },
    tags: ['护肝', '低脂', '高纤维'],
  },
  {
    id: 'recipe-2',
    name: '清蒸鲈鱼',
    description: '鲜嫩可口的清蒸鱼，保留原汁原味',
    category: '主菜',
    difficulty: 'medium',
    cookingTime: 25,
    nutrition: { calories: 280, protein: 38, carbohydrates: 2, fat: 12 },
    tags: ['高蛋白', '低脂', 'DHA'],
  },
  {
    id: 'recipe-3',
    name: '蒜蓉西兰花',
    description: '营养丰富的家常蔬菜',
    category: '蔬菜',
    difficulty: 'easy',
    cookingTime: 10,
    nutrition: { calories: 180, protein: 10, carbohydrates: 15, fat: 10 },
    tags: ['高纤维', '维生素C', '抗癌'],
  },
  {
    id: 'recipe-4',
    name: '番茄炒蛋',
    description: '国民家常菜，酸甜可口',
    category: '主菜',
    difficulty: 'easy',
    cookingTime: 15,
    nutrition: { calories: 320, protein: 18, carbohydrates: 18, fat: 20 },
    tags: ['家常菜', '快手菜'],
  },
  {
    id: 'recipe-5',
    name: '燕麦粥',
    description: '营养早餐首选，健康养胃',
    category: '早餐',
    difficulty: 'easy',
    cookingTime: 10,
    nutrition: { calories: 380, protein: 15, carbohydrates: 55, fat: 12 },
    tags: ['早餐', '高纤维', '养胃'],
  },
  {
    id: 'recipe-6',
    name: '宫保鸡丁',
    description: '经典川菜，香辣下饭',
    category: '主菜',
    difficulty: 'medium',
    cookingTime: 25,
    nutrition: { calories: 450, protein: 35, carbohydrates: 25, fat: 25 },
    tags: ['川菜', '辣菜', '高蛋白'],
  },
]

const getDifficultyIcon = (difficulty: string) => {
  if (difficulty === 'all') return icons.all
  return icons[difficulty as keyof typeof icons] || icons.easy
}

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return labels[difficulty] || difficulty
}

const getDifficultyColor = (difficulty: string) => {
  if (difficulty === 'all') return 'from-violet-500 to-purple-500'
  const colors: Record<string, string> = {
    easy: 'from-emerald-400 to-teal-500',
    medium: 'from-amber-400 to-orange-500',
    hard: 'from-red-400 to-rose-500',
  }
  return colors[difficulty] || 'from-gray-400 to-gray-500'
}

watch([searchQuery, selectedCategory, selectedDifficulty], () => {
  fetchRecipes()
}, { immediate: true })
</script>

<template>
  <div class="section animate-fade-in">
    <div class="container mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl" v-html="icons.dish"></div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">食谱库</h1>
        <p class="text-gray-600">数百道营养美味家常菜谱</p>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none" v-html="icons.search"></div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索食谱..."
              class="input pl-12"
            />
          </div>

          <!-- Category filter -->
          <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              class="px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-300"
              :class="selectedCategory === cat ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ cat === 'all' ? '全部' : cat }}
            </button>
          </div>
        </div>

        <!-- Difficulty filter -->
        <div class="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <div class="p-1 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg" v-html="icons.category"></div>
            <span>难度筛选：</span>
          </div>
          <div class="flex gap-2">
            <button
              v-for="diff in difficulties"
              :key="diff"
              @click="selectedDifficulty = diff"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-300"
              :class="selectedDifficulty === diff
                ? `bg-gradient-to-r ${getDifficultyColor(diff)} text-white shadow-lg`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              <span v-html="getDifficultyIcon(diff)"></span>
              {{ diff === 'all' ? '全部' : getDifficultyLabel(diff) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="card animate-pulse">
          <div class="h-48 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-t-2xl"></div>
          <div class="p-4">
            <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Recipe Grid -->
      <div v-else-if="recipes.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="recipe in recipes"
          :key="recipe.id"
          :to="`/recipes/${recipe.id}`"
          class="recipe-card group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
        >
          <div class="h-48 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10"></div>
            <div class="p-6 transform group-hover:scale-110 transition-transform duration-300" v-html="icons.dish"></div>
            <div class="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
              <span v-html="getDifficultyIcon(recipe.difficulty)"></span>
              <span class="text-xs font-medium" :class="{
                'text-emerald-600': recipe.difficulty === 'easy',
                'text-amber-600': recipe.difficulty === 'medium',
                'text-red-600': recipe.difficulty === 'hard',
              }">{{ getDifficultyLabel(recipe.difficulty) }}</span>
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between mb-3">
              <h3 class="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                {{ recipe.name }}
              </h3>
            </div>
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ recipe.description }}</p>

            <!-- Nutrition info -->
            <div class="flex items-center gap-4 text-sm mb-4">
              <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                <span v-html="icons.time"></span>
                <span class="text-gray-700 font-medium">{{ recipe.cookingTime }}分钟</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg">
                <span v-html="icons.calories"></span>
                <span class="text-gray-700 font-medium">{{ recipe.nutrition.calories }}kcal</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags.slice(0, 3)"
                :key="tag"
                class="px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs rounded-full font-medium"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-16">
        <div class="flex justify-center mb-6" v-html="icons.empty"></div>
        <h3 class="text-xl font-bold text-gray-900 mt-4">没有找到相关食谱</h3>
        <p class="text-gray-600 mt-2">试试其他关键词或筛选条件</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input {
  @apply w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white;
}
</style>
