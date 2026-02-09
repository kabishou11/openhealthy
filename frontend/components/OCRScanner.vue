<script setup lang="ts">
interface Emits {
  (e: 'scan-complete', data: any): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

interface ExtractedData {
  name: string
  studentId: string
  school: string
  grade: string
  class: string
  checkDate: string
  birthDate: string
  gender: '男' | '女'
  metrics: {
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
  allergies: string[]
  conditions: string[]
}

const API_BASE = 'http://127.0.0.1:3001'

// State
const isUploading = ref(false)
const isProcessing = ref(false)
const uploadedImage = ref<string | null>(null)
const extractedData = ref<ExtractedData | null>(null)
const error = ref<string | null>(null)

// GLM-OCR Model state - pipeline mode
const modelLoaded = ref(false)
const modelLoading = ref(false)
const modelUrl = ref<string | null>(null)
const modelLoadProgress = ref<{ stage: string; percent: number; message: string } | null>(null)
const modelError = ref<string | null>(null)

// Poll status
let statusPollTimer: ReturnType<typeof setInterval> | null = null

// Refresh GLM-OCR model status from server
const refreshStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/v1/ocr/status`)
    if (response.ok) {
      const data = await response.json()
      console.log('OCR Status update:', data)
      // Always use the server's status - if model_loaded is not explicitly true, treat as false
      modelLoaded.value = data.modelLoaded === true
      modelLoading.value = data.loading === true
      modelUrl.value = data.url || null
      if (data.progress) {
        modelLoadProgress.value = data.progress
      }
      console.log('modelLoaded:', modelLoaded.value, 'modelLoading:', modelLoading.value)
    } else {
      // Server responded but with error - reset to unloaded
      console.log('Status check failed, resetting to unloaded')
      modelLoaded.value = false
      modelLoading.value = false
    }
  } catch (e) {
    console.error('Failed to refresh OCR status:', e)
    // Network/error - reset to unloaded
    modelLoaded.value = false
    modelLoading.value = false
  }
}

const pollStatus = async () => {
  await refreshStatus()

  // Stop polling if not loading
  if (!modelLoading.value && statusPollTimer) {
    clearInterval(statusPollTimer)
    statusPollTimer = null
  }
}

// Load GLM-OCR model
const loadModel = async () => {
  console.log('Loading GLM-OCR model...')
  modelError.value = null
  modelLoading.value = true
  modelLoadProgress.value = { stage: '准备中', percent: 0, message: '开始加载模型...' }

  // Start polling
  if (statusPollTimer) clearInterval(statusPollTimer)
  statusPollTimer = setInterval(pollStatus, 500)

  try {
    console.log('Sending load request to backend...')
    const response = await fetch(`${API_BASE}/api/v1/ocr/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    console.log('Load response status:', response.status)
    const data = await response.json()
    console.log('Load response:', data)

    if (!response.ok) {
      modelError.value = data.error || '加载模型失败'
      modelLoading.value = false
      if (statusPollTimer) {
        clearInterval(statusPollTimer)
        statusPollTimer = null
      }
      return
    }

    // Immediate refresh after load request
    await refreshStatus()
  } catch (e) {
    console.error('Load error:', e)
    modelError.value = e instanceof Error ? e.message : '加载模型失败'
    modelLoading.value = false
    if (statusPollTimer) {
      clearInterval(statusPollTimer)
      statusPollTimer = null
    }
  }
}

// Unload GLM-OCR model
const unloadModel = async () => {
  console.log('Unloading model...')
  try {
    const response = await fetch(`${API_BASE}/api/v1/ocr/unload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    console.log('Unload response:', response.status, response.ok)

    // Force local state update immediately
    modelLoaded.value = false
    modelLoading.value = false
    modelUrl.value = null
    modelLoadProgress.value = { stage: '已卸载', percent: 0, message: '模型已卸载' }

    // Also fetch from server to verify
    await refreshStatus()
  } catch (e) {
    console.error('Failed to unload model:', e)
    // Still update local state
    modelLoaded.value = false
    modelUrl.value = null
  }
}

// Initialize - fetch initial status but don't load model automatically
onMounted(async () => {
  console.log('OCRScanner mounted, fetching initial status...')
  await refreshStatus()
})

onUnmounted(() => {
  if (statusPollTimer) {
    clearInterval(statusPollTimer)
    statusPollTimer = null
  }
})

// Mock OCR result
const mockOCRResult: ExtractedData = {
  name: '张三',
  studentId: '2024001',
  school: '阳光小学',
  grade: '三年级',
  class: '二班',
  checkDate: '2024-03-15',
  birthDate: '2012-06-15',
  gender: '男',
  metrics: {
    height: 145,
    weight: 38,
    bmi: 18.1,
    visionLeft: 1.0,
    visionRight: 0.8,
    bloodPressureSystolic: 105,
    bloodPressureDiastolic: 68,
    heartRate: 82,
    lungCapacity: 2200,
    hemoglobin: 128,
  },
  allergies: [],
  conditions: [],
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]

    // 支持图片和 PDF 格式
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const supportedPdfType = 'application/pdf'

    if (!supportedImageTypes.includes(file.type) && file.type !== supportedPdfType) {
      error.value = '请上传图片文件或PDF文件'
      return
    }

    if (file.type === supportedPdfType) {
      // 处理 PDF 文件
      if (file.size > 20 * 1024 * 1024) {
        error.value = 'PDF文件大小不能超过20MB'
        return
      }
      processPdfFile(file)
    } else {
      // 处理图片文件
      if (file.size > 10 * 1024 * 1024) {
        error.value = '图片大小不能超过10MB'
        return
      }

      // 压缩图片
      compressImage(file).then((compressedBase64) => {
        uploadedImage.value = compressedBase64
        error.value = null
        extractedData.value = null
      }).catch((err) => {
        console.error('Image compression error:', err)
        // 如果压缩失败，使用原始图片
        const reader = new FileReader()
        reader.onload = (e) => {
          uploadedImage.value = e.target?.result as string
          error.value = null
          extractedData.value = null
        }
        reader.readAsDataURL(file)
      })
    }
  }
}

// 压缩图片为 base64
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算最大尺寸 (GLM-OCR 最佳输入尺寸)
        const MAX_WIDTH = 1024
        const MAX_HEIGHT = 1024
        let width = img.width
        let height = img.height

        // 缩放图片
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)

        // 导出为 JPEG，质量 0.8
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)

        // 检查压缩后的大小
        const base64Length = compressedBase64.split(',')[1].length
        const fileSizeInMB = (base64Length * 3) / 4 / 1024 / 1024
        console.log(`Compressed image size: ${fileSizeInMB.toFixed(2)} MB`)

        resolve(compressedBase64)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 处理 PDF 文件 - 发送到后端解析
const processPdfFile = async (file: File) => {
  isProcessing.value = true
  error.value = null
  extractedData.value = null
  uploadedImage.value = null

  try {
    // Read file as base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result as string

      try {
        const response = await fetch('http://127.0.0.1:3001/api/v1/ocr/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64Data,
            filename: file.name,
          }),
        })

        if (!response.ok) {
          throw new Error('PDF解析失败')
        }

        const data = await response.json()

        if (data.success && data.extractedData) {
          extractedData.value = data.extractedData
          uploadedImage.value = 'PDF已解析'
        } else {
          throw new Error(data.error || 'PDF解析失败')
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'PDF处理失败，请重试或尝试上传图片'
        isProcessing.value = false
      }
    }
    reader.readAsDataURL(file)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'PDF处理失败，请重试或尝试上传图片'
    isProcessing.value = false
  }
}

const processImage = async () => {
  if (!uploadedImage.value) return

  // Double check model is loaded
  if (!modelLoaded.value) {
    error.value = '模型未加载，请先点击"加载模型"按钮'
    return
  }

  isProcessing.value = true
  error.value = null

  console.log('Starting OCR process...')

  try {
    const response = await fetch('http://127.0.0.1:3001/api/v1/ocr/health-checkup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: uploadedImage.value,
      }),
    })

    console.log('OCR response status:', response.status)

    if (!response.ok) {
      const errData = await response.json()
      console.error('OCR error response:', errData)
      throw new Error(errData.error || 'OCR处理失败')
    }

    const data = await response.json()
    console.log('OCR success:', data.success)

    if (data.success && data.extractedData) {
      extractedData.value = data.extractedData
    } else {
      throw new Error(data.error || 'OCR识别失败')
    }
  }
  catch (err) {
    console.error('OCR error:', err)
    error.value = err instanceof Error ? err.message : 'OCR处理失败，请重试'
    // Use mock data as fallback for demo
    extractedData.value = mockOCRResult
  }
  finally {
    isProcessing.value = false
  }
}

const reset = () => {
  uploadedImage.value = null
  extractedData.value = null
  error.value = null
  const input = document.getElementById('ocr-file-input') as HTMLInputElement
  if (input) input.value = ''
}

const handleSave = () => {
  if (extractedData.value) {
    emit('scan-complete', extractedData.value)
  }
}

const getBMIStatus = (bmi: number) => {
  if (bmi < 18.5) return { label: '偏瘦', color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-400 to-blue-600' }
  if (bmi < 24) return { label: '正常', color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-400 to-green-600' }
  if (bmi < 28) return { label: '偏胖', color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-400 to-amber-600' }
  return { label: '肥胖', color: 'text-red-600', bg: 'bg-red-100', gradient: 'from-red-400 to-red-600' }
}

const getVisionStatus = (vision: number) => {
  if (vision >= 1.0) return { label: '正常', color: 'text-green-600' }
  if (vision >= 0.8) return { label: '轻度近视', color: 'text-amber-600' }
  return { label: '近视', color: 'text-red-600' }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button @click="emit('cancel')" class="p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-2xl font-bold text-gray-900">体检表OCR扫描</h2>
    </div>

    <!-- GLM-OCR Model Section -->
    <div class="card mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        GLM-OCR 模型
      </h3>

      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm text-gray-500">智谱 AI 开发的本地 OCR 模型，支持复杂表格识别</p>
          <p v-if="modelUrl" class="text-xs text-green-600 mt-1">服务: {{ modelUrl }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!modelLoaded && !modelLoading"
            @click="loadModel"
            class="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            加载模型
          </button>
          <button
            v-if="modelLoaded && !modelLoading"
            @click="unloadModel"
            class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            卸载模型
          </button>
        </div>
      </div>

      <!-- Loading Progress -->
      <div v-if="modelLoading && modelLoadProgress" class="mb-4">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-gray-600">正在加载: {{ modelLoadProgress.stage }}</span>
          <span class="font-semibold text-violet-600">{{ modelLoadProgress.percent }}%</span>
        </div>
        <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
            :style="{ width: `${modelLoadProgress.percent}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ modelLoadProgress.message }}</p>
      </div>

      <!-- Model Status - LOADED -->
      <div v-if="modelLoaded && !modelLoading" class="flex items-center gap-2 text-sm text-green-600">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">GLM-OCR 已就绪</span>
      </div>

      <!-- Model Status - NOT LOADED -->
      <div v-if="!modelLoaded && !modelLoading" class="flex items-center gap-2 text-sm text-gray-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>请点击"加载模型"按钮开始使用 OCR</span>
      </div>

      <!-- Error Message -->
      <div v-if="modelError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
        <p class="text-sm text-red-600">{{ modelError }}</p>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <!-- Upload Section -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          上传体检表
        </h3>

        <div
          class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300"
          :class="uploadedImage ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-300 hover:border-emerald-400 bg-gray-50/50'"
        >
          <input
            id="ocr-file-input"
            type="file"
            accept="image/*,.pdf"
            class="hidden"
            @change="handleFileSelect"
          >

          <template v-if="uploadedImage">
            <div class="relative">
              <div v-if="uploadedImage === 'PDF已解析'" class="py-12">
                <svg class="w-16 h-16 mx-auto text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-emerald-600 font-medium">PDF 文件已解析</p>
              </div>
              <img
                v-else
                :src="uploadedImage"
                alt="上传的体检表"
                class="max-h-80 mx-auto rounded-xl shadow-lg"
              >
              <button
                @click="reset"
                class="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>

          <template v-else>
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg class="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <p class="text-gray-600 mb-2 font-medium">点击或拖拽上传体检表</p>
            <p class="text-sm text-gray-400 mb-4">支持 JPG、PNG、PDF 格式，最大10MB（PDF最大20MB）</p>

            <label
              for="ocr-file-input"
              class="btn btn-primary inline-block cursor-pointer flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              选择图片
            </label>
          </template>
        </div>

        <div v-if="error" class="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-600 text-sm">{{ error }}</p>
          </div>
        </div>

        <button
          v-if="uploadedImage && !extractedData"
          @click="processImage"
          class="btn w-full mt-4 flex items-center justify-center gap-2"
          :class="modelLoaded ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'"
          :disabled="isProcessing || !modelLoaded"
        >
          <template v-if="isProcessing">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            AI 识别中...
          </template>
          <template v-else-if="!modelLoaded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            请先加载 GLM-OCR 模型
          </template>
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            开始识别
          </template>
        </button>
      </div>

      <!-- Results Section -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          识别结果
        </h3>

        <template v-if="extractedData">
          <!-- Basic Info -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 mb-4">
            <h4 class="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              基本信息
            </h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-gray-500">姓名：</span>
                <span class="font-semibold text-gray-900">{{ extractedData.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">学号：</span>
                <span class="font-semibold text-gray-900">{{ extractedData.studentId }}</span>
              </div>
              <div class="flex items-center gap-2 col-span-2">
                <span class="text-gray-500">学校：</span>
                <span class="font-semibold text-gray-900">{{ extractedData.school }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">班级：</span>
                <span class="font-semibold text-gray-900">{{ extractedData.grade }}{{ extractedData.class }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">性别：</span>
                <span class="font-semibold text-gray-900">{{ extractedData.gender }}</span>
              </div>
            </div>
          </div>

          <!-- Health Metrics Summary -->
          <div class="space-y-3 mb-4">
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              健康指标
            </h4>

            <!-- BMI -->
            <div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">BMI指数</p>
                    <p class="font-bold text-2xl text-gray-900">{{ extractedData.metrics.bmi }}</p>
                  </div>
                </div>
                <span class="px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg" :class="`bg-gradient-to-r ${getBMIStatus(extractedData.metrics.bmi).gradient}`">
                  {{ getBMIStatus(extractedData.metrics.bmi).label }}
                </span>
              </div>
            </div>

            <!-- Vision & BP -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl">
                <p class="text-sm text-gray-500 mb-1">视力 (左/右)</p>
                <p class="font-bold text-xl text-gray-900">{{ extractedData.metrics.visionLeft.toFixed(1) }}/{{ extractedData.metrics.visionRight.toFixed(1) }}</p>
                <p class="text-sm mt-1" :class="getVisionStatus(Math.min(extractedData.metrics.visionLeft, extractedData.metrics.visionRight)).color">
                  {{ getVisionStatus(Math.min(extractedData.metrics.visionLeft, extractedData.metrics.visionRight)).label }}
                </p>
              </div>
              <div class="p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-xl">
                <p class="text-sm text-gray-500 mb-1">血压</p>
                <p class="font-bold text-xl text-gray-900">{{ extractedData.metrics.bloodPressureSystolic }}/{{ extractedData.metrics.bloodPressureDiastolic }}</p>
                <p class="text-sm text-gray-500 mt-1">mmHg</p>
              </div>
            </div>

            <!-- Basic Stats -->
            <div class="grid grid-cols-4 gap-2">
              <div class="p-3 bg-gray-50 rounded-xl text-center">
                <p class="text-xs text-gray-500">身高</p>
                <p class="font-semibold text-gray-900">{{ extractedData.metrics.height }}cm</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-xl text-center">
                <p class="text-xs text-gray-500">体重</p>
                <p class="font-semibold text-gray-900">{{ extractedData.metrics.weight }}kg</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-xl text-center">
                <p class="text-xs text-gray-500">心率</p>
                <p class="font-semibold text-gray-900">{{ extractedData.metrics.heartRate }}bpm</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-xl text-center">
                <p class="text-xs text-gray-500">肺活量</p>
                <p class="font-semibold text-gray-900">{{ extractedData.metrics.lungCapacity }}ml</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="handleSave" class="btn btn-primary flex-1 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              保存到档案
            </button>
          </div>
        </template>

        <template v-else>
          <div class="text-center py-16">
            <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p class="text-gray-500 mb-2">上传体检表后将显示识别结果</p>
            <p class="text-sm text-gray-400">AI 将自动提取健康数据</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Tips -->
    <div class="mt-8 card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 class="font-semibold text-blue-900 mb-2">使用提示</h4>
          <ul class="text-sm text-blue-800 space-y-2">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
              </svg>
              确保体检表图片清晰，光线充足
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
              </svg>
              完整拍摄整张表格，避免遮挡重要信息
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              识别结果仅供參考，请以实际体检报告为准
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
