<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

useSeoMeta({
  title: '体检扫描 - NutriMind',
  description: '上传体检报告自动识别健康数据',
})

const router = useRouter()
const authStore = useAuthStore()

// Check auth
onMounted(() => {
  const user = localStorage.getItem('user')
  if (!user) {
    router.push('/login')
  }
})

const onScanComplete = () => {
  router.push('/health/records')
}

const onCancel = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold">体检报告扫描</h1>
            <p class="text-teal-100 mt-1">上传体检报告自动识别健康数据</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- OCR Scanner Component -->
      <OCRScanner @scan-complete="onScanComplete" @cancel="onCancel" />

      <!-- Tips -->
      <div class="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 class="font-bold text-blue-900 mb-3">拍摄建议</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            请确保体检报告内容清晰可见
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            避免光线反光或阴影遮挡文字
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            建议拍摄完整的体检报告表格
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            如果识别不准确，可手动修正后保存
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
