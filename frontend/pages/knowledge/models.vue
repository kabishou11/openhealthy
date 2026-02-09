<script setup lang="ts">
useSeoMeta({
  title: '模型配置 - NutriMind',
  description: '配置LLM和Embedding模型参数',
})

// LLM Models
const llmModels = [
  {
    id: 'moonshotai/Kimi-K2.5',
    name: 'Kimi K2.5',
    provider: 'ModelScope',
    description: 'Moonshot AI 的大语言模型，支持长上下文',
    type: 'chat',
    contextLength: '128K',
    strengths: ['长文本理解', '中文优化', '指令遵循'],
    status: 'available',
    apiUrl: 'https://api-inference.modelscope.cn/v1',
  },
  {
    id: 'Qwen/Qwen3-8B',
    name: 'Qwen3-8B',
    provider: 'ModelScope',
    description: '阿里巴巴通义千问开源模型',
    type: 'chat',
    contextLength: '32K',
    strengths: ['开源', '高性能', '多语言'],
    status: 'available',
    apiUrl: 'https://api-inference.modelscope.cn/v1',
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen2.5-72B',
    provider: 'ModelScope',
    description: '阿里巴巴通义千问72B参数指令微调模型',
    type: 'chat',
    contextLength: '128K',
    strengths: ['超大参数', '高质量输出', '复杂推理'],
    status: 'available',
    apiUrl: 'https://api-inference.modelscope.cn/v1',
  },
  {
    id: '01-ai/Yi-1.5-34B-Chat',
    name: 'Yi-1.5-34B',
    provider: 'ModelScope',
    description: '01.AI 开发的34B参数模型',
    type: 'chat',
    contextLength: '32K',
    strengths: ['长文本', '数学推理', '代码生成'],
    status: 'coming_soon',
    apiUrl: 'https://api-inference.modelscope.cn/v1',
  },
]

// Embedding Models
const embeddingModels = [
  {
    id: 'Qwen/Qwen3-Embedding-8B',
    name: 'Qwen3-Embedding-8B',
    provider: 'ModelScope',
    description: '阿里巴巴通义千问Embedding模型',
    dimensions: 768,
    contextLength: '8K',
    strengths: ['中文优化', '语义理解', '高性能'],
    status: 'available',
    maxBatchSize: 32,
  },
  {
    id: 'BAAI/bge-large-zh',
    name: 'BGE Large Zh',
    provider: 'Beijing Academy of AI',
    description: '智源BGE大模型中文版本',
    dimensions: 1024,
    contextLength: '8K',
    strengths: ['中文语义', '检索效果', '开源'],
    status: 'available',
    maxBatchSize: 16,
  },
  {
    id: 'shibing624/text2vec-base-chinese',
    name: 'Text2Vec Chinese',
    provider: 'Shibing624',
    description: '中文语义相似度模型',
    dimensions: 768,
    contextLength: '512',
    strengths: ['轻量', '快速', '中文'],
    status: 'available',
    maxBatchSize: 64,
  },
]

// Configuration state
const selectedLLM = ref('moonshotai/Kimi-K2.5')
const selectedEmbedding = ref('Qwen/Qwen3-Embedding-8B')
const apiToken = ref('')
const temperature = ref(0.7)
const maxTokens = ref(4096)
const topP = ref(0.9)
const retrievalTopK = ref(5)
const retrievalScoreThreshold = ref(0.5)
const enableHybridSearch = ref(true)
const hybridBM25Weight = ref(0.4)
const hybridVectorWeight = ref(0.6)
const enableRerank = ref(true)
const chunkParentSize = ref(1500)
const chunkChildSize = ref(400)
const chunkOverlap = ref(100)

// Active tab
const activeTab = ref<'llm' | 'embedding' | 'retrieval' | 'advanced'>('llm')

// Save configuration
const saveConfig = async () => {
  // Simulated save
  await new Promise(resolve => setTimeout(resolve, 500))
  alert('配置已保存')
}

// Test connection
const testConnection = async (modelType: string) => {
  // Simulated test
  await new Promise(resolve => setTimeout(resolve, 1500))
  alert(`${modelType} 连接测试成功！`)
}

// Reset to defaults
const resetDefaults = () => {
  temperature.value = 0.7
  maxTokens.value = 4096
  topP.value = 0.9
  retrievalTopK.value = 5
  retrievalScoreThreshold.value = 0.5
  enableHybridSearch.value = true
  hybridBM25Weight.value = 0.4
  hybridVectorWeight.value = 0.6
  enableRerank.value = true
  chunkParentSize.value = 1500
  chunkChildSize.value = 400
  chunkOverlap.value = 100
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold mb-1">模型配置</h1>
            <p class="text-violet-100 text-sm">配置LLM和Embedding模型参数</p>
          </div>
          <div class="flex gap-2">
            <button
              @click="resetDefaults"
              class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重置默认
            </button>
            <button
              @click="saveConfig"
              class="px-3 py-1.5 bg-white text-purple-600 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          @click="activeTab = 'llm'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeTab === 'llm' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'"
        >
          🤖 LLM
        </button>
        <button
          @click="activeTab = 'embedding'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeTab === 'embedding' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'"
        >
          📊 Embedding
        </button>
        <button
          @click="activeTab = 'retrieval'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeTab === 'retrieval' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'"
        >
          🔍 检索
        </button>
        <button
          @click="activeTab = 'advanced'"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeTab === 'advanced' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'"
        >
          ⚙️ 高级
        </button>
      </div>

      <!-- LLM Configuration -->
      <div v-if="activeTab === 'llm'" class="space-y-4">
        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">选择LLM模型</h2>
          <div class="grid md:grid-cols-2 gap-3">
            <div
              v-for="model in llmModels"
              :key="model.id"
              class="p-3 border-2 rounded-lg cursor-pointer transition-all"
              :class="selectedLLM === model.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'"
              @click="selectedLLM = model.id"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900 text-sm flex items-center gap-1">
                    {{ model.name }}
                    <span
                      v-if="model.status === 'coming_soon'"
                      class="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full"
                    >
                      即将
                    </span>
                  </h3>
                  <p class="text-xs text-gray-500">{{ model.provider }}</p>
                </div>
                <div
                  class="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  :class="selectedLLM === model.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'"
                ></div>
              </div>
              <p class="text-xs text-gray-600 mb-2">{{ model.description }}</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {{ model.contextLength }}
                </span>
                <span
                  v-for="strength in model.strengths"
                  :key="strength"
                  class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs"
                >
                  {{ strength }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">LLM参数</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ temperature }}</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
              <input
                v-model.number="maxTokens"
                type="number"
                min="256"
                max="65536"
                step="256"
                class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Top P</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ topP }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Embedding Configuration -->
      <div v-if="activeTab === 'embedding'" class="space-y-4">
        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">选择Embedding模型</h2>
          <div class="grid md:grid-cols-3 gap-3">
            <div
              v-for="model in embeddingModels"
              :key="model.id"
              class="p-3 border-2 rounded-lg cursor-pointer transition-all"
              :class="selectedEmbedding === model.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'"
              @click="selectedEmbedding = model.id"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="font-medium text-gray-900 text-sm">{{ model.name }}</h3>
                  <p class="text-xs text-gray-500">{{ model.provider }}</p>
                </div>
                <div
                  class="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  :class="selectedEmbedding === model.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'"
                ></div>
              </div>
              <p class="text-xs text-gray-600 mb-2">{{ model.description }}</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {{ model.dimensions }}维
                </span>
                <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  批次{{ model.maxBatchSize }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">向量维度信息</h2>
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-xl font-bold text-purple-600">{{ embeddingModels.find(m => m.id === selectedEmbedding)?.dimensions || 768 }}</div>
                <div class="text-xs text-gray-500">向量维度</div>
              </div>
              <div>
                <div class="text-xl font-bold text-purple-600">{{ embeddingModels.find(m => m.id === selectedEmbedding)?.contextLength || '8K' }}</div>
                <div class="text-xs text-gray-500">最大上下文</div>
              </div>
              <div>
                <div class="text-xl font-bold text-purple-600">{{ embeddingModels.find(m => m.id === selectedEmbedding)?.maxBatchSize || 32 }}</div>
                <div class="text-xs text-gray-500">批处理</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Retrieval Configuration -->
      <div v-if="activeTab === 'retrieval'" class="space-y-4">
        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">检索参数</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Top K</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="retrievalTopK"
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ retrievalTopK }}</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">相似度阈值</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="retrievalScoreThreshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ retrievalScoreThreshold }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">混合检索</h2>
          <div class="flex items-center gap-2 mb-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="enableHybridSearch"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700">启用混合检索</span>
            </label>
          </div>
          <div v-if="enableHybridSearch" class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">BM25权重</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="hybridBM25Weight"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ hybridBM25Weight }}</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">向量权重</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="hybridVectorWeight"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="flex-1"
                />
                <span class="w-8 text-center font-mono text-sm">{{ hybridVectorWeight }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="enableRerank"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <span class="text-sm font-medium text-gray-700">启用重排序</span>
          </label>
          <p class="text-xs text-gray-500 mt-2">
            启用后对检索结果进行二次排序，提高精度
          </p>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div v-if="activeTab === 'advanced'" class="space-y-4">
        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">文本分段</h2>
          <p class="text-xs text-gray-500 mb-3">
            配置知识库文本分段策略，支持父子分段以提高检索精度
          </p>
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">父段落</label>
              <input
                v-model.number="chunkParentSize"
                type="number"
                min="500"
                max="5000"
                step="100"
                class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">子段落</label>
              <input
                v-model.number="chunkChildSize"
                type="number"
                min="100"
                max="1000"
                step="50"
                class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">重叠</label>
              <input
                v-model.number="chunkOverlap"
                type="number"
                min="0"
                max="500"
                step="10"
                class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="text-base font-semibold text-gray-900 mb-3">API配置</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">ModelScope API Token</label>
              <input
                v-model="apiToken"
                type="password"
                placeholder="输入API Token"
                class="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              @click="testConnection('API')"
              class="px-4 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
            >
              测试连接
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
