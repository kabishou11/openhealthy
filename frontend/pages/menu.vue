<script setup lang="ts">
useSeoMeta({
  title: '餐单计划 - NutriMind',
  description: '个性化一周饮食计划，科学配餐',
})

interface Meal {
  type: string
  name: string
  dishes: string[]
  calories: number
}

interface DayMenu {
  day: string
  meals: Meal[]
  totalCalories: number
}

interface StudentProfile {
  id: string
  name: string
  metrics: {
    bmi: number
    height: number
    weight: number
  }
  allergies: string[]
  conditions: string[]
}

const activeTab = ref('week')
const loading = ref(false)
const activeDay = ref('周一')
const route = useRoute()

// SVG Icons
const icons = {
  breakfast: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FCD34D"/><stop offset="100%" style="stop-color:#F59E0B"/></linearGradient></defs>
    <path d="M2 10a8 8 0 0116 0M12 4v4m0 0l-2 2m2-2l2 2" stroke="url(#grad1)"/>
    <circle cx="12" cy="18" r="3" stroke="url(#grad1)"/>
  </svg>`,
  lunch: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#34D399"/><stop offset="100%" style="stop-color:#059669"/></linearGradient></defs>
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" stroke="url(#grad2)"/>
  </svg>`,
  dinner: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#818CF8"/><stop offset="100%" style="stop-color:#4F46E5"/></linearGradient></defs>
    <circle cx="12" cy="12" r="5" stroke="url(#grad3)"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="url(#grad3)"/>
  </svg>`,
  calendar: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`,
  shopping: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>`,
  generate: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    <path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/>
  </svg>`,
}

// Get student ID from query
const studentId = computed(() => route.query.profileId as string || route.query.studentId as string || null)

// Load student profile from healthProfiles (same as health.vue)
const loadStudentProfile = (): StudentProfile | null => {
  if (!studentId.value) return null
  try {
    // Use healthProfiles (same as health.vue)
    const profiles = JSON.parse(localStorage.getItem('healthProfiles') || '[]')
    return profiles.find((p: StudentProfile) => p.id === studentId.value) || null
  }
  catch {
    return null
  }
}

const studentProfile = computed(() => loadStudentProfile())

// Calculate daily calorie target based on student profile
const dailyCalories = computed(() => {
  const base = 1800
  if (!studentProfile.value) return base

  const { bmi } = studentProfile.value.metrics

  if (bmi < 18.5) {
    return Math.round(base * 1.15)
  }
  if (bmi >= 25) {
    return Math.round(base * 0.85)
  }
  return base
})

// Demo menu data
const defaultMenu: DayMenu[] = [
  {
    day: '周一',
    meals: [
      { type: '早餐', name: '营养早餐', dishes: ['燕麦粥', '水煮蛋', '牛奶', '水果'], calories: 450 },
      { type: '午餐', name: '均衡午餐', dishes: ['糙米饭', '清蒸鲈鱼', '蒜蓉西兰花', '番茄蛋汤'], calories: 650 },
      { type: '晚餐', name: '轻盈晚餐', dishes: ['荞麦面', '凉拌木耳', '炒时蔬'], calories: 450 },
    ],
    totalCalories: 1550,
  },
  {
    day: '周二',
    meals: [
      { type: '早餐', name: '能量早餐', dishes: ['全麦面包', '豆浆', '香蕉', '坚果'], calories: 480 },
      { type: '午餐', name: '蛋白午餐', dishes: ['糙米饭', '宫保鸡丁', '炒菠菜', '冬瓜汤'], calories: 680 },
      { type: '晚餐', name: '低卡晚餐', dishes: ['蔬菜沙拉', '烤鸡胸', '糙米粥'], calories: 420 },
    ],
    totalCalories: 1580,
  },
  {
    day: '周三',
    meals: [
      { type: '早餐', name: '谷物早餐', dishes: ['杂粮粥', '蒸红薯', '鸡蛋', '凉拌黄瓜'], calories: 420 },
      { type: '午餐', name: '丰盛午餐', dishes: ['糙米饭', '红烧鸡腿', '芹菜炒肉', '紫菜汤'], calories: 700 },
      { type: '晚餐', name: '清淡晚餐', dishes: ['小米粥', '清炒时蔬', '蒸蛋'], calories: 380 },
    ],
    totalCalories: 1500,
  },
  {
    day: '周四',
    meals: [
      { type: '早餐', name: '牛奶早餐', dishes: ['牛奶', '燕麦', '苹果', '坚果'], calories: 450 },
      { type: '午餐', name: '鱼肉午餐', dishes: ['糙米饭', '清蒸鱼', '炒西蓝花', '豆腐汤'], calories: 620 },
      { type: '晚餐', name: '素食晚餐', dishes: ['蔬菜面', '凉拌菜', '豆浆'], calories: 400 },
    ],
    totalCalories: 1470,
  },
  {
    day: '周五',
    meals: [
      { type: '早餐', name: '蛋类早餐', dishes: ['鸡蛋羹', '全麦面包', '牛奶', '橙子'], calories: 460 },
      { type: '午餐', name: '均衡午餐', dishes: ['糙米饭', '番茄炒蛋', '炒肉片', '蔬菜汤'], calories: 680 },
      { type: '晚餐', name: '轻盈晚餐', dishes: ['杂粮粥', '凉拌黄瓜', '蒸南瓜'], calories: 360 },
    ],
    totalCalories: 1500,
  },
  {
    day: '周六',
    meals: [
      { type: '早餐', name: '周末早餐', dishes: ['豆浆', '油条', '茶叶蛋', '小笼包'], calories: 520 },
      { type: '午餐', name: '家庭午餐', dishes: ['白米饭', '红烧肉', '炒青菜', '西红柿蛋汤'], calories: 750 },
      { type: '晚餐', name: '简单晚餐', dishes: ['面条', '凉拌黄瓜', '水果'], calories: 380 },
    ],
    totalCalories: 1650,
  },
  {
    day: '周日',
    meals: [
      { type: '早餐', name: '休闲早餐', dishes: ['牛奶', '煎蛋', '吐司', '水果沙拉'], calories: 480 },
      { type: '午餐', name: '丰富午餐', dishes: ['白米饭', '糖醋排骨', '炒土豆丝', '菌菇汤'], calories: 720 },
      { type: '晚餐', name: '健康晚餐', dishes: ['杂粮粥', '清炒时蔬', '蒸鱼'], calories: 400 },
    ],
    totalCalories: 1600,
  },
]

// Menu variations for demo
const menuVariations = [
  {
    name: '标准餐单',
    factor: 1.0,
    description: '均衡营养，适合大多数人',
    gradient: 'from-blue-400 to-indigo-500',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3',
  },
  {
    name: '增重餐单',
    factor: 1.15,
    description: '高热量、高蛋白，适合偏瘦人群',
    gradient: 'from-orange-400 to-red-500',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    name: '减脂餐单',
    factor: 0.85,
    description: '低脂低热量，适合需要控制体重的人群',
    gradient: 'from-green-400 to-emerald-500',
    icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  },
]

const selectedVariation = ref(0)
const weeklyMenu = ref<DayMenu[]>(defaultMenu)
const regeneratingDay = ref<string | null>(null)
const regeneratingMeal = ref<string | null>(null)
const successMessage = ref('')
let successTimer: ReturnType<typeof setTimeout> | null = null

const showSuccess = (msg: string) => {
  successMessage.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => { successMessage.value = '' }, 3000)
}

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// Select day
const selectDay = (day: string) => {
  activeDay.value = day
  nextTick(() => {
    const element = document.getElementById(`day-${day}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// Get current day menu
const currentDayMenu = computed(() => {
  return weeklyMenu.value.find(d => d.day === activeDay.value) || weeklyMenu.value[0]
})

// Filter menu for selected day
const displayedMenu = computed(() => {
  return weeklyMenu.value.filter(d => d.day === activeDay.value)
})

// Nutrition summary
const nutritionSummary = computed(() => {
  const totals = weeklyMenu.value.reduce(
    (acc, day) => {
      acc.calories += day.totalCalories
      return acc
    },
    { calories: 0 }
  )
  const days = weeklyMenu.value.length
  return {
    dailyAvg: Math.round(totals.calories / days),
    target: dailyCalories.value,
  }
})

const getMealIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    '早餐': icons.breakfast,
    '午餐': icons.lunch,
    '晚餐': icons.dinner,
  }
  return iconMap[type] || icons.lunch
}

const getCaloriesColor = (calories: number) => {
  if (calories < 400) return 'text-green-500'
  if (calories < 500) return 'text-amber-500'
  return 'text-red-500'
}

// Apply variation to menu
const applyVariation = (variation: typeof menuVariations[0]) => {
  weeklyMenu.value = defaultMenu.map(day => {
    const adjustedMeals = day.meals.map(meal => ({
      ...meal,
      calories: Math.round(meal.calories * variation.factor),
    }))
    return {
      ...day,
      meals: adjustedMeals,
      totalCalories: adjustedMeals.reduce((sum, m) => sum + m.calories, 0),
    }
  })
}

// Generate menu
const generateMenu = async () => {
  loading.value = true

  try {
    // Prepare user profile data
    const profile = studentProfile.value
    const userInfo = profile ? {
      name: profile.name,
      age: profile.birthDate ? Math.floor((new Date().getFullYear() - new Date(profile.birthDate).getFullYear())) : undefined,
      gender: profile.gender,
      height: profile.metrics?.height,
      weight: profile.metrics?.weight,
      bmi: profile.metrics?.bmi,
      healthConditions: profile.conditions,
      allergies: profile.allergies,
    } : {}

    // Calculate calories from profile
    let calories = dailyCalories.value
    if (profile?.metrics?.height && profile?.metrics?.weight && profile?.birthDate) {
      const birthYear = new Date(profile.birthDate).getFullYear()
      const age = new Date().getFullYear() - birthYear
      let bmr = 10 * profile.metrics.weight + 6.25 * profile.metrics.height - 5 * age
      bmr += profile.gender === '男' ? 5 : -161
      calories = Math.round(bmr * 1.55) // Light activity
    }

    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001'

    try {
      const response = await fetch(`${apiBase}/api/v1/menu/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: userInfo,
          targets: { calories },
          options: { duration: 7 },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.plan && data.plan.weeklyPlan && data.plan.weeklyPlan.length > 0) {
          weeklyMenu.value = convertToMenuFormat(data.plan.weeklyPlan)
          showSuccess('餐单已重新生成 ✓')
          loading.value = false
          return
        }
      }
    }
    catch (e) {
      console.log('Backend menu generation failed:', e)
    }

    // Fallback: apply selected variation
    applyVariation(menuVariations[selectedVariation.value])
    showSuccess('餐单已更新 ✓')
  }
  finally {
    loading.value = false
  }
}

// Convert new plan format to menu format
const convertToMenuFormat = (weeklyPlan: any[]) => {
  return weeklyPlan.map(day => ({
    day: day.day,
    meals: day.meals?.map((meal: any) => ({
      type: meal.name,
      name: meal.name,
      dishes: meal.dishes?.map((d: any) => d.name) || [],
      calories: meal.totalNutrition?.calories || 500,
    })) || [],
    totalCalories: day.calories || 2000,
  }))
}

// Regenerate specific day
const regenerateDay = async (day: string) => {
  regeneratingDay.value = day
  try {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const response = await fetch(`${apiBase}/api/v1/menu/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targets: { calories: dailyCalories.value },
        options: { duration: 1 },
      }),
    })
    if (response.ok) {
      const data = await response.json()
      if (data.plan?.weeklyPlan?.length > 0) {
        const newDayData = convertToMenuFormat(data.plan.weeklyPlan)[0]
        newDayData.day = day
        weeklyMenu.value = weeklyMenu.value.map(d => d.day === day ? newDayData : d)
        showSuccess(`${day}餐单已重新生成 ✓`)
      }
    }
  }
  catch (e) {
    console.error('Regenerate day failed:', e)
  }
  finally {
    regeneratingDay.value = null
  }
}

// Regenerate specific meal
const regenerateMeal = async (day: string, mealType: string) => {
  regeneratingMeal.value = `${day}-${mealType}`
  try {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const response = await fetch(`${apiBase}/api/v1/menu/random-meal?type=${encodeURIComponent(mealType)}`)
    if (response.ok) {
      const newMeal = await response.json()
      weeklyMenu.value = weeklyMenu.value.map(d => {
        if (d.day !== day) return d
        const updatedMeals = d.meals.map(m => {
          if (m.type !== mealType) return m
          return {
            type: mealType,
            name: mealType,
            dishes: newMeal.dishes?.map((dish: any) => dish.name) || [],
            calories: newMeal.totalNutrition?.calories || 500,
          }
        })
        return {
          ...d,
          meals: updatedMeals,
          totalCalories: updatedMeals.reduce((sum: number, m: any) => sum + m.calories, 0),
        }
      })
      showSuccess(`${mealType}已重新生成 ✓`)
    }
  }
  catch (e) {
    console.error('Regenerate meal failed:', e)
  }
  finally {
    regeneratingMeal.value = null
  }
}

// Jump to today
const scrollToToday = () => {
  const today = new Date().getDay()
  const dayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const todayName = dayMap[today === 0 ? 0 : today]
  selectDay(todayName)
}

// Variation change handler
watch(selectedVariation, () => {
  if (!loading.value) {
    applyVariation(menuVariations[selectedVariation.value])
  }
})

// Initialize with variation
onMounted(() => {
  applyVariation(menuVariations[selectedVariation.value])
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Success Toast -->
    <Transition name="toast">
      <div
        v-if="successMessage"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2 font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ successMessage }}
      </div>
    </Transition>

    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">餐单计划</h1>
          <p class="text-gray-600">根据营养需求定制的周计划</p>
        </div>
        <div class="flex gap-2 mt-4 md:mt-0">
          <button
            @click="activeTab = 'week'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
            :class="activeTab === 'week'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            <span v-html="icons.calendar"></span>
            周计划
          </button>
          <button
            @click="activeTab = 'shopping'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
            :class="activeTab === 'shopping'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            <span v-html="icons.shopping"></span>
            购物清单
          </button>
        </div>
      </div>

      <!-- Student Info Banner -->
      <div v-if="studentProfile" class="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-lg shadow-emerald-500/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-emerald-900">{{ studentProfile.name }}</p>
              <p class="text-sm text-emerald-700">
                BMI: {{ studentProfile.metrics.bmi.toFixed(1) }} · 目标热量: {{ dailyCalories }} kcal/天
              </p>
            </div>
          </div>
          <NuxtLink to="/health/analysis" class="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            查看分析
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Menu Type Selector -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-3">选择餐单类型</label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="(variation, index) in menuVariations"
            :key="variation.name"
            @click="selectedVariation = index"
            class="relative flex-1 min-w-[140px] p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden"
            :class="selectedVariation === index
              ? 'border-transparent shadow-lg'
              : 'border-gray-200 hover:border-emerald-300 bg-white'"
          >
            <div
              v-if="selectedVariation === index"
              class="absolute inset-0 bg-gradient-to-r"
              :class="variation.gradient"
            ></div>
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-1">
                <svg v-if="selectedVariation === index" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="variation.icon" />
                </svg>
                <span
                  class="font-semibold"
                  :class="selectedVariation === index ? 'text-white' : 'text-gray-900'"
                >{{ variation.name }}</span>
              </div>
              <p class="text-xs" :class="selectedVariation === index ? 'text-white/80' : 'text-gray-500'">{{ variation.description }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Shopping List Tab -->
      <div v-if="activeTab === 'shopping'" class="card animate-fade-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span v-html="icons.shopping"></span>
            一周购物清单
          </h2>
          <button @click="scrollToToday" class="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            查看今日
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Vegetables -->
          <div class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
            <h3 class="font-semibold text-green-600 mb-3 flex items-center gap-2">
              <span class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">🥬</span>
              蔬菜类
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li v-for="item in ['西兰花 500g', '菠菜 300g', '黄瓜 400g', '番茄 500g', '芹菜 300g']" :key="item" class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                <span>{{ item.split(' ')[0] }}</span>
                <span class="text-gray-400 text-sm">{{ item.split(' ')[1] }}</span>
              </li>
            </ul>
          </div>

          <!-- Proteins -->
          <div class="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
            <h3 class="font-semibold text-red-600 mb-3 flex items-center gap-2">
              <span class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">🥩</span>
              蛋白质类
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li v-for="item in ['鸡胸肉 500g', '鲈鱼 600g', '鸡蛋 12个', '豆腐 400g']" :key="item" class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                <span>{{ item.split(' ')[0] }}</span>
                <span class="text-gray-400 text-sm">{{ item.split(' ')[1] }}</span>
              </li>
            </ul>
          </div>

          <!-- Grains -->
          <div class="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100">
            <h3 class="font-semibold text-amber-600 mb-3 flex items-center gap-2">
              <span class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">🌾</span>
              谷物类
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li v-for="item in ['糙米 1kg', '燕麦 500g', '荞麦面 500g']" :key="item" class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                <span>{{ item.split(' ')[0] }}</span>
                <span class="text-gray-400 text-sm">{{ item.split(' ')[1] }}</span>
              </li>
            </ul>
          </div>

          <!-- Dairy & Fruits -->
          <div class="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
            <h3 class="font-semibold text-blue-600 mb-3 flex items-center gap-2">
              <span class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">🥛</span>
              奶类及水果
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li v-for="item in ['牛奶 2L', '香蕉 1kg', '苹果 1kg', '橙子 500g']" :key="item" class="flex items-center gap-3">
                <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                <span>{{ item.split(' ')[0] }}</span>
                <span class="text-gray-400 text-sm">{{ item.split(' ')[1] }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-100 flex gap-4">
          <button class="btn btn-primary flex-1 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存清单
          </button>
          <button class="btn btn-outline flex-1 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出清单
          </button>
        </div>
      </div>

      <!-- Weekly Menu Tab -->
      <div v-else class="space-y-4">
        <!-- Week Navigation -->
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="day in dayNames"
            :key="day"
            @click="selectDay(day)"
            class="relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300"
            :class="activeDay === day
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-600 hover:bg-emerald-50 shadow'"
          >
            {{ day }}
            <span
              v-if="activeDay === day"
              class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"
            ></span>
          </button>
        </div>

        <!-- Jump to Today Button -->
        <div class="flex justify-end">
          <button
            @click="scrollToToday"
            class="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            跳转到今日
          </button>
        </div>

        <!-- Daily Menu Cards -->
        <div
          v-for="day in weeklyMenu"
          :key="day.day"
          :id="`day-${day.day}`"
          class="card"
          :class="{ 'ring-2 ring-emerald-500 shadow-lg': activeDay === day.day }"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ day.day }}</h3>
            <div class="flex items-center gap-3">
              <!-- Regenerate Day Button -->
              <button
                v-if="activeDay === day.day"
                @click="regenerateDay(day.day)"
                :disabled="regeneratingDay === day.day || loading"
                class="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <svg
                  class="w-4 h-4"
                  :class="{ 'animate-spin': regeneratingDay === day.day }"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ regeneratingDay === day.day ? '生成中...' : '重新生成' }}
              </button>
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                :class="getCaloriesColor(day.totalCalories)"
              >
                {{ day.totalCalories }} kcal/天
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="meal in day.meals"
              :key="meal.type"
              class="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 group"
            >
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center" v-html="getMealIcon(meal.type)"></div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ meal.name }}</div>
                <div class="text-sm text-gray-500">{{ meal.dishes.join(' + ') }}</div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Regenerate Meal Button -->
                <button
                  v-if="activeDay === day.day"
                  @click="regenerateMeal(day.day, meal.type)"
                  :disabled="regeneratingMeal === `${day.day}-${meal.type}`"
                  class="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all disabled:opacity-50"
                  :class="regeneratingMeal === `${day.day}-${meal.type}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                  :title="regeneratingMeal === `${day.day}-${meal.type}` ? '生成中...' : '重新生成此餐'"
                >
                  <svg
                    class="w-4 h-4"
                    :class="{ 'animate-spin': regeneratingMeal === `${day.day}-${meal.type}` }"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <span
                  class="px-3 py-1.5 rounded-full text-sm font-medium bg-white shadow-sm"
                  :class="getCaloriesColor(meal.calories)"
                >
                  {{ meal.calories }} kcal
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="card bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">周平均热量</h3>
              <p class="text-emerald-100 text-sm">{{ menuVariations[selectedVariation].name }} · 每日平均摄入</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold">{{ nutritionSummary.dailyAvg }}</div>
              <div class="text-emerald-100 text-sm">目标 {{ nutritionSummary.target }} kcal</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <button
            @click="generateMenu"
            class="btn btn-primary flex-1 justify-center flex items-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成{{ menuVariations[selectedVariation].name }}中...
            </span>
            <span v-else class="flex items-center gap-2">
              <span v-html="icons.generate"></span>
              重新生成{{ menuVariations[selectedVariation].name }}
            </span>
          </button>
          <NuxtLink to="/recipes" class="btn btn-outline flex-1 justify-center flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            浏览食谱
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
</style>
