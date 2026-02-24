<script setup lang="ts">
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '用户管理 - NutriMind' })

useAuthGuard(['ADMIN'])

const searchQuery = ref('')
const selectedRole = ref('')
const loading = ref(false)

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'PARENT', label: '家长' },
  { value: 'STUDENT', label: '学生' },
  { value: 'SCHOOL_ADMIN', label: '学校管理员' },
  { value: 'CAFETERIA_MANAGER', label: '食堂管理员' },
  { value: 'CAFETERIA_COOK', label: '厨师' },
  { value: 'DOCTOR', label: '医生/营养师' },
  { value: 'INSTITUTION', label: '机构' },
  { value: 'ADMIN', label: '超级管理员' },
]

const roleBadge: Record<string, string> = {
  PARENT: 'bg-indigo-100 text-indigo-700',
  STUDENT: 'bg-sky-100 text-sky-700',
  SCHOOL_ADMIN: 'bg-violet-100 text-violet-700',
  CAFETERIA_MANAGER: 'bg-orange-100 text-orange-700',
  CAFETERIA_COOK: 'bg-amber-100 text-amber-700',
  DOCTOR: 'bg-teal-100 text-teal-700',
  INSTITUTION: 'bg-cyan-100 text-cyan-700',
  ADMIN: 'bg-red-100 text-red-700',
}

const roleLabel: Record<string, string> = {
  PARENT: '家长', STUDENT: '学生', SCHOOL_ADMIN: '学校管理员',
  CAFETERIA_MANAGER: '食堂管理员', CAFETERIA_COOK: '厨师',
  DOCTOR: '医生/营养师', INSTITUTION: '机构', ADMIN: '超级管理员',
}

const users = ref([
  { id: 1, name: '张管理', phone: '13800138000', role: 'ADMIN', createdAt: '2024-01-01', active: true },
  { id: 2, name: '李家长', phone: '13800138001', role: 'PARENT', createdAt: '2024-02-15', active: true },
  { id: 3, name: '王同学', phone: '13800138002', role: 'STUDENT', createdAt: '2024-02-20', active: true },
  { id: 4, name: '陈校长', phone: '13800138003', role: 'SCHOOL_ADMIN', createdAt: '2024-01-10', active: true },
  { id: 5, name: '刘食堂', phone: '13800138004', role: 'CAFETERIA_MANAGER', createdAt: '2024-01-15', active: true },
  { id: 6, name: '赵医生', phone: '13800138005', role: 'DOCTOR', createdAt: '2024-03-01', active: false },
])

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchSearch = !searchQuery.value || u.name.includes(searchQuery.value) || u.phone.includes(searchQuery.value)
    const matchRole = !selectedRole.value || u.role === selectedRole.value
    return matchSearch && matchRole
  })
})

const toggleActive = (user: any) => {
  user.active = !user.active
}

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter(u => u.active).length,
  roles: [...new Set(users.value.map(u => u.role))].length,
}))
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
        <p class="text-gray-500 text-sm mt-1">管理平台所有用户账号与权限</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">总用户数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">活跃用户</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.active }}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">角色种类</p>
        <p class="text-2xl font-bold text-indigo-600 mt-1">{{ stats.roles }}</p>
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
        v-model="selectedRole"
        class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">用户</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">手机号</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">角色</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">注册时间</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-medium text-gray-900">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ user.phone }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="roleBadge[user.role]">
                {{ roleLabel[user.role] }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-sm">{{ user.createdAt }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >
                {{ user.active ? '活跃' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button
                @click="toggleActive(user)"
                class="text-xs font-medium transition-colors"
                :class="user.active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'"
              >
                {{ user.active ? '禁用' : '启用' }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">暂无用户数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
