<script setup lang="ts">
useSeoMeta({
  title: '健康管理 - NutriMind',
  description: '健康档案管理、体检数据OCR扫描、健康指标分析',
})

interface HealthMetrics {
  height: number
  weight: number
  bmi: number
  visionLeft: number
  visionRight: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  lungCapacity: number
  hemoglobin: number
}

interface HealthProfile {
  id: string
  name: string
  studentId: string
  school: string
  grade: string
  class: string
  checkDate: string
  birthDate: string
  gender: '男' | '女'
  metrics: HealthMetrics
  allergies: string[]
  conditions: string[]
  notes: string
}

// SVG Icons
const icons = {
  ai: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs>
      <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#aiGrad)"/>
    <circle cx="12" cy="12" r="4" fill="url(#aiGrad)"/>
  </svg>`,
  profile: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/><stop offset="100%" style="stop-color:#059669"/>
    </linearGradient></defs>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="url(#profileGrad)"/>
    <circle cx="12" cy="7" r="4" stroke="url(#profileGrad)"/>
  </svg>`,
  scan: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/><stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient></defs>
    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="url(#scanGrad)"/>
  </svg>`,
  chart: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <defs><linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/><stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient></defs>
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="url(#chartGrad)"/>
  </svg>`,
  user: `<svg class="w-full h-full" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="16" r="8" fill="currentColor"/>
    <ellipse cx="20" cy="36" rx="14" ry="10" fill="currentColor"/>
  </svg>`,
}

// Load profiles from localStorage
const loadProfiles = (): HealthProfile[] => {
  try {
    return JSON.parse(localStorage.getItem('healthProfiles') || '[]')
  }
  catch {
    return []
  }
}

const profiles = ref<HealthProfile[]>(loadProfiles())
const selectedProfileId = ref<string | null>(null)
const activeTab = ref<'list' | 'scan' | 'analysis'>('list')
const isEditing = ref(false)
const editingProfile = ref<HealthProfile | null>(null)

const selectedProfile = computed(() =>
  profiles.value.find(p => p.id === selectedProfileId.value) || null
)

// Calculate age from birthdate
const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Get BMI status
const getBMIStatus = (bmi: number) => {
  if (bmi < 14) return { label: '偏瘦', color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-400 to-blue-600' }
  if (bmi < 18.5) return { label: '正常偏低', color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-400 to-green-600' }
  if (bmi < 22) return { label: '正常', color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-400 to-green-600' }
  if (bmi < 25) return { label: '偏胖', color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-400 to-amber-600' }
  return { label: '肥胖', color: 'text-red-600', bg: 'bg-red-100', gradient: 'from-red-400 to-red-600' }
}

// Get vision status
const getVisionStatus = (vision: number) => {
  if (vision >= 1.0) return { label: '正常', color: 'text-green-600' }
  if (vision >= 0.8) return { label: '轻度下降', color: 'text-amber-600' }
  return { label: '近视', color: 'text-red-600' }
}

// Get blood pressure status
const getBPStatus = (systolic: number, diastolic: number) => {
  if (systolic < 100) return { label: '偏低', color: 'text-blue-600' }
  if (systolic < 120) return { label: '理想', color: 'text-green-600' }
  if (systolic < 130) return { label: '正常', color: 'text-green-600' }
  if (systolic < 140) return { label: '偏高', color: 'text-amber-600' }
  return { label: '高血压', color: 'text-red-600' }
}

// Get lung capacity status
const getLungCapacityLevel = (lungCapacity: number, age: number) => {
  const expected = age < 10 ? 1500 + (age * 100) : 2500 + (age * 50)
  const ratio = lungCapacity / expected
  if (ratio < 0.7) return { label: '偏低', color: 'text-red-600' }
  if (ratio < 0.85) return { label: '正常偏低', color: 'text-amber-600' }
  if (ratio < 1.15) return { label: '正常', color: 'text-green-600' }
  return { label: '优秀', color: 'text-green-600' }
}

// Analysis results
const analysisResults = computed(() => {
  if (!selectedProfile.value) return null

  const profile = selectedProfile.value
  const age = calculateAge(profile.birthDate)
  const bmiStatus = getBMIStatus(profile.metrics.bmi)
  const visionLeft = getVisionStatus(profile.metrics.visionLeft)
  const visionRight = getVisionStatus(profile.metrics.visionRight)
  const bpStatus = getBPStatus(profile.metrics.bloodPressureSystolic, profile.metrics.bloodPressureDiastolic)
  const lungStatus = getLungCapacityLevel(profile.metrics.lungCapacity, age)

  const scores = {
    nutrition: bmiStatus.label === '正常' ? 85 : bmiStatus.label === '正常偏低' || bmiStatus.label === '偏胖' ? 70 : 50,
    vision: visionLeft.label === '正常' && visionRight.label === '正常' ? 90 : 65,
    cardiovascular: bpStatus.label === '理想' || bpStatus.label === '正常' ? 85 : 60,
    respiratory: lungStatus.label === '正常' || lungStatus.label === '优秀' ? 80 : 60,
  }

  const overallScore = Math.round(
    (scores.nutrition + scores.vision + scores.cardiovascular + scores.respiratory) / 4
  )

  return {
    profile,
    age,
    bmiStatus,
    visionLeft,
    visionRight,
    bpStatus,
    lungStatus,
    scores,
    overallScore,
  }
})

// Delete profile
const deleteProfile = (id: string) => {
  if (!confirm('确定要删除该健康档案吗？')) return
  profiles.value = profiles.value.filter(p => p.id !== id)
  localStorage.setItem('healthProfiles', JSON.stringify(profiles.value))
  if (selectedProfileId.value === id) {
    selectedProfileId.value = profiles.value.length > 0 ? profiles.value[0].id : null
  }
}

// Add new profile
const addNewProfile = () => {
  const newProfile: HealthProfile = {
    id: Date.now().toString(),
    name: '新用户',
    studentId: '',
    school: '',
    grade: '',
    class: '',
    checkDate: new Date().toISOString().split('T')[0],
    birthDate: '2010-01-01',
    gender: '男',
    metrics: {
      height: 140,
      weight: 35,
      bmi: 17.9,
      visionLeft: 1.0,
      visionRight: 1.0,
      bloodPressureSystolic: 100,
      bloodPressureDiastolic: 65,
      heartRate: 80,
      lungCapacity: 2000,
      hemoglobin: 130,
    },
    allergies: [],
    conditions: [],
    notes: '',
  }
  profiles.value.push(newProfile)
  selectedProfileId.value = newProfile.id
}

// Edit profile
const startEditing = () => {
  if (selectedProfile.value) {
    editingProfile.value = JSON.parse(JSON.stringify(selectedProfile.value))
    isEditing.value = true
  }
}

const cancelEditing = () => {
  editingProfile.value = null
  isEditing.value = false
}

const saveEditing = () => {
  if (editingProfile.value) {
    const index = profiles.value.findIndex(p => p.id === editingProfile.value!.id)
    if (index >= 0) {
      profiles.value[index] = editingProfile.value
    }
    isEditing.value = false
    editingProfile.value = null
  }
}

// Watch for storage changes
onMounted(() => {
  profiles.value = loadProfiles()
  if (profiles.value.length > 0 && !selectedProfileId.value) {
    selectedProfileId.value = profiles.value[0].id
  }
})

watch(profiles, () => {
  localStorage.setItem('healthProfiles', JSON.stringify(profiles.value))
}, { deep: true })

// Event handler for when OCR scan completes
const handleScanComplete = (data: any) => {
  const newProfile: HealthProfile = {
    id: Date.now().toString(),
    name: data.name || '扫描用户',
    studentId: data.studentId || '',
    school: data.school || '',
    grade: data.grade || '',
    class: data.class || '',
    checkDate: data.checkDate || new Date().toISOString().split('T')[0],
    birthDate: data.birthDate || '2010-01-01',
    gender: data.gender || '男',
    metrics: {
      height: data.metrics?.height || 140,
      weight: data.metrics?.weight || 35,
      bmi: data.metrics?.bmi || 17.9,
      visionLeft: data.metrics?.visionLeft || 1.0,
      visionRight: data.metrics?.visionRight || 1.0,
      bloodPressureSystolic: data.metrics?.bloodPressureSystolic || 100,
      bloodPressureDiastolic: data.metrics?.bloodPressureDiastolic || 65,
      heartRate: data.metrics?.heartRate || 80,
      lungCapacity: data.metrics?.lungCapacity || 2000,
      hemoglobin: data.metrics?.hemoglobin || 130,
    },
    allergies: data.allergies || [],
    conditions: data.conditions || [],
    notes: '',
  }

  // Check if profile exists
  const existingIndex = profiles.value.findIndex(p => p.studentId === newProfile.studentId && newProfile.studentId)
  if (existingIndex >= 0) {
    profiles.value[existingIndex] = newProfile
    selectedProfileId.value = newProfile.id
  }
  else {
    profiles.value.push(newProfile)
    selectedProfileId.value = newProfile.id
  }

  activeTab.value = 'list'
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold mb-1">健康管理</h1>
            <p class="text-emerald-100 text-sm">健康档案 · OCR扫描 · 健康分析</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="activeTab = 'list'"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="activeTab === 'list' ? 'bg-white text-emerald-600 shadow' : 'bg-white/20 hover:bg-white/30'"
            >
              档案列表
            </button>
            <button
              @click="activeTab = 'scan'"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="activeTab === 'scan' ? 'bg-white text-emerald-600 shadow' : 'bg-white/20 hover:bg-white/30'"
            >
              OCR扫描
            </button>
            <button
              @click="activeTab = 'analysis'"
              class="px-3 py-1.5 rounded-lg text-sm transition-all"
              :class="activeTab === 'analysis' ? 'bg-white text-emerald-600 shadow' : 'bg-white/20 hover:bg-white/30'"
            >
              健康分析
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <!-- Tab: Profile List -->
      <div v-if="activeTab === 'list'" class="grid lg:grid-cols-4 gap-6">
        <!-- Profile List -->
        <div class="lg:col-span-1">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                健康档案
              </h2>
              <button @click="addNewProfile" class="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div v-if="profiles.length > 0" class="space-y-2 max-h-[400px] overflow-y-auto">
              <button
                v-for="profile in profiles"
                :key="profile.id"
                @click="selectedProfileId = profile.id"
                class="w-full p-2.5 rounded-lg text-left transition-all duration-300"
                :class="selectedProfileId === profile.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-sm">{{ profile.name }}</p>
                      <p class="text-xs opacity-80">{{ profile.grade }}{{ profile.class }}</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div v-else class="text-center py-6">
              <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p class="text-gray-500 text-sm">暂无健康档案</p>
              <p class="text-xs text-gray-400 mt-1">点击右上角添加</p>
            </div>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="lg:col-span-3">
          <template v-if="selectedProfile">
            <div class="card">
              <!-- Profile Header -->
              <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <div class="w-10 h-10 text-white" v-html="icons.user"></div>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-gray-900">{{ selectedProfile.name }}</h2>
                    <p class="text-gray-600">
                      {{ selectedProfile.school }} · {{ selectedProfile.grade }}{{ selectedProfile.class }}
                    </p>
                    <p class="text-sm text-gray-500 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      {{ selectedProfile.studentId || '未设置学号' }} · {{ selectedProfile.gender }} · {{ calculateAge(selectedProfile.birthDate) }}岁
                    </p>
                  </div>
                </div>
                <button @click="deleteProfile(selectedProfile.id)" class="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="删除">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button @click="startEditing" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="编辑">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>

              <!-- Quick Stats -->
              <div class="grid md:grid-cols-3 gap-4 mb-6">
                <!-- BMI Card -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-emerald-100">BMI指数</span>
                    <svg class="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span class="text-4xl font-bold">{{ selectedProfile.metrics.bmi.toFixed(1) }}</span>
                  <div class="mt-3">
                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                      {{ getBMIStatus(selectedProfile.metrics.bmi).label }}
                    </span>
                  </div>
                </div>

                <!-- Vision Card -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-lg shadow-violet-500/30">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-violet-100">视力</span>
                    <svg class="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span class="text-4xl font-bold">{{ selectedProfile.metrics.visionLeft.toFixed(1) }}/{{ selectedProfile.metrics.visionRight.toFixed(1) }}</span>
                  <div class="mt-3">
                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                      {{ getVisionStatus(Math.min(selectedProfile.metrics.visionLeft, selectedProfile.metrics.visionRight)).label }}
                    </span>
                  </div>
                </div>

                <!-- Blood Pressure Card -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-lg shadow-rose-500/30">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-rose-100">血压</span>
                    <svg class="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span class="text-3xl font-bold">{{ selectedProfile.metrics.bloodPressureSystolic }}/{{ selectedProfile.metrics.bloodPressureDiastolic }}</span>
                  <div class="mt-3">
                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                      {{ getBPStatus(selectedProfile.metrics.bloodPressureSystolic, selectedProfile.metrics.bloodPressureDiastolic).label }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Detailed Metrics -->
              <div class="mb-6">
                <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  详细指标
                </h3>
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                    <p class="text-sm text-gray-500 mb-1">身高</p>
                    <p class="text-xl font-semibold text-gray-900">{{ selectedProfile.metrics.height }} <span class="text-sm font-normal text-gray-500">cm</span></p>
                  </div>
                  <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                    <p class="text-sm text-gray-500 mb-1">体重</p>
                    <p class="text-xl font-semibold text-gray-900">{{ selectedProfile.metrics.weight }} <span class="text-sm font-normal text-gray-500">kg</span></p>
                  </div>
                  <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                    <p class="text-sm text-gray-500 mb-1">心率</p>
                    <p class="text-xl font-semibold text-gray-900">{{ selectedProfile.metrics.heartRate }} <span class="text-sm font-normal text-gray-500">bpm</span></p>
                  </div>
                  <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                    <p class="text-sm text-gray-500 mb-1">肺活量</p>
                    <p class="text-xl font-semibold text-gray-900">{{ selectedProfile.metrics.lungCapacity }} <span class="text-sm font-normal text-gray-500">ml</span></p>
                  </div>
                </div>
              </div>

              <!-- Allergies & Conditions -->
              <div v-if="selectedProfile.allergies?.length || selectedProfile.conditions?.length" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p v-if="selectedProfile.allergies?.length" class="font-medium text-amber-800">
                      过敏原: {{ selectedProfile.allergies.join('、') }}
                    </p>
                    <p v-if="selectedProfile.conditions?.length" class="font-medium text-amber-800 mt-1">
                      注意事项: {{ selectedProfile.conditions.join('、') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-4">
                <NuxtLink :to="`/menu?profileId=${selectedProfile.id}`" class="btn btn-primary flex-1 justify-center flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  生成餐单
                </NuxtLink>
                <button @click="activeTab = 'analysis'" class="btn btn-outline flex-1 justify-center flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  查看分析
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="card text-center py-16">
              <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">选择健康档案</h3>
              <p class="text-gray-500 mb-6">从左侧列表选择一个档案查看详情</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Tab: OCR Scan -->
      <div v-else-if="activeTab === 'scan'">
        <OCRScanner @scan-complete="handleScanComplete" @cancel="activeTab = 'list'" />
      </div>

      <!-- Tab: Health Analysis -->
      <div v-else-if="activeTab === 'analysis'">
        <template v-if="analysisResults">
          <div class="grid lg:grid-cols-5 gap-4 mb-6">
            <!-- Overall Score -->
            <div class="lg:col-span-1">
              <div class="card h-full flex flex-col items-center justify-center py-8 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div class="relative w-32 h-32 mb-4">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#E5E7EB" stroke-width="12" />
                    <circle
                      cx="64" cy="64" r="56" fill="none"
                      :stroke="getScoreColor(analysisResults.overallScore)"
                      stroke-width="12" stroke-linecap="round"
                      :stroke-dasharray="`${analysisResults.overallScore * 3.52} 352`"
                      class="transition-all duration-1000"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-3xl font-bold text-gray-900">{{ analysisResults.overallScore }}</span>
                  </div>
                </div>
                <p class="font-medium text-gray-900">综合健康评分</p>
              </div>
            </div>

            <!-- Category Scores -->
            <div class="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <span class="text-sm text-gray-500">营养状况</span>
                <div class="text-2xl font-bold text-gray-900 mt-1">{{ analysisResults.scores.nutrition }}</div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div class="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500" :style="{ width: `${analysisResults.scores.nutrition}%` }" />
                </div>
                <p class="mt-2 text-sm font-medium" :class="analysisResults.bmiStatus.color">{{ analysisResults.bmiStatus.label }}</p>
              </div>

              <div class="card p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                <span class="text-sm text-gray-500">视力</span>
                <div class="text-2xl font-bold text-gray-900 mt-1">{{ analysisResults.scores.vision }}</div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div class="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500" :style="{ width: `${analysisResults.scores.vision}%` }" />
                </div>
                <p class="mt-2 text-sm font-medium" :class="analysisResults.visionLeft.color">
                  L:{{ analysisResults.visionLeft.label }} R:{{ analysisResults.visionRight.label }}
                </p>
              </div>

              <div class="card p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                <span class="text-sm text-gray-500">心血管</span>
                <div class="text-2xl font-bold text-gray-900 mt-1">{{ analysisResults.scores.cardiovascular }}</div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div class="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500" :style="{ width: `${analysisResults.scores.cardiovascular}%` }" />
                </div>
                <p class="mt-2 text-sm font-medium" :class="analysisResults.bpStatus.color">{{ analysisResults.bpStatus.label }}</p>
              </div>

              <div class="card p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
                <span class="text-sm text-gray-500">肺活量</span>
                <div class="text-2xl font-bold text-gray-900 mt-1">{{ analysisResults.scores.respiratory }}</div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-500" :style="{ width: `${analysisResults.scores.respiratory}%` }" />
                </div>
                <p class="mt-2 text-sm font-medium" :class="analysisResults.lungStatus.color">{{ analysisResults.lungStatus.label }}</p>
              </div>
            </div>
          </div>

          <!-- AI Recommendations -->
          <div class="card">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <div class="w-6 h-6 text-white" v-html="icons.ai"></div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">AI健康建议</h3>
                <p class="text-sm text-gray-500">基于健康档案数据的个性化建议</p>
              </div>
            </div>

            <div class="space-y-4">
              <div v-if="analysisResults.scores.nutrition < 80" class="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">营养建议</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ analysisResults.bmiStatus.label === '偏瘦' ? '建议增加蛋白质和优质碳水化合物的摄入，保持均衡饮食。' : '建议控制总热量摄入，增加蔬菜水果比例，保持规律进餐。' }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="analysisResults.scores.vision < 80" class="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">视力保护</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      建议减少电子产品使用时间，保持正确读写姿势，每天保证2小时以上户外活动。
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="analysisResults.scores.nutrition >= 80 && analysisResults.scores.vision >= 80" class="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">健康状况良好</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      继续保持良好的生活习惯和饮食结构，定期体检以保持健康状态。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="card text-center py-16">
            <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">请先选择健康档案</h3>
            <p class="text-gray-500 mb-6">在"档案列表"中选择一个档案后查看分析</p>
            <button @click="activeTab = 'list'" class="btn btn-primary">
              返回档案列表
            </button>
          </div>
        </template>
      </div>

      <!-- Edit Profile Modal -->
      <div v-if="isEditing && editingProfile" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">编辑健康档案</h3>
            <button @click="cancelEditing" class="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Basic Info -->
            <div>
              <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                基本信息
              </h4>
              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">姓名</label>
                  <input v-model="editingProfile.name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">学号</label>
                  <input v-model="editingProfile.studentId" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">性别</label>
                  <select v-model="editingProfile.gender" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">学校</label>
                  <input v-model="editingProfile.school" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">年级</label>
                  <input v-model="editingProfile.grade" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">班级</label>
                  <input v-model="editingProfile.class" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">出生日期</label>
                  <input v-model="editingProfile.birthDate" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>

            <!-- Metrics -->
            <div>
              <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                健康指标
              </h4>
              <div class="grid md:grid-cols-5 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">身高 (cm)</label>
                  <input v-model.number="editingProfile.metrics.height" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">体重 (kg)</label>
                  <input v-model.number="editingProfile.metrics.weight" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">左眼视力</label>
                  <input v-model.number="editingProfile.metrics.visionLeft" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">右眼视力</label>
                  <input v-model.number="editingProfile.metrics.visionRight" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">血红蛋白</label>
                  <input v-model.number="editingProfile.metrics.hemoglobin" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">收缩压</label>
                  <input v-model.number="editingProfile.metrics.bloodPressureSystolic" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">舒张压</label>
                  <input v-model.number="editingProfile.metrics.bloodPressureDiastolic" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">心率 (bpm)</label>
                  <input v-model.number="editingProfile.metrics.heartRate" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">肺活量 (ml)</label>
                  <input v-model.number="editingProfile.metrics.lungCapacity" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>

            <!-- Allergies & Conditions -->
            <div>
              <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                过敏原与注意事项
              </h4>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">过敏原 (逗号分隔)</label>
                  <input :value="editingProfile.allergies.join(',')" @input="e => editingProfile!.allergies = (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean)" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="如: 花生, 虾, 牛奶" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">注意事项 (逗号分隔)</label>
                  <input :value="editingProfile.conditions.join(',')" @input="e => editingProfile!.conditions = (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean)" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="如: 糖尿病, 高血压" />
                </div>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
            <button @click="cancelEditing" class="btn btn-outline">取消</button>
            <button @click="saveEditing" class="btn btn-primary">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
