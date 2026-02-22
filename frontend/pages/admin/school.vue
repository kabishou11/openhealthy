<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useSchoolsAPI } from '~/composables/useSchools'
import { useStudentsAPI } from '~/composables/useStudents'

useSeoMeta({
  title: '学校管理 - NutriMind',
  description: 'NutriMind 学校管理后台',
})

const router = useRouter()
const authStore = useAuthStore()
const { getSchools, getClasses } = useSchoolsAPI()
const { getBMIStats, getStudents } = useStudentsAPI()

const activeTab = ref('overview')
const loading = ref(false)

// Check admin access
onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    if (!['SCHOOL_ADMIN', 'ADMIN'].includes(userData.role)) {
      router.push('/dashboard')
    }
  } else {
    router.push('/login')
  }
})

// School data
const schools = ref<any[]>([])
const selectedSchool = ref<any>(null)
const classes = ref<any[]>([])
const students = ref<any[]>([])
const stats = ref<any>(null)

// Load data
const loadData = async () => {
  loading.value = true
  try {
    schools.value = await getSchools()
    if (schools.value.length > 0) {
      selectedSchool.value = schools.value[0]
      classes.value = await getClasses(selectedSchool.value.id)
      students.value = await getStudents({ schoolId: selectedSchool.value.id })
      stats.value = await getBMIStats(selectedSchool.value.id)
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// BMI category colors
const getBMIColor = (category: string): string => {
  const colors: Record<string, string> = {
    '偏瘦': 'bg-blue-100 text-blue-700',
    '正常': 'bg-green-100 text-green-700',
    '偏胖': 'bg-amber-100 text-amber-700',
    '肥胖': 'bg-red-100 text-red-700',
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

// Get BMI distribution
const getBMIDistribution = () => {
  if (!stats.value) return []
  return [
    { label: '偏瘦', value: stats.value.underweight || 0, percent: stats.value.underweightPercent || 0, color: 'bg-blue-500' },
    { label: '正常', value: stats.value.normal || 0, percent: stats.value.normalPercent || 0, color: 'bg-green-500' },
    { label: '偏胖', value: stats.value.overweight || 0, percent: stats.value.overweightPercent || 0, color: 'bg-amber-500' },
    { label: '肥胖', value: stats.value.obese || 0, percent: stats.value.obesePercent || 0, color: 'bg-red-500' },
  ]
}

// Format nutrition standard
const formatNutrition = (standard: any) => {
  if (!standard) return '未设置'
  return `${standard.calories || 0}kcal / 蛋白质${standard.protein || 0}g / 脂肪${standard.fat || 0}g / 钠${standard.sodium || 0}mg`
}

// Tabs
const tabs = [
  { id: 'overview', name: '数据概览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' },
  { id: 'students', name: '学生管理', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { id: 'classes', name: '班级管理', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 8h1m-5 10h1m1-4h1' },
  { id: 'cafeteria', name: '食堂管理', icon: 'M3 3h18M3 7h18M3 11h12M3 15h12M3 19h18' },
]

function getBMICategory(bmi: number | undefined): string {
  if (!bmi) return '未知'
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">学校管理后台</h1>
            <p class="text-indigo-100 mt-1">NutriMind 营养管理平台</p>
          </div>
          <div class="flex items-center gap-4">
            <select
              v-model="selectedSchool"
              class="px-4 py-2 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none"
            >
              <option v-for="school in schools" :key="school.id" :value="school">
                {{ school.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
          :class="activeTab === tab.id
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
            : 'bg-white text-gray-600 hover:bg-indigo-50 shadow-sm'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
          </svg>
          {{ tab.name }}
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">学生总数</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats?.total || students.length }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">班级数</p>
                <p class="text-3xl font-bold text-gray-900">{{ classes.length }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 8h1m-5 10h1m1-4h1" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">BMI正常率</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats?.normalPercent || 0 }}%</p>
              </div>
              <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">特殊饮食</p>
                <p class="text-3xl font-bold text-gray-900">12</p>
              </div>
              <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- BMI Distribution -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-4">BMI分布</h2>
          <div class="space-y-4">
            <div v-for="item in getBMIDistribution()" :key="item.label" class="flex items-center gap-4">
              <div class="w-16 text-sm text-gray-600">{{ item.label }}</div>
              <div class="flex-1">
                <div class="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="item.color"
                    :style="{ width: `${item.percent}%` }"
                  ></div>
                </div>
              </div>
              <div class="w-24 text-right">
                <span class="font-medium text-gray-900">{{ item.value }}人</span>
                <span class="text-gray-400 text-sm ml-1">({{ item.percent }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Standard -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">营养标准</h2>
            <button class="text-sm text-indigo-600 hover:text-indigo-700">编辑</button>
          </div>
          <div class="grid md:grid-cols-4 gap-4">
            <div class="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <p class="text-sm text-amber-600 mb-1">热量</p>
              <p class="text-2xl font-bold text-amber-900">{{ selectedSchool?.nutrition_standard?.calories || 650 }}<span class="text-sm font-normal">kcal</span></p>
            </div>
            <div class="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100">
              <p class="text-sm text-rose-600 mb-1">蛋白质</p>
              <p class="text-2xl font-bold text-rose-900">{{ selectedSchool?.nutrition_standard?.protein || 25 }}<span class="text-sm font-normal">g</span></p>
            </div>
            <div class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p class="text-sm text-blue-600 mb-1">脂肪</p>
              <p class="text-2xl font-bold text-blue-900">{{ selectedSchool?.nutrition_standard?.fat || 20 }}<span class="text-sm font-normal">g</span></p>
            </div>
            <div class="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <p class="text-sm text-purple-600 mb-1">钠</p>
              <p class="text-2xl font-bold text-purple-900">{{ selectedSchool?.nutrition_standard?.sodium || 900 }}<span class="text-sm font-normal">mg</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Tab -->
      <div v-if="activeTab === 'students'" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">学生列表</h2>
          <div class="flex items-center gap-4">
            <input
              type="text"
              placeholder="搜索学生..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              添加学生
            </button>
          </div>
        </div>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">班级</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">身高</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">体重</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                    {{ student.name?.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ student.name }}</p>
                    <p class="text-sm text-gray-500">{{ student.student_id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ student.class_name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ student.height || '-' }}cm</td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ student.weight || '-' }}kg</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium">{{ student.bmi?.toFixed(1) || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getBMICategory(student.bmi) === '正常' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ getBMICategory(student.bmi) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-indigo-600 hover:text-indigo-700">查看</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="students.length === 0" class="p-12 text-center text-gray-500">
          暂无学生数据
        </div>
      </div>

      <!-- Classes Tab -->
      <div v-if="activeTab === 'classes'" class="space-y-4">
        <div class="flex justify-end">
          <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加班级
          </button>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
          <div
            v-for="cls in classes"
            :key="cls.id"
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 8h1m-5 10h1m1-4h1" />
                </svg>
              </div>
              <button class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">{{ cls.name }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ cls.grade || '未设置年级' }}</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">学生数</span>
              <span class="font-medium text-gray-900">32人</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cafeteria Tab -->
      <div v-if="activeTab === 'cafeteria'" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-gray-900">食堂管理</h2>
          <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
            添加食堂
          </button>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18M3 7h18M3 11h12M3 15h12M3 19h18" />
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900">第一食堂</h3>
                <p class="text-sm text-gray-500">容量: 1000人</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full">营业中</span>
              <span class="text-gray-500">早餐 6:30-9:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
