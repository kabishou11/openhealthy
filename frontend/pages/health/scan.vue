<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useOCR, type HealthCheckupData } from '~/composables/useOCR'
import { useStudentsAPI } from '~/composables/useStudents'

useSeoMeta({
  title: '体检扫描 - NutriMind',
  description: '上传体检报告自动识别健康数据',
})

const router = useRouter()
const authStore = useAuthStore()
const { checkStatus, loadModel, uploadAndExtract } = useOCR()
const { getStudents } = useStudentsAPI()

const loading = ref(false)
const ocrStatus = ref<any>(null)
const extractedData = ref<HealthCheckupData | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const saving = ref(false)

// Student list for linking
const students = ref<any[]>([])
const selectedStudentId = ref('')

// Check auth and load initial data
onMounted(async () => {
  const user = localStorage.getItem('user')
  if (!user) {
    router.push('/login')
    return
  }

  // Check OCR status
  try {
    ocrStatus.value = await checkStatus()
  } catch (e) {
    console.error('OCR status check failed:', e)
  }

  // Load students for parent role
  const userData = JSON.parse(user)
  if (userData.role === 'PARENT') {
    try {
      students.value = await getStudents()
    } catch (e) {
      console.error('Failed to load students:', e)
    }
  }
})

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    extractedData.value = null
    error.value = null
  }
}

// Handle drag and drop
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    extractedData.value = null
    error.value = null
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// Start OCR process
const startOCR = async () => {
  if (!selectedFile.value) {
    error.value = '请先选择图片文件'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Ensure model is loaded
    if (!ocrStatus.value?.model_loaded) {
      const loadResult = await loadModel()
      if (!loadResult.success) {
        throw new Error(loadResult.message || 'OCR模型加载失败')
      }
    }

    // Extract health checkup data
    extractedData.value = await uploadAndExtract(selectedFile.value)
  } catch (e: any) {
    error.value = e.message || 'OCR识别失败，请重试'
    console.error('OCR error:', e)
  } finally {
    loading.value = false
  }
}

// Clear and retry
const clearAndRetry = () => {
  selectedFile.value = null
  previewUrl.value = null
  extractedData.value = null
  error.value = null
}

// Save extracted data (link to student)
const saveData = async () => {
  if (!extractedData.value) return

  saving.value = true
  try {
    // TODO: Call API to save health record
    alert('数据已保存到健康档案')
    router.push('/health/analysis')
  } catch (e: any) {
    error.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}

// Supported file types
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
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
      <!-- OCR Status -->
      <div v-if="ocrStatus" class="mb-6 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div class="w-3 h-3 rounded-full" :class="ocrStatus.model_loaded ? 'bg-green-500' : 'bg-amber-500'"></div>
        <span class="text-gray-600">
          OCR服务: {{ ocrStatus.model_loaded ? '已就绪' : '加载中...' }}
        </span>
        <span v-if="ocrStatus.model_name" class="text-gray-400 text-sm">
          ({{ ocrStatus.model_name }})
        </span>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Upload Area -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-4">上传体检报告</h2>

          <!-- Drop Zone -->
          <div
            v-if="!previewUrl"
            @drop="handleDrop"
            @dragover="handleDragOver"
            class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer"
            @click="$refs.fileInput.click()"
          >
            <input
              ref="fileInput"
              type="file"
              :accept="acceptedTypes.join(',')"
              class="hidden"
              @change="handleFileSelect"
            />
            <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-gray-900 font-medium mb-1">点击或拖拽上传图片</p>
            <p class="text-gray-500 text-sm">支持 JPG、PNG、WebP 格式</p>
          </div>

          <!-- Preview -->
          <div v-else class="space-y-4">
            <div class="relative rounded-xl overflow-hidden bg-gray-100">
              <img :src="previewUrl" alt="Preview" class="w-full max-h-80 object-contain" />
              <button
                @click="clearAndRetry"
                class="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              @click="startOCR"
              :disabled="loading"
              class="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? '识别中...' : '开始识别' }}</span>
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-red-600 text-sm">{{ error }}</p>
          </div>
        </div>

        <!-- Results -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-4">识别结果</h2>

          <div v-if="!extractedData" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p class="text-gray-500">上传图片后点击识别</p>
            <p class="text-gray-400 text-sm mt-1">AI将自动提取体检数据</p>
          </div>

          <div v-else class="space-y-6">
            <!-- Extracted Data -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 rounded-xl">
                <p class="text-sm text-blue-600 mb-1">姓名</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.name || '-' }}</p>
              </div>
              <div class="p-4 bg-purple-50 rounded-xl">
                <p class="text-sm text-purple-600 mb-1">性别</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.gender || '-' }}</p>
              </div>
              <div class="p-4 bg-green-50 rounded-xl">
                <p class="text-sm text-green-600 mb-1">身高</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.height ? `${extractedData.height} cm` : '-' }}</p>
              </div>
              <div class="p-4 bg-green-50 rounded-xl">
                <p class="text-sm text-green-600 mb-1">体重</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.weight ? `${extractedData.weight} kg` : '-' }}</p>
              </div>
              <div class="p-4 bg-amber-50 rounded-xl">
                <p class="text-sm text-amber-600 mb-1">BMI</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.bmi?.toFixed(1) || '-' }}</p>
              </div>
              <div class="p-4 bg-teal-50 rounded-xl">
                <p class="text-sm text-teal-600 mb-1">视力(左/右)</p>
                <p class="text-xl font-bold text-gray-900">
                  {{ extractedData.vision_left ? `${extractedData.vision_left}/${extractedData.vision_right}` : '-' }}
                </p>
              </div>
              <div class="p-4 bg-rose-50 rounded-xl">
                <p class="text-sm text-rose-600 mb-1">血压</p>
                <p class="text-xl font-bold text-gray-900">
                  {{ extractedData.blood_pressure_systolic && extractedData.blood_pressure_diastolic
                    ? `${extractedData.blood_pressure_systolic}/${extractedData.blood_pressure_diastolic}`
                    : '-' }}
                </p>
              </div>
              <div class="p-4 bg-indigo-50 rounded-xl">
                <p class="text-sm text-indigo-600 mb-1">心率</p>
                <p class="text-xl font-bold text-gray-900">{{ extractedData.heart_rate ? `${extractedData.heart_rate} bpm` : '-' }}</p>
              </div>
            </div>

            <!-- Confidence -->
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500">识别置信度:</span>
              <span class="font-medium" :class="extractedData.confidence > 0.8 ? 'text-green-600' : 'text-amber-600'">
                {{ (extractedData.confidence * 100).toFixed(0) }}%
              </span>
            </div>

            <!-- Raw Text Preview -->
            <div>
              <p class="text-sm text-gray-500 mb-2">原始文本:</p>
              <div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto">
                {{ extractedData.raw_text?.slice(0, 500) }}{{ extractedData.raw_text?.length > 500 ? '...' : '' }}
              </div>
            </div>

            <!-- Student Selection (for parents) -->
            <div v-if="students.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">关联学生档案</label>
              <select
                v-model="selectedStudentId"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">选择学生</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }}
                </option>
              </select>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="clearAndRetry"
                class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                重新识别
              </button>
              <button
                @click="saveData"
                :disabled="saving"
                class="flex-1 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                {{ saving ? '保存中...' : '保存数据' }}
              </button>
            </div>
          </div>
        </div>
      </div>

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
