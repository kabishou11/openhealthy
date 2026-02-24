<script setup lang="ts">
import { useModelsAPI } from '~/composables/useModels'

useSeoMeta({
  title: '模型配置 - NutriMind',
  description: '配置LLM和Embedding模型参数',
})

const API_BASE = 'http://127.0.0.1:3001'
const { getAvailableModels, getModelConfig, updateLLMModel, updateEmbeddingModel, testModel } = useModelsAPI()

// State
const loading = ref(true)
const saving = ref(false)
const testing = ref<string | null>(null)
const testResults = ref<Record<string, { success: boolean; message: string }>>({})

// Models from API
const llmModels = ref<any[]>([])
const embeddingModels = ref<any[]>([])

// Current config
const currentConfig = ref<any>({
  llm: 'moonshotai/Kimi-K2.5',
  embedding: 'Qwen/Qwen3-Embedding-8B',
  retrieval: 'hybrid',
  chunking: 'hierarchical',
})

// OCR state
const ocrStatus = ref({
  modelLoaded: false,
  loading: false,
  backend: null as string | null,
  backends: {} as Record<string, { path: string; available: boolean }>,
  serviceRunning: false,
})
let ocrPollTimer: ReturnType<typeof setInterval> | null = null

const loadOCRStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/ocr/status`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      ocrStatus.value = {
        modelLoaded: data.modelLoaded ?? false,
        loading: data.loading ?? false,
        backend: data.backend ?? null,
        backends: data.backends ?? {},
        serviceRunning: true,
      }
    }
  } catch {
    ocrStatus.value.serviceRunning = false
  }
}

const loadOCR = async () => {
  await fetch(`${API_BASE}/api/v1/ocr/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backend: 'dots-ocr' }),
  })
  ocrStatus.value.loading = true
  if (ocrPollTimer) clearInterval(ocrPollTimer)
  ocrPollTimer = setInterval(async () => {
    await loadOCRStatus()
    if (!ocrStatus.value.loading) {
      clearInterval(ocrPollTimer!)
      ocrPollTimer = null
    }
  }, 1000)
}

const unloadOCR = async () => {
  await fetch(`${API_BASE}/api/v1/ocr/unload`, { method: 'POST' })
  await loadOCRStatus()
}

// Load data
const loadData = async () => {
  loading.value = true
  try {
    const [models, config] = await Promise.all([
      getAvailableModels(),
      getModelConfig(),
    ])
    llmModels.value = models.llm || []
    embeddingModels.value = models.embedding || []
    if (config) {
      currentConfig.value = {
        llm: config.llm?.selected || currentConfig.value.llm,
        embedding: config.embedding?.selected || currentConfig.value.embedding,
        retrieval: config.retrieval?.enableHybridSearch ? 'hybrid' : 'vector',
        chunking: 'hierarchical',
      }
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  } finally {
    loading.value = false
  }
  await loadOCRStatus()
}

// Select model
const selectLLM = async (modelId: string) => {
  saving.value = true
  try {
    await updateLLMModel(modelId)
    currentConfig.value.llm = modelId
  } catch (error) {
    console.error('Failed to update LLM:', error)
  } finally {
    saving.value = false
  }
}

const selectEmbedding = async (modelId: string) => {
  saving.value = true
  try {
    await updateEmbeddingModel(modelId)
    currentConfig.value.embedding = modelId
  } catch (error) {
    console.error('Failed to update embedding:', error)
  } finally {
    saving.value = false
  }
}

// Test model
const handleTest = async (modelId: string) => {
  testing.value = modelId
  try {
    const result = await testModel(modelId)
    testResults.value[modelId] = result
  } catch (error: any) {
    testResults.value[modelId] = { success: false, message: error.message }
  } finally {
    testing.value = null
  }
}

onMounted(loadData)
onUnmounted(() => { if (ocrPollTimer) clearInterval(ocrPollTimer) })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white">
      <div class="container mx-auto px-4 py-8">
        <div>
          <h1 class="text-2xl font-bold">模型配置</h1>
          <p class="text-blue-100 mt-1">配置LLM和Embedding模型</p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-gray-500 mt-4">加载模型列表...</p>
      </div>

      <div v-else class="space-y-8">
        <!-- LLM Models -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-base font-semibold text-gray-900">大语言模型 (LLM)</h2>
            <span class="text-sm text-gray-400">用于对话和生成</span>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="currentConfig.llm"
              @change="selectLLM(currentConfig.llm)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="model in llmModels" :key="model.id" :value="model.id">
                {{ model.name }} · {{ model.provider }}
              </option>
            </select>
            <button
              @click="handleTest(currentConfig.llm)"
              :disabled="testing === currentConfig.llm"
              class="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 whitespace-nowrap"
            >
              {{ testing === currentConfig.llm ? '测试中...' : '测试连接' }}
            </button>
          </div>
          <div
            v-if="testResults[currentConfig.llm]"
            class="mt-2 px-3 py-2 rounded-lg text-sm"
            :class="testResults[currentConfig.llm].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
          >
            {{ testResults[currentConfig.llm].message }}
          </div>
        </div>

        <!-- Embedding Models -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-base font-semibold text-gray-900">Embedding 模型</h2>
            <span class="text-sm text-gray-400">用于向量化和语义搜索</span>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="currentConfig.embedding"
              @change="selectEmbedding(currentConfig.embedding)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option v-for="model in embeddingModels" :key="model.id" :value="model.id">
                {{ model.name }} · {{ model.provider }}
              </option>
            </select>
            <button
              @click="handleTest(currentConfig.embedding)"
              :disabled="testing === currentConfig.embedding"
              class="px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 whitespace-nowrap"
            >
              {{ testing === currentConfig.embedding ? '测试中...' : '测试连接' }}
            </button>
          </div>
          <div
            v-if="testResults[currentConfig.embedding]"
            class="mt-2 px-3 py-2 rounded-lg text-sm"
            :class="testResults[currentConfig.embedding].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
          >
            {{ testResults[currentConfig.embedding].message }}
          </div>
        </div>

        <!-- OCR Backend -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-base font-semibold text-gray-900">OCR 识别引擎</h2>
            <span class="text-sm text-gray-400">本地离线，用于体检报告识别</span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <span class="font-medium text-gray-800 text-sm">dots.ocr</span>
            <span
              v-if="ocrStatus.backends['dots-ocr']"
              class="text-xs text-gray-400 font-mono"
            >{{ ocrStatus.backends['dots-ocr'].path }}</span>
            <span
              class="px-2 py-0.5 rounded-full text-xs"
              :class="ocrStatus.backends['dots-ocr']?.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
            >
              {{ ocrStatus.backends['dots-ocr']?.available ? '已下载' : '未下载' }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-xs"
              :class="!ocrStatus.serviceRunning ? 'bg-gray-100 text-gray-400'
                : ocrStatus.modelLoaded ? 'bg-green-100 text-green-700'
                : ocrStatus.loading ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'"
            >
              {{ !ocrStatus.serviceRunning ? '服务未运行' : ocrStatus.modelLoaded ? '已加载' : ocrStatus.loading ? '加载中...' : '未加载' }}
            </span>
            <div class="ml-auto flex gap-2">
              <button
                @click="loadOCR"
                :disabled="!ocrStatus.serviceRunning || ocrStatus.loading || ocrStatus.modelLoaded"
                class="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
              >
                {{ ocrStatus.loading ? '加载中...' : '加载' }}
              </button>
              <button
                @click="unloadOCR"
                :disabled="!ocrStatus.modelLoaded"
                class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-300 transition-colors"
              >
                卸载
              </button>
              <button
                @click="loadOCRStatus"
                class="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                刷新
              </button>
            </div>
          </div>

          <div v-if="!ocrStatus.serviceRunning" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            OCR 服务未运行。请先启动后端服务，Python OCR 服务会自动随后端启动。
          </div>
        </div>

        <!-- Retrieval Settings -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 class="text-lg font-bold text-gray-900 mb-4">检索设置</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">检索模式</label>
              <select
                v-model="currentConfig.retrieval"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hybrid">混合检索 (BM25 + 向量)</option>
                <option value="vector">仅向量检索</option>
                <option value="bm25">仅关键词检索</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">分段策略</label>
              <select
                v-model="currentConfig.chunking"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hierarchical">父子分段</option>
                <option value="fixed">固定长度分段</option>
                <option value="semantic">语义分段</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 class="font-bold text-blue-900 mb-3">💡 使用提示</h3>
          <ul class="space-y-2 text-sm text-blue-800">
            <li>• LLM模型影响对话质量和生成内容的准确性</li>
            <li>• Embedding模型影响语义搜索的准确度</li>
            <li>• 混合检索结合关键词和向量检索，效果更好</li>
            <li>• 父子分段可以在保持上下文的同时精确匹配</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
