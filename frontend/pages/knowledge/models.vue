<script setup lang="ts">
import { useModelsAPI } from '~/composables/useModels'

useSeoMeta({
  title: '模型配置 - NutriMind',
  description: '配置LLM和Embedding模型参数',
})

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
    // Backend returns config directly (not wrapped in data)
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
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-bold text-gray-900">大语言模型 (LLM)</h2>
              <p class="text-sm text-gray-500">选择用于对话和生成的主模型</p>
            </div>
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              当前: {{ currentConfig.llm }}
            </span>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="model in llmModels"
              :key="model.id"
              class="p-4 rounded-xl border-2 transition-all cursor-pointer"
              :class="currentConfig.llm === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'"
              @click="selectLLM(model.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="font-bold text-gray-900">{{ model.name }}</h3>
                  <p class="text-sm text-gray-500">{{ model.provider }}</p>
                </div>
                <span
                  v-if="currentConfig.llm === model.id"
                  class="px-2 py-1 bg-blue-500 text-white rounded-full text-xs"
                >
                  使用中
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3">{{ model.description || '暂无描述' }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">上下文: {{ model.contextLength || '未知' }}</span>
                <button
                  @click.stop="handleTest(model.id)"
                  :disabled="testing === model.id"
                  class="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {{ testing === model.id ? '测试中...' : '测试连接' }}
                </button>
              </div>
              <div
                v-if="testResults[model.id]"
                class="mt-2 p-2 rounded-lg text-sm"
                :class="testResults[model.id].success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ testResults[model.id].message }}
              </div>
            </div>
          </div>
        </div>

        <!-- Embedding Models -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Embedding 模型</h2>
              <p class="text-sm text-gray-500">用于向量化和语义搜索</p>
            </div>
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              当前: {{ currentConfig.embedding }}
            </span>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="model in embeddingModels"
              :key="model.id"
              class="p-4 rounded-xl border-2 transition-all cursor-pointer"
              :class="currentConfig.embedding === model.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'"
              @click="selectEmbedding(model.id)"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="font-bold text-gray-900">{{ model.name }}</h3>
                  <p class="text-sm text-gray-500">{{ model.provider }}</p>
                </div>
                <span
                  v-if="currentConfig.embedding === model.id"
                  class="px-2 py-1 bg-purple-500 text-white rounded-full text-xs"
                >
                  使用中
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3">{{ model.description || '暂无描述' }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">维度: {{ model.dimensions || '未知' }}</span>
                <button
                  @click.stop="handleTest(model.id)"
                  :disabled="testing === model.id"
                  class="text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  {{ testing === model.id ? '测试中...' : '测试连接' }}
                </button>
              </div>
              <div
                v-if="testResults[model.id]"
                class="mt-2 p-2 rounded-lg text-sm"
                :class="testResults[model.id].success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ testResults[model.id].message }}
              </div>
            </div>
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
