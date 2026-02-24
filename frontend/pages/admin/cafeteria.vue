<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'
import { useMenusAPI } from '~/composables/useMenus'

useSeoMeta({
  title: '食堂管理 - NutriMind',
  description: 'NutriMind 食堂管理后台',
})

const router = useRouter()
const { authStore } = useAuthGuard(['CAFETERIA_MANAGER', 'CAFETERIA_COOK', 'ADMIN'])
const { getDishes, getTodayMenu, getWeekMenu } = useMenusAPI()

const activeTab = ref('dishes')
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])

// Data
const dishes = ref<any[]>([])
const todayMenu = ref<any>(null)
const weekMenu = ref<any[]>([])

// Categories
const categories = [
  { id: 'all', name: '全部' },
  { id: 'STAPLE', name: '主食' },
  { id: 'MEAT', name: '荤菜' },
  { id: 'VEGETABLE', name: '素菜' },
  { id: 'SOUP', name: '汤类' },
  { id: 'BREAKFAST', name: '早餐' },
]
const selectedCategory = ref('all')

// Load data
const loadData = async () => {
  loading.value = true
  try {
    dishes.value = await getDishes()
    todayMenu.value = await getTodayMenu()
    weekMenu.value = await getWeekMenu()
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// Filter dishes by category
const filteredDishes = computed(() => {
  if (selectedCategory.value === 'all') return dishes.value
  return dishes.value.filter(d => d.category === selectedCategory.value)
})

// Get dishes by category
const getDishesByCategory = (category: string) => {
  return dishes.value.filter(d => d.category === category).slice(0, 6)
}

// Meal times
const mealTimes = ['早餐', '午餐', '晚餐']

// Icons
const icons = {
  plus: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>`,
  edit: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>`,
  trash: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>`,
  publish: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`,
}

// Day names
const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">食堂管理后台</h1>
            <p class="text-amber-100 mt-1">NutriMind 餐单管理</p>
          </div>
          <div class="flex items-center gap-4">
            <button class="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2">
              <span v-html="icons.publish"></span>
              发布餐单
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          @click="activeTab = 'dishes'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
          :class="activeTab === 'dishes'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            : 'bg-white text-gray-600 hover:bg-amber-50 shadow-sm'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          菜品管理
        </button>
        <button
          @click="activeTab = 'menu'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
          :class="activeTab === 'menu'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            : 'bg-white text-gray-600 hover:bg-amber-50 shadow-sm'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          今日餐单
        </button>
        <button
          @click="activeTab = 'week'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
          :class="activeTab === 'week'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            : 'bg-white text-gray-600 hover:bg-amber-50 shadow-sm'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          周计划
        </button>
        <button
          @click="activeTab = 'special'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
          :class="activeTab === 'special'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            : 'bg-white text-gray-600 hover:bg-amber-50 shadow-sm'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          特殊饮食
        </button>
      </div>

      <!-- Dishes Tab -->
      <div v-if="activeTab === 'dishes'">
        <!-- Category Filter -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
            :class="selectedCategory === cat.id
              ? 'bg-amber-500 text-white'
              : 'bg-white text-gray-600 hover:bg-amber-50'"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Dishes Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="dish in filteredDishes"
            :key="dish.id"
            class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div class="w-full h-32 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl mb-4 flex items-center justify-center">
              <span class="text-4xl">🍽️</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1 truncate">{{ dish.name }}</h3>
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-500">{{ dish.category }}</span>
              <span class="text-amber-600 font-medium">¥{{ dish.price }}</span>
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <span>热量{{ dish.nutrition?.calories || 0 }}kcal</span>
              <span>·</span>
              <span>蛋白质{{ dish.nutrition?.protein || 0 }}g</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="flex-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm hover:bg-amber-200 transition-colors">
                编辑
              </button>
              <button class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors">
                <span v-html="icons.trash"></span>
              </button>
            </div>
          </div>

          <!-- Add Dish Card -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-gray-300 hover:border-amber-500 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
              <span v-html="icons.plus"></span>
            </div>
            <p class="text-gray-500 font-medium">添加菜品</p>
          </div>
        </div>
      </div>

      <!-- Today's Menu Tab -->
      <div v-if="activeTab === 'menu'" class="space-y-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900">今日餐单 - {{ selectedDate }}</h2>
            <div class="flex items-center gap-2">
              <button class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2">
                <span v-html="icons.edit"></span>
                编辑餐单
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-6">
            <div v-for="meal in mealTimes" :key="meal" class="space-y-3">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full"
                  :class="meal === '早餐' ? 'bg-amber-500' : meal === '午餐' ? 'bg-green-500' : 'bg-blue-500'">
                </div>
                <h3 class="font-bold text-gray-900">{{ meal }}</h3>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(item, index) in todayMenu?.meals?.[meal.toLowerCase()] || []"
                  :key="index"
                  class="p-3 bg-gray-50 rounded-lg"
                >
                  <p class="font-medium text-gray-900">{{ item.name }}</p>
                  <p class="text-sm text-gray-500">{{ item.portion }}</p>
                </div>
                <div v-if="!todayMenu?.meals?.[meal.toLowerCase()]?.length" class="p-3 text-center text-gray-400 text-sm">
                  暂无菜品
                </div>
              </div>
            </div>
          </div>

          <!-- Nutrition Summary -->
          <div class="mt-6 pt-6 border-t border-gray-100">
            <h3 class="font-bold text-gray-900 mb-4">营养总计</h3>
            <div class="grid grid-cols-4 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-amber-600">{{ todayMenu?.total_nutrition?.calories || 0 }}</p>
                <p class="text-sm text-gray-500">热量(kcal)</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-rose-600">{{ todayMenu?.total_nutrition?.protein || 0 }}</p>
                <p class="text-sm text-gray-500">蛋白质(g)</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">{{ todayMenu?.total_nutrition?.carbs || 0 }}</p>
                <p class="text-sm text-gray-500">碳水(g)</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-yellow-600">{{ todayMenu?.total_nutrition?.fat || 0 }}</p>
                <p class="text-sm text-gray-500">脂肪(g)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week Plan Tab -->
      <div v-if="activeTab === 'week'" class="space-y-4">
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="(day, index) in dayNames"
            :key="day"
            class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all bg-white text-gray-600 hover:bg-amber-50"
          >
            {{ day }}
          </button>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-6">周一餐单</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div v-for="meal in mealTimes" :key="meal" class="space-y-3">
              <h3 class="font-bold text-gray-900 mb-3">{{ meal }}</h3>
              <div class="space-y-2">
                <div class="p-3 bg-gray-50 rounded-lg">
                  <p class="font-medium text-gray-900">番茄炒蛋</p>
                  <p class="text-sm text-gray-500">1份 · 150kcal</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <p class="font-medium text-gray-900">红烧茄子</p>
                  <p class="text-sm text-gray-500">1份 · 120kcal</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <p class="font-medium text-gray-900">白米饭</p>
                  <p class="text-sm text-gray-500">1份 · 200kcal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Diets Tab -->
      <div v-if="activeTab === 'special'" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">特殊饮食需求</h2>
          <span class="text-sm text-gray-500">共12名学生</span>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">过敏</span>
              <h3 class="font-bold text-gray-900">虾过敏</h3>
            </div>
            <p class="text-sm text-gray-600 mb-2">禁止食用虾类及虾制品</p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">涉及: 3名学生</span>
              <button class="text-sm text-red-600 hover:text-red-700">查看详情</button>
            </div>
          </div>

          <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">疾病</span>
              <h3 class="font-bold text-gray-900">糖尿病</h3>
            </div>
            <p class="text-sm text-gray-600 mb-2">低糖饮食，少食多餐</p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">涉及: 2名学生</span>
              <button class="text-sm text-amber-600 hover:text-amber-700">查看详情</button>
            </div>
          </div>

          <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">宗教</span>
              <h3 class="font-bold text-gray-900">清真饮食</h3>
            </div>
            <p class="text-sm text-gray-600 mb-2">禁止猪肉及酒精</p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">涉及: 7名学生</span>
              <button class="text-sm text-blue-600 hover:text-blue-700">查看详情</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
