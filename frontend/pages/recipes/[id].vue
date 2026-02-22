<script setup lang="ts">
useSeoMeta({
  title: '食谱详情 - NutriMind',
  description: '详细的食谱做法和营养信息',
})

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

interface RecipeDetail {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
  servings: number
  ingredients: Array<{ name: string; amount: number; unit: string; notes?: string }>
  steps: Array<{ step: number; description: string }>
  nutrition: {
    calories: number
    protein: number
    carbohydrates: number
    fat: number
  }
  tags: string[]
  taste: string
  suitableFor: string[]
  contraindications: string[]
}

const recipe = ref<RecipeDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch recipe detail
const fetchRecipe = async () => {
  const id = route.params.id as string
  loading.value = true
  error.value = null

  try {
    const response = await fetch(`${apiBase}/menu/recipes/${encodeURIComponent(id)}`)
    const data = await response.json()

    if (data.error) {
      error.value = '食谱不存在'
    } else {
      recipe.value = data
    }
  } catch (err) {
    console.error('Failed to fetch recipe:', err)
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
}

// Get difficulty label
const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return labels[difficulty] || difficulty
}

// Get difficulty color
const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    easy: 'from-emerald-400 to-teal-500',
    medium: 'from-amber-400 to-orange-500',
    hard: 'from-red-400 to-rose-500',
  }
  return colors[difficulty] || 'from-gray-400 to-gray-500'
}

// Get taste label
const getTasteLabel = (taste: string) => {
  const labels: Record<string, string> = {
    light: '清淡',
    savory: '鲜香',
    spicy: '辣味',
    sweet: '甜味',
    rich: '浓郁',
  }
  return labels[taste] || taste
}

// Go back
const goBack = () => {
  navigateTo('/recipes')
}

onMounted(() => {
  fetchRecipe()
})
</script>

<template>
  <div class="section animate-fade-in">
    <div class="container mx-auto px-4 py-6">
      <!-- Back button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回食谱库
      </button>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <div class="text-red-500 text-xl mb-4">{{ error }}</div>
        <button
          @click="goBack"
          class="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
        >
          返回食谱库
        </button>
      </div>

      <!-- Recipe Detail -->
      <div v-else-if="recipe" class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-6">
          <div class="h-64 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center relative">
            <div class="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10"></div>
            <div class="text-center z-10">
              <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md mb-4">
                <span
                  class="px-3 py-1 rounded-full text-sm font-medium text-white"
                  :class="{
                    'bg-emerald-500': recipe.difficulty === 'easy',
                    'bg-amber-500': recipe.difficulty === 'medium',
                    'bg-red-500': recipe.difficulty === 'hard',
                  }"
                >
                  {{ getDifficultyLabel(recipe.difficulty) }}
                </span>
                <span class="text-gray-500">|</span>
                <span class="text-gray-600">{{ recipe.cookingTime }}分钟</span>
                <span class="text-gray-500">|</span>
                <span class="text-gray-600">{{ recipe.servings }}人份</span>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">{{ recipe.name }}</h1>
              <p class="text-gray-600 mt-2">{{ recipe.description }}</p>
            </div>
          </div>

          <!-- Tags -->
          <div class="px-6 py-4 border-t border-gray-100">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags"
                :key="tag"
                class="px-4 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-sm rounded-full"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Nutrition Info -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            营养信息 (每份)
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl">
              <div class="text-3xl font-bold text-red-500">{{ recipe.nutrition.calories }}</div>
              <div class="text-sm text-gray-600">千卡</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div class="text-3xl font-bold text-blue-500">{{ recipe.nutrition.protein }}g</div>
              <div class="text-sm text-gray-600">蛋白质</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <div class="text-3xl font-bold text-amber-500">{{ recipe.nutrition.carbohydrates }}g</div>
              <div class="text-sm text-gray-600">碳水化合物</div>
            </div>
            <div class="text-center p-4 bg-gradient-to-br from-yellow-50 to-lime-50 rounded-xl">
              <div class="text-3xl font-bold text-yellow-500">{{ recipe.nutrition.fat }}g</div>
              <div class="text-sm text-gray-600">脂肪</div>
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            食材清单
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="(ingredient, index) in recipe.ingredients"
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <span class="text-gray-700">{{ ingredient.name }}</span>
              <span class="text-emerald-600 font-medium">
                {{ ingredient.amount }}{{ ingredient.unit }}
                <span v-if="ingredient.notes" class="text-gray-500 text-sm">({{ ingredient.notes }})</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Steps -->
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            烹饪步骤
          </h2>
          <div class="space-y-4">
            <div
              v-for="step in recipe.steps"
              :key="step.step"
              class="flex gap-4"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                :class="{
                  'bg-emerald-500': step.step <= 3,
                  'bg-emerald-400': step.step > 3,
                }"
              >
                {{ step.step }}
              </div>
              <div class="flex-1 pt-2">
                <p class="text-gray-700 leading-relaxed">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
