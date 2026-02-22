<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useHealthAPI } from '~/composables/useHealth'
import { useStudentsAPI } from '~/composables/useStudents'

useSeoMeta({
  title: '健康分析 - NutriMind',
  description: '学生健康数据分析和报告',
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getHealthSummary, getHealthRecords, getHealthTrend, calculateBMI, getBMICategory, calculateNutritionNeeds } = useHealthAPI()
const { getStudent } = useStudentsAPI()

const activeTab = ref('overview')
const selectedStudentId = ref(route.query.studentId as string || '')
const loading = ref(false)

// Student data
const student = ref<any>(null)
const summary = ref<any>(null)
const healthRecords = ref<any[]>([])
const healthTrend = ref<any[]>([])

// Load student data
const loadStudentData = async () => {
  if (!selectedStudentId.value) return

  loading.value = true
  try {
    // Get student info
    student.value = await getStudent(selectedStudentId.value)

    // Get health summary
    summary.value = await getHealthSummary(selectedStudentId.value)

    // Get health records
    healthRecords.value = await getHealthRecords(selectedStudentId.value)

    // Get health trend
    healthTrend.value = await getHealthTrend(selectedStudentId.value)
  } catch (error) {
    console.error('Failed to load student data:', error)
  } finally {
    loading.value = false
  }
}

// Auto-load when student ID changes
watch(selectedStudentId, () => {
  if (selectedStudentId.value) {
    loadStudentData()
  }
})

// Health metrics
const healthMetrics = computed(() => {
  if (!summary.value?.latestRecord) return []

  const record = summary.value.latestRecord
  return [
    {
      name: '身高',
      value: record.height ? `${record.height} cm` : '未设置',
      icon: 'M3 21v-4m0 0V7a2 2 0 012-2h6.5l1.75-5.25M21 21v-4m0 0V7a2 2 0 00-2-2h-6.5L3.75 12.25M12 6.75V21m0-18v4.5',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: '体重',
      value: record.weight ? `${record.weight} kg` : '未设置',
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      name: 'BMI',
      value: record.bmi?.toFixed(1) || '未设置',
      subtitle: getBMICategory(record.bmi),
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      name: '视力',
      value: record.vision_left && record.vision_right
        ? `左${record.vision_left} / 右${record.vision_right}`
        : '未设置',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ]
})

// BMI gauge percentage
const bmiPercent = computed(() => {
  if (!summary.value?.latestRecord?.bmi) return 0
  const bmi = summary.value.latestRecord.bmi
  // Normalize BMI 15-35 to 0-100%
  return Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100))
})

// Nutrition targets
const nutritionTargets = computed(() => {
  if (!summary.value?.nutritionTargets) return null

  // Calculate actual intake (mock)
  const actual = {
    calories: 1850,
    protein: 65,
    carbs: 250,
    fat: 55,
  }

  const targets = summary.value.nutritionTargets

  return [
    { name: '热量', actual: actual.calories, target: targets.calories, unit: 'kcal', color: 'bg-amber-500' },
    { name: '蛋白质', actual: actual.protein, target: targets.protein, unit: 'g', color: 'bg-rose-500' },
    { name: '碳水', actual: actual.carbs, target: targets.carbs, unit: 'g', color: 'bg-blue-500' },
    { name: '脂肪', actual: actual.fat, target: targets.fat, unit: 'g', color: 'bg-yellow-500' },
  ]
})

// Get nutrient percent
const getNutrientPercent = (actual: number, target: number) => {
  return Math.min(100, (actual / target) * 100)
}

// Health advice based on BMI
const healthAdvice = computed(() => {
  const bmi = summary.value?.latestRecord?.bmi
  if (!bmi) return []

  const advice: Record<string, string[]> = {
    '偏瘦': [
      '建议增加每日热量摄入，多吃富含蛋白质的食物',
      '可适当增加餐次，少食多餐',
      '建议进行适量的力量训练以增肌',
    ],
    '正常': [
      '继续保持均衡饮食',
      '每天保持30分钟以上的中等强度运动',
      '注意作息规律，保证充足睡眠',
    ],
    '偏胖': [
      '建议控制每日热量摄入，减少高脂肪食物',
      '增加蔬菜水果摄入',
      '建议每天进行30分钟以上的有氧运动',
    ],
    '肥胖': [
      '建议咨询专业营养师制定个性化饮食方案',
      '严格控制高热量食物摄入',
      '在医生指导下进行运动减重',
      '定期监测体重和身体指标',
    ],
  }

  return advice[getBMICategory(bmi)] || []
})

// Vision status
const visionStatus = computed(() => {
  const left = summary.value?.latestRecord?.vision_left
  const right = summary.value?.latestRecord?.vision_right

  if (!left || !right) return { status: 'unknown', message: '暂无数据' }

  const avg = (left + right) / 2
  if (avg >= 1.0) return { status: 'good', message: '视力正常', color: 'text-green-600' }
  if (avg >= 0.6) return { status: 'warning', message: '轻度近视', color: 'text-amber-600' }
  return { status: 'poor', message: '需关注', color: 'text-red-600' }
})

// Tabs
const tabs = [
  { id: 'overview', name: '健康概览', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'trend', name: '趋势分析', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { id: 'nutrition', name: '营养分析', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'advice', name: '健康建议', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">健康分析</h1>
            <p class="text-rose-100 mt-1">学生健康数据与营养评估</p>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/health/scan"
              class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white border border-white/30 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              扫描体检
            </NuxtLink>
            <select
              v-model="selectedStudentId"
              class="px-4 py-2 bg-white/20 rounded-lg text-white border border-white/30 focus:outline-none"
            >
              <option value="">选择学生</option>
              <option value="demo-student">张小明</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- No Student Selected -->
      <div v-if="!selectedStudentId" class="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">请选择学生</h3>
        <p class="text-gray-500 mb-6">从下拉菜单中选择要查看健康数据的学生</p>
        <div class="flex justify-center gap-4">
          <NuxtLink
            to="/health/scan"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            扫描体检报告
          </NuxtLink>
        </div>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="flex gap-2 mb-6 overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all"
            :class="activeTab === tab.id
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-white text-gray-600 hover:bg-rose-50 shadow-sm'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
            </svg>
            {{ tab.name }}
          </button>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Student Info -->
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {{ student?.name?.charAt(0) || 'S' }}
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ student?.name || '学生' }}</h2>
                <p class="text-gray-500">{{ student?.class_name || '未分配班级' }} · {{ student?.gender === 'MALE' ? '男' : '女' }}</p>
              </div>
            </div>

            <!-- Health Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="metric in healthMetrics"
                :key="metric.name"
                class="p-4 rounded-xl"
                :class="metric.bgColor"
              >
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" :class="metric.textColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="metric.icon" />
                  </svg>
                  <span class="text-sm" :class="metric.textColor">{{ metric.name }}</span>
                </div>
                <p class="text-2xl font-bold text-gray-900">{{ metric.value }}</p>
                <p v-if="metric.subtitle" class="text-sm text-gray-500">{{ metric.subtitle }}</p>
              </div>
            </div>
          </div>

          <!-- BMI Gauge -->
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-4">BMI 评估</h3>
            <div class="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div class="absolute left-0 h-full bg-blue-500" style="width: 25%"></div>
              <div class="absolute left-[25%] h-full bg-green-500" style="width: 30%"></div>
              <div class="absolute left-[55%] h-full bg-amber-500" style="width: 15%"></div>
              <div class="absolute left-[70%] h-full bg-red-500" style="width: 30%"></div>
              <div
                class="absolute top-0 h-full w-1 bg-gray-900 transition-all"
                :style="{ left: `${bmiPercent}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-sm text-gray-500 mb-4">
              <span>偏瘦 (15)</span>
              <span>正常 (18.5-24)</span>
              <span>偏胖 (24-28)</span>
              <span>肥胖 (28+)</span>
            </div>
            <div class="flex items-center justify-center gap-4">
              <span class="text-3xl font-bold text-gray-900">{{ summary?.latestRecord?.bmi?.toFixed(1) || '-' }}</span>
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                :class="{
                  'bg-blue-100 text-blue-700': getBMICategory(summary?.latestRecord?.bmi) === '偏瘦',
                  'bg-green-100 text-green-700': getBMICategory(summary?.latestRecord?.bmi) === '正常',
                  'bg-amber-100 text-amber-700': getBMICategory(summary?.latestRecord?.bmi) === '偏胖',
                  'bg-red-100 text-red-700': getBMICategory(summary?.latestRecord?.bmi) === '肥胖',
                }"
              >
                {{ getBMICategory(summary?.latestRecord?.bmi) }}
              </span>
            </div>
          </div>

          <!-- Special Diets -->
          <div v-if="summary?.specialDiets?.length" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-4">特殊饮食</h3>
            <div class="space-y-3">
              <div
                v-for="diet in summary.specialDiets"
                :key="diet.id"
                class="p-3 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs font-medium">{{ diet.type }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ diet.detail }}</span>
                </div>
                <p class="text-sm text-gray-500">{{ diet.severity }} · 起始: {{ diet.start_date }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Trend Tab -->
        <div v-if="activeTab === 'trend'" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-6">健康指标趋势</h3>
          <div class="space-y-6">
            <div>
              <p class="text-sm text-gray-500 mb-2">BMI 变化</p>
              <div class="h-32 bg-gray-50 rounded-xl flex items-end justify-center gap-4 p-4">
                <div v-for="(record, index) in healthTrend.slice(-6)" :key="index"
                  class="flex flex-col items-center gap-1">
                  <div
                    class="w-8 bg-gradient-to-t from-rose-500 to-pink-400 rounded-t"
                    :style="{ height: `${Math.min(100, (record.bmi || 20) * 3)}px` }"
                  ></div>
                  <span class="text-xs text-gray-500">{{ record.checkup_date?.slice(5) || '-' }}</span>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-2">体重变化 (kg)</p>
              <div class="h-32 bg-gray-50 rounded-xl flex items-end justify-center gap-4 p-4">
                <div v-for="(record, index) in healthTrend.slice(-6)" :key="index"
                  class="flex flex-col items-center gap-1">
                  <div
                    class="w-8 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t"
                    :style="{ height: `${Math.min(100, (record.weight || 50) * 1.5)}px` }"
                  ></div>
                  <span class="text-xs text-gray-500">{{ record.checkup_date?.slice(5) || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Tab -->
        <div v-if="activeTab === 'nutrition'" class="space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-6">营养摄入</h3>
            <div class="space-y-4">
              <div v-for="nutrient in nutritionTargets" :key="nutrient.name">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ nutrient.name }}</span>
                  <span class="text-sm text-gray-500">{{ nutrient.actual }} / {{ nutrient.target }} {{ nutrient.unit }}</span>
                </div>
                <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="nutrient.color"
                    :style="{ width: `${getNutrientPercent(nutrient.actual, nutrient.target)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Advice Tab -->
        <div v-if="activeTab === 'advice'" class="space-y-6">
          <div class="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 text-white">
            <h3 class="text-lg font-bold mb-4">AI 健康建议</h3>
            <div v-if="healthAdvice.length" class="space-y-3">
              <div
                v-for="(advice, index) in healthAdvice"
                :key="index"
                class="flex items-start gap-3"
              >
                <span class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {{ index + 1 }}
                </span>
                <p class="text-white/90">{{ advice }}</p>
              </div>
            </div>
            <p v-else class="text-white/80">暂无建议</p>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 class="text-lg font-bold text-gray-900 mb-4">日常建议</h3>
            <div class="grid md:grid-cols-3 gap-4">
              <div class="p-4 bg-blue-50 rounded-xl">
                <span class="text-2xl mb-2 block">💧</span>
                <h4 class="font-medium text-gray-900 mb-1">多喝水</h4>
                <p class="text-sm text-gray-500">每天8杯水，保持身体水分平衡</p>
              </div>
              <div class="p-4 bg-green-50 rounded-xl">
                <span class="text-2xl mb-2 block">🏃</span>
                <h4 class="font-medium text-gray-900 mb-1">适量运动</h4>
                <p class="text-sm text-gray-500">每天30分钟中等强度运动</p>
              </div>
              <div class="p-4 bg-purple-50 rounded-xl">
                <span class="text-2xl mb-2 block">😴</span>
                <h4 class="font-medium text-gray-900 mb-1">充足睡眠</h4>
                <p class="text-sm text-gray-500">保证每天8小时睡眠</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
