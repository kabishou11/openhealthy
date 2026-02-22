<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useDashboardAPI } from '~/composables/useDashboard'
import { useStudentsAPI } from '~/composables/useStudents'

useSeoMeta({
  title: '用户中心 - NutriMind',
  description: 'NutriMind 用户中心',
})

interface User {
  id: string
  phone: string
  name: string
  role: string
  avatar?: string
}

interface Student {
  id: string
  name: string
  school_id: string
  class_id?: string
  bmi?: number
  allergies: string[]
  class_name?: string
}

interface DailyMenu {
  id: string
  date: string
  week_day: number
  meals: {
    breakfast: Array<{ name: string; portion: string }>
    lunch: Array<{ name: string; portion: string }>
    dinner: Array<{ name: string; portion: string }>
  }
  total_nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

const router = useRouter()
const authStore = useAuthStore()
const { getLinkedStudents, getStudents } = useStudentsAPI()
const { getTodayMenu } = useDashboardAPI()

const user = ref<User | null>(null)
const students = ref<Student[]>([])
const todayMenu = ref<DailyMenu | null>(null)
const loading = ref(true)

// Get role display name
const getRoleName = (role: string): string => {
  const roles: Record<string, string> = {
    PARENT: '家长',
    STUDENT: '学生',
    SCHOOL_ADMIN: '学校管理员',
    CAFETERIA_MANAGER: '食堂管理员',
    CAFETERIA_COOK: '食堂厨师',
    DOCTOR: '医生',
    INSTITUTION: '营养机构',
    ADMIN: '系统管理员',
  }
  return roles[role] || role
}

// Get BMI category
const getBMICategory = (bmi: number | undefined): string => {
  if (!bmi) return '未设置'
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}

// Navigate to function
const navigateTo = (path: string) => {
  router.push(path)
}

// Load dashboard data
const loadDashboardData = async () => {
  try {
    // Get user from auth store
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user.value = JSON.parse(storedUser)
    }

    if (!user.value) {
      router.push('/login')
      return
    }

    // Load linked students
    const studentsData = await getLinkedStudents()
    students.value = studentsData.map((s: any) => ({
      id: s.id,
      name: s.name,
      school_id: s.school_id,
      class_id: s.class_id,
      bmi: s.bmi,
      allergies: s.allergies || [],
      class_name: s.class_name,
    }))

    // Load today's menu
    const menuData = await getTodayMenu()
    todayMenu.value = menuData
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Logout
const handleLogout = () => {
  authStore.logout()
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.push('/login')
    return
  }
  user.value = JSON.parse(storedUser)
  loadDashboardData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold">{{ user?.name }}</h1>
              <p class="text-emerald-100">{{ getRoleName(user?.role || '') }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          @click="navigateTo('/health')"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left border border-gray-100"
        >
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">健康档案</h3>
          <p class="text-sm text-gray-500 mt-1">管理健康数据</p>
        </button>

        <button
          @click="navigateTo('/menu')"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left border border-gray-100"
        >
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">餐单计划</h3>
          <p class="text-sm text-gray-500 mt-1">查看健康餐单</p>
        </button>

        <button
          @click="navigateTo('/recipes')"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left border border-gray-100"
        >
          <div class="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">食谱浏览</h3>
          <p class="text-sm text-gray-500 mt-1">查看健康食谱</p>
        </button>

        <button
          @click="navigateTo('/knowledge')"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left border border-gray-100"
        >
          <div class="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.657-1.79 3-4 3a3 3 0 00-2.883 2c-1.37 0-2.698.524-3.608 1.38l-.656.164a4.503 4.503 0 00-2.044 2.602c-1.423.69-2.29 1.7-2.29 3.122 0 1.406 1.11 2.554 2.63 2.88a5.4 5.4 0 01.81 1.25c.12.413.38.79.74 1.1a8.99 8.99 0 003.428 1.62c2.058.546 3.49.546 5.544 0a9.005 9.005 0 003.42-1.62c.36-.31.62-.687.74-1.1a3.5 3.5 0 00.81-1.25c1.52-.326 2.63-1.474 2.63-2.88 0-1.422-.867-2.432-2.29-3.122a4.503 4.503 0 00-2.044-2.602l-.656-.164a4.5 4.5 0 00-3.608-1.38 3 3 0 00-3.772 2c-1.742.657-3.332.477-4.5-1.253" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">智能问答</h3>
          <p class="text-sm text-gray-500 mt-1">营养知识问答</p>
        </button>
      </div>

      <!-- Children's Health (for parents) -->
      <div v-if="students.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">孩子的健康</h2>
        <div class="space-y-3">
          <div
            v-for="student in students"
            :key="student.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ student.name }}</p>
                <p class="text-sm text-gray-500">
                  BMI: {{ student.bmi?.toFixed(1) || '未设置' }} · {{ getBMICategory(student.bmi) }}
                </p>
              </div>
            </div>
            <button
              @click="navigateTo(`/health?studentId=${student.id}`)"
              class="text-emerald-600 hover:text-emerald-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- No students message -->
      <div v-else-if="!loading && user?.role === 'PARENT'" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无关联学生</h3>
          <p class="text-gray-500 mb-4">请联系学校管理员添加学生关联</p>
        </div>
      </div>

      <!-- Today's Menu Preview -->
      <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">今日推荐餐单</h2>
          <button @click="navigateTo('/menu')" class="text-white/80 hover:text-white text-sm">
            查看更多 →
          </button>
        </div>
        <div v-if="todayMenu" class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-sm text-emerald-100 mb-1">早餐</p>
            <div v-if="todayMenu.meals?.breakfast?.length">
              <p v-for="item in todayMenu.meals.breakfast" :key="item.name" class="font-semibold">
                {{ item.name }}
              </p>
            </div>
            <p v-else class="font-semibold">暂无</p>
          </div>
          <div class="text-center border-l border-white/20">
            <p class="text-sm text-emerald-100 mb-1">午餐</p>
            <div v-if="todayMenu.meals?.lunch?.length">
              <p v-for="item in todayMenu.meals.lunch" :key="item.name" class="font-semibold">
                {{ item.name }}
              </p>
            </div>
            <p v-else class="font-semibold">暂无</p>
          </div>
          <div class="text-center border-l border-white/20">
            <p class="text-sm text-emerald-100 mb-1">晚餐</p>
            <div v-if="todayMenu.meals?.dinner?.length">
              <p v-for="item in todayMenu.meals.dinner" :key="item.name" class="font-semibold">
                {{ item.name }}
              </p>
            </div>
            <p v-else class="font-semibold">暂无</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-sm text-emerald-100 mb-1">早餐</p>
            <p class="font-semibold">牛奶燕麦粥</p>
          </div>
          <div class="text-center border-l border-white/20">
            <p class="text-sm text-emerald-100 mb-1">午餐</p>
            <p class="font-semibold">番茄炒蛋 + 米饭</p>
          </div>
          <div class="text-center border-l border-white/20">
            <p class="text-sm text-emerald-100 mb-1">晚餐</p>
            <p class="font-semibold">宫保鸡丁 + 蔬菜</p>
          </div>
        </div>
      </div>

      <!-- Health Tips -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">健康小贴士</h2>
        <div class="space-y-3">
          <div class="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
            <span class="text-2xl">💧</span>
            <div>
              <p class="font-medium text-emerald-900">多喝水</p>
              <p class="text-sm text-emerald-700">每天至少8杯水，保持身体水分平衡</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
            <span class="text-2xl">🚶</span>
            <div>
              <p class="font-medium text-amber-900">适量运动</p>
              <p class="text-sm text-amber-700">每天30分钟中等强度运动</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
            <span class="text-2xl">😴</span>
            <div>
              <p class="font-medium text-violet-900">充足睡眠</p>
              <p class="text-sm text-violet-700">保证每天8小时睡眠</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
