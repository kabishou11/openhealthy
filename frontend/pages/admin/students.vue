<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '学生管理 - NutriMind' })

const { authStore } = useAuthGuard(['SCHOOL_ADMIN', 'ADMIN'])

const searchQuery = ref('')
const selectedClass = ref('')
const loading = ref(false)

const classes = ['全部班级', '初一(1)班', '初一(2)班', '初二(1)班', '初二(2)班', '初三(1)班', '初三(2)班']

const students = ref([
  { id: 1, name: '张小明', class: '初一(1)班', age: 12, height: 155, weight: 45, bmi: 18.7, status: 'normal', phone: '13800138001' },
  { id: 2, name: '李小红', class: '初一(1)班', age: 12, height: 152, weight: 52, bmi: 22.5, status: 'overweight', phone: '13800138002' },
  { id: 3, name: '王小强', class: '初一(2)班', age: 13, height: 160, weight: 40, bmi: 15.6, status: 'underweight', phone: '13800138003' },
  { id: 4, name: '陈小芳', class: '初二(1)班', age: 14, height: 158, weight: 50, bmi: 20.0, status: 'normal', phone: '13800138004' },
  { id: 5, name: '刘小华', class: '初二(2)班', age: 14, height: 165, weight: 58, bmi: 21.3, status: 'normal', phone: '13800138005' },
  { id: 6, name: '赵小丽', class: '初三(1)班', age: 15, height: 162, weight: 65, bmi: 24.8, status: 'overweight', phone: '13800138006' },
])

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const matchSearch = !searchQuery.value || s.name.includes(searchQuery.value) || s.phone.includes(searchQuery.value)
    const matchClass = !selectedClass.value || selectedClass.value === '全部班级' || s.class === selectedClass.value
    return matchSearch && matchClass
  })
})

const statusMap: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'bg-green-100 text-green-700' },
  overweight: { label: '超重', color: 'bg-orange-100 text-orange-700' },
  underweight: { label: '偏瘦', color: 'bg-blue-100 text-blue-700' },
  obese: { label: '肥胖', color: 'bg-red-100 text-red-700' },
}

const stats = computed(() => ({
  total: students.value.length,
  normal: students.value.filter(s => s.status === 'normal').length,
  overweight: students.value.filter(s => s.status === 'overweight' || s.status === 'obese').length,
  underweight: students.value.filter(s => s.status === 'underweight').length,
}))

const showAddModal = ref(false)
const newStudent = ref({ name: '', class: '', age: '', height: '', weight: '', phone: '' })

const addStudent = () => {
  if (!newStudent.value.name || !newStudent.value.class) return
  const h = Number(newStudent.value.height) / 100
  const w = Number(newStudent.value.weight)
  const bmi = h > 0 ? Math.round(w / (h * h) * 10) / 10 : 0
  students.value.push({
    id: Date.now(),
    name: newStudent.value.name,
    class: newStudent.value.class,
    age: Number(newStudent.value.age),
    height: Number(newStudent.value.height),
    weight: w,
    bmi,
    status: bmi < 18.5 ? 'underweight' : bmi < 24 ? 'normal' : bmi < 28 ? 'overweight' : 'obese',
    phone: newStudent.value.phone,
  })
  showAddModal.value = false
  newStudent.value = { name: '', class: '', age: '', height: '', weight: '', phone: '' }
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">学生管理</h1>
        <p class="text-gray-500 text-sm mt-1">管理学生健康档案与营养状况</p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        添加学生
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">总学生数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">体重正常</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.normal }}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">超重/肥胖</p>
        <p class="text-2xl font-bold text-orange-500 mt-1">{{ stats.overweight }}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">体重偏轻</p>
        <p class="text-2xl font-bold text-blue-500 mt-1">{{ stats.underweight }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex gap-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索姓名或手机号..."
        class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <select
        v-model="selectedClass"
        class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">班级</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">年龄</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">身高(cm)</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">体重(kg)</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">BMI</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-medium text-gray-900">{{ student.name }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ student.class }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ student.age }}岁</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ student.height }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ student.weight }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm font-medium">{{ student.bmi }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="statusMap[student.status]?.color">
                {{ statusMap[student.status]?.label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <NuxtLink
                :to="`/health/records?student=${student.id}`"
                class="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                查看档案
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="filteredStudents.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-400 text-sm">暂无学生数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">添加学生</h3>
        <div class="space-y-3">
          <input v-model="newStudent.name" type="text" placeholder="姓名 *" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <select v-model="newStudent.class" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">选择班级 *</option>
            <option v-for="c in classes.slice(1)" :key="c" :value="c">{{ c }}</option>
          </select>
          <div class="grid grid-cols-2 gap-3">
            <input v-model="newStudent.age" type="number" placeholder="年龄" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input v-model="newStudent.phone" type="tel" placeholder="家长手机号" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input v-model="newStudent.height" type="number" placeholder="身高(cm)" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input v-model="newStudent.weight" type="number" placeholder="体重(kg)" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="showAddModal = false" class="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">取消</button>
          <button @click="addStudent" class="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm hover:bg-emerald-600">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>
