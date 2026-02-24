<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '食堂餐单计划 - NutriMind' })

const { authStore } = useAuthGuard(['CAFETERIA_MANAGER', 'CAFETERIA_COOK', 'SCHOOL_ADMIN', 'ADMIN'])
const router = useRouter()


// ─── 数据 ────────────────────────────────────────────────────
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const activeDay = ref('周一')
const activeWeek = ref('本周')
const generating = ref(false)
const showAddDish = ref(false)
const selectedMealSlot = ref<{ day: string; type: string } | null>(null)

interface CafeteriaDish {
  name: string
  calories: number
  price: number
  tags: string[]
  allergens?: string[]
}
interface CafeteriaMeal {
  type: string
  dishes: CafeteriaDish[]
  targetGroups: string[]
}
interface CafeteriaDay {
  day: string
  meals: CafeteriaMeal[]
  published: boolean
}

const cafeteriaMenu = ref<CafeteriaDay[]>(weekDays.map((day, i) => ({
  day,
  published: i < 3,
  meals: [
    {
      type: '早餐',
      targetGroups: ['全体'],
      dishes: [
        { name: '小米粥', calories: 120, price: 2, tags: ['主食'] },
        { name: '水煮蛋', calories: 80, price: 1.5, tags: ['蛋白质'] },
        { name: '馒头', calories: 200, price: 1, tags: ['主食'] },
        { name: '牛奶', calories: 150, price: 3, tags: ['补钙'] },
      ],
    },
    {
      type: '午餐',
      targetGroups: ['全体'],
      dishes: [
        { name: '米饭', calories: 280, price: 1, tags: ['主食'] },
        { name: '红烧肉', calories: 380, price: 8, tags: ['蛋白质', '高热量'] },
        { name: '清炒时蔬', calories: 80, price: 4, tags: ['蔬菜'] },
        { name: '番茄蛋汤', calories: 60, price: 3, tags: ['汤品'] },
        { name: '清蒸鱼（过敏注意）', calories: 180, price: 10, tags: ['蛋白质', 'DHA'], allergens: ['鱼'] },
      ],
    },
    {
      type: '晚餐',
      targetGroups: ['住校生'],
      dishes: [
        { name: '杂粮饭', calories: 260, price: 1, tags: ['主食', '低GI'] },
        { name: '宫保鸡丁', calories: 320, price: 7, tags: ['蛋白质'] },
        { name: '蒜蓉西兰花', calories: 70, price: 4, tags: ['蔬菜', '补铁'] },
        { name: '紫菜汤', calories: 30, price: 2, tags: ['汤品'] },
      ],
    },
  ],
})))

const todayMenu = computed(() => cafeteriaMenu.value.find(d => d.day === activeDay.value)!)

// Stats
const stats = computed(() => ({
  published: cafeteriaMenu.value.filter(d => d.published).length,
  total: 7,
  avgCalories: 1650,
  dishCount: cafeteriaMenu.value.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + m.dishes.length, 0), 0),
}))

const togglePublish = (day: CafeteriaDay) => {
  day.published = !day.published
}

const generateAI = async () => {
  generating.value = true
  await new Promise(r => setTimeout(r, 1800))
  generating.value = false
}

// Nutrition summary for a meal
const mealCalories = (meal: CafeteriaMeal) =>
  meal.dishes.reduce((s, d) => s + d.calories, 0)

const dayCalories = (day: CafeteriaDay) =>
  day.meals.reduce((s, m) => s + mealCalories(m), 0)
</script>

<template>
  <div class="min-h-screen bg-gray-50 pt-16">
    <!-- Header -->
    <div class="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
      <div class="container mx-auto px-4 py-5 max-w-6xl">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <NuxtLink to="/menu" class="text-orange-200 hover:text-white text-sm transition-colors">个人餐单</NuxtLink>
              <span class="text-orange-300">/</span>
              <span class="text-sm font-medium">食堂餐单计划</span>
            </div>
            <h1 class="text-xl font-bold">食堂餐单管理</h1>
            <p class="text-orange-100 text-sm mt-0.5">制定、发布、管理每周食堂菜单</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="generateAI" :disabled="generating"
              class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" :class="{ 'animate-spin': generating }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ generating ? 'AI 生成中...' : 'AI 智能排菜' }}
            </button>
            <button class="px-4 py-2 bg-white text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
              发布本周菜单
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-5 max-w-6xl">
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="text-2xl font-bold text-orange-500">{{ stats.published }}/{{ stats.total }}</div>
          <div class="text-xs text-gray-500 mt-0.5">已发布天数</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="text-2xl font-bold text-emerald-500">{{ stats.avgCalories }}</div>
          <div class="text-xs text-gray-500 mt-0.5">平均热量 kcal</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="text-2xl font-bold text-blue-500">{{ stats.dishCount }}</div>
          <div class="text-xs text-gray-500 mt-0.5">本周菜品总数</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="text-2xl font-bold text-purple-500">3</div>
          <div class="text-xs text-gray-500 mt-0.5">特殊饮食人数</div>
        </div>
      </div>

      <div class="grid lg:grid-cols-4 gap-5">
        <!-- Day list -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800">本周菜单</span>
              <select v-model="activeWeek" class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                <option>本周</option>
                <option>下周</option>
              </select>
            </div>
            <div class="divide-y divide-gray-50">
              <button v-for="day in cafeteriaMenu" :key="day.day" @click="activeDay = day.day"
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                :class="activeDay === day.day ? 'bg-orange-50' : ''">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    :class="activeDay === day.day ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'">
                    {{ day.day.slice(1) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium" :class="activeDay === day.day ? 'text-orange-700' : 'text-gray-800'">{{ day.day }}</p>
                    <p class="text-xs text-gray-400">{{ dayCalories(day) }} kcal</p>
                  </div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="day.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ day.published ? '已发布' : '草稿' }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Day detail -->
        <div class="lg:col-span-3 space-y-4">
          <!-- Day header -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900">{{ activeDay }} 菜单</h2>
              <p class="text-xs text-gray-400 mt-0.5">总热量约 {{ dayCalories(todayMenu) }} kcal</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="togglePublish(todayMenu)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                :class="todayMenu.published
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-green-500 text-white hover:bg-green-600'">
                {{ todayMenu.published ? '取消发布' : '发布菜单' }}
              </button>
            </div>
          </div>

          <!-- Meals -->
          <div v-for="meal in todayMenu.meals" :key="meal.type"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-base">{{ meal.type === '早餐' ? '🌅' : meal.type === '午餐' ? '☀️' : '🌙' }}</span>
                <span class="font-semibold text-gray-800 text-sm">{{ meal.type }}</span>
                <span class="text-xs text-gray-400">· {{ mealCalories(meal) }} kcal</span>
              </div>
              <div class="flex items-center gap-2">
                <span v-for="g in meal.targetGroups" :key="g"
                  class="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{{ g }}</span>
                <button class="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  添加菜品
                </button>
              </div>
            </div>
            <div class="p-4">
              <div class="grid sm:grid-cols-2 gap-2">
                <div v-for="dish in meal.dishes" :key="dish.name"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-sm font-medium text-gray-800">{{ dish.name }}</span>
                      <span v-if="dish.allergens?.length" class="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                        ⚠️ 过敏原
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span v-for="tag in dish.tags.slice(0,2)" :key="tag"
                        class="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">{{ tag }}</span>
                      <span class="text-xs text-gray-400">{{ dish.calories }} kcal</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-2">
                    <span class="text-sm font-medium text-gray-600">¥{{ dish.price }}</span>
                    <button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all">
                      <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Nutrition summary -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 class="text-sm font-semibold text-gray-800 mb-3">营养分析</h3>
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center p-3 bg-blue-50 rounded-xl">
                <div class="text-lg font-bold text-blue-600">{{ Math.round(dayCalories(todayMenu) * 0.15 / 4) }}g</div>
                <div class="text-xs text-gray-500 mt-0.5">蛋白质</div>
              </div>
              <div class="text-center p-3 bg-amber-50 rounded-xl">
                <div class="text-lg font-bold text-amber-600">{{ Math.round(dayCalories(todayMenu) * 0.55 / 4) }}g</div>
                <div class="text-xs text-gray-500 mt-0.5">碳水化合物</div>
              </div>
              <div class="text-center p-3 bg-rose-50 rounded-xl">
                <div class="text-lg font-bold text-rose-600">{{ Math.round(dayCalories(todayMenu) * 0.30 / 9) }}g</div>
                <div class="text-xs text-gray-500 mt-0.5">脂肪</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
