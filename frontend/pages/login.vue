<script setup lang="ts">
useSeoMeta({
  title: '登录 - NutriMind',
  description: '登录 NutriMind 营养健康平台',
})

const router = useRouter()
const config = useRuntimeConfig()

const phone = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  if (!phone.value || !password.value) {
    error.value = '请输入手机号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001/api/v1'
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.value,
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }

    // Store token and user info
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.data.user))

    // Navigate to dashboard
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查网络'
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const goToHome = () => {
  router.push('/')
}

// Check if already logged in
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl shadow-lg shadow-emerald-500/30 mb-4">
          <svg class="w-12 h-12 text-white" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.2)"/>
            <path d="M32 14c0 0-8 8-8 16 0 4 2 8 8 12 6-4 8-8 8-12 0-8-8-16-8-16z" fill="white"/>
            <path d="M32 26v20M24 36c0 0 4 6 8 8M40 36c0 0-4 6-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">NutriMind</h1>
        <p class="text-gray-500 mt-2">智能营养健康平台</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">欢迎回来</h2>

        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <div class="relative">
              <input
                v-model="phone"
                type="tel"
                placeholder="请输入手机号"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all pr-12"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            </span>
            <span v-else>登 录</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-gray-500">
            还没有账号？
            <button @click="goToRegister" class="text-emerald-600 hover:text-emerald-700 font-medium">
              立即注册
            </button>
          </p>
        </div>

        <!-- Demo Account -->
        <div class="mt-6 p-4 bg-gray-50 rounded-xl">
          <p class="text-sm text-gray-500 text-center">
            演示账号：13800138000 / 123456
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 flex flex-col gap-3">
        <p class="text-center text-gray-400 text-sm">
          Powered by AI · 基于专业知识库提供健康建议
        </p>
        <button
          @click="goToHome"
          class="text-center text-gray-400 hover:text-emerald-600 text-sm transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>
