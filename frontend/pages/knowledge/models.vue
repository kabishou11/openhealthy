<script setup lang="ts">
import { useModelsAPI } from '~/composables/useModels'
import { useAuthGuard } from '~/composables/useAuthGuard'

useSeoMeta({ title: '模型配置 - NutriMind' })

useAuthGuard() // require login

const { getAvailableModels, getModelConfig, updateLLMModel, updateEmbeddingModel, testModel } = useModelsAPI()

const loading = ref(true)
const saving = ref<string | null>(null)
const testing = ref<string | null>(null)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const saveMsg = ref('')

const llmModels = ref<any[]>([])
const embeddingModels = ref<any[]>([])
const vlModels = computed(() => llmModels.value.filter(m =>
  m.id.toLowerCase().includes('vl') || m.id.toLowerCase().includes('vision')
))

const cfg = ref({
  llm: 'Qwen/Qwen3-235B-A22B',
  embedding: 'Qwen/Qwen3-Embedding-8B',
  apiUrl: 'https://api-inference.modelscope.cn/v1',
  keyConfigured: false,
  keyMasked: '',
  modules: {
    chat: 'Qwen/Qwen3-235B-A22B',
    menu: 'Qwen/Qwen3-235B-A22B',
    healthChat: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
    scan: 'Qwen/Qwen3-VL-235B-A22B-Instruct',
  } as Record<string, string>,
})

const showKey = ref(false)
const editingKey = ref(false)
const newKey = ref('')
const newUrl = ref('')

const moduleLabels: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  chat:       { label: '智能问答', desc: '知识库问答对话', icon: '💬', color: 'violet' },
  menu:       { label: '餐单生成', desc: '个性化餐单规划', icon: '🍽️', color: 'emerald' },
  healthChat: { label: 'AI 医生对话', desc: '体检报告分析对话', icon: '🏥', color: 'blue' },
  scan:       { label: '体检报告扫描', desc: '图片 OCR + 数据提取（需 VL 模型）', icon: '📷', color: 'amber' },
}

const loadData = async () => {
  loading.value = true
  try {
    const [models, config] = await Promise.all([getAvailableModels(), getModelConfig()])
    llmModels.value = models.llm || []
    embeddingModels.value = models.embedding || []
    if (config) {
      cfg.value.llm = config.llm?.selected || cfg.value.llm
      cfg.value.embedding = config.embedding?.selected || cfg.value.embedding
      cfg.value.apiUrl = config.api?.url || cfg.value.apiUrl
      cfg.value.keyConfigured = config.api?.keyConfigured || false
      cfg.value.keyMasked = config.api?.keyMasked || ''
      if (config.modules) cfg.value.modules = { ...cfg.value.modules, ...config.modules }
      newUrl.value = config.api?.url || cfg.value.apiUrl
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const saveApiSettings = async () => {
  saving.value = 'api'
  try {
    await fetch('/api/v1/models/api', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: newKey.value || undefined, apiUrl: newUrl.value || undefined }),
    })
    cfg.value.apiUrl = newUrl.value
    if (newKey.value) {
      cfg.value.keyConfigured = true
      cfg.value.keyMasked = '••••••••' + newKey.value.slice(-4)
      newKey.value = ''
    }
    editingKey.value = false
    flash('凭证已保存')
  } finally { saving.value = null }
}

const saveModule = async (module: string, modelId: string) => {
  saving.value = module
  try {
    await fetch('/api/v1/models/module', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, modelId }),
    })
    cfg.value.modules[module] = modelId
    flash(`${moduleLabels[module]?.label} 已更新`)
  } finally { saving.value = null }
}

const selectEmbedding = async (id: string) => {
  saving.value = 'emb'
  try { await updateEmbeddingModel(id); cfg.value.embedding = id } finally { saving.value = null }
}

const runTest = async (modelId: string) => {
  testing.value = modelId
  testResult.value = null
  try { testResult.value = await testModel(modelId) }
  catch (e: any) { testResult.value = { success: false, message: e.message } }
  finally { testing.value = null }
}

const flash = (msg: string) => {
  saveMsg.value = msg
  setTimeout(() => saveMsg.value = '', 2500)
}

// Models for scan should only show VL models; others show all LLM
const modelsForModule = (module: string) => {
  if (module === 'scan') return [...vlModels.value, ...llmModels.value.filter(m => !vlModels.value.includes(m))]
  return llmModels.value.filter(m => !m.id.toLowerCase().includes('vl') || module === 'scan')
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">

    <!-- Header -->
    <div class="bg-white border-b border-gray-100 shadow-sm">
      <div class="container mx-auto px-4 py-5 max-w-3xl flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">模型配置</h1>
          <p class="text-sm text-gray-400 mt-0.5">统一管理 API Key、各功能模型选择与接口地址</p>
        </div>
        <Transition name="fade">
          <div v-if="saveMsg" class="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ saveMsg }}
          </div>
        </Transition>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6 max-w-3xl space-y-4">

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>

        <!-- API 凭证 -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <div class="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-800">API 凭证</p>
              <p class="text-xs text-gray-400">所有功能共用同一套 Key 和接口地址</p>
            </div>
            <span v-if="cfg.keyConfigured" class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full font-medium">
              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>已配置
            </span>
            <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full font-medium">
              <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>未配置
            </span>
          </div>
          <div class="p-5 space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">API 地址</label>
              <input v-model="newUrl" type="text" placeholder="https://api-inference.modelscope.cn/v1"
                class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
              <div v-if="!editingKey && cfg.keyConfigured" class="flex items-center gap-2">
                <div class="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 font-mono text-gray-500">{{ cfg.keyMasked }}</div>
                <button @click="editingKey = true" class="px-3 py-2 text-xs text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50">修改</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <input v-model="newKey" :type="showKey ? 'text' : 'password'" placeholder="输入 API Key（留空保持不变）"
                  class="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"/>
                <button @click="showKey = !showKey" class="p-2 text-gray-400 hover:text-gray-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1">从 <a href="https://www.modelscope.cn/my/token" target="_blank" class="text-indigo-500 hover:underline">modelscope.cn/my/token</a> 获取</p>
            </div>
            <div class="flex items-center justify-between pt-1">
              <button @click="runTest(cfg.modules.chat)" :disabled="!!testing"
                class="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
              <button @click="saveApiSettings" :disabled="saving === 'api'"
                class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50 transition-colors">
                {{ saving === 'api' ? '保存中...' : '保存凭证' }}
              </button>
            </div>
            <div v-if="testResult" class="px-3 py-2 rounded-xl text-xs"
              :class="testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'">
              {{ testResult.message }}
            </div>
          </div>
        </div>

        <!-- 各功能模块模型 -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-50">
            <p class="text-sm font-semibold text-gray-800">各功能模型</p>
            <p class="text-xs text-gray-400 mt-0.5">为每个功能单独选择最合适的模型</p>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="(meta, key) in moduleLabels" :key="key" class="px-5 py-4 flex items-center gap-4">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                :class="{
                  'bg-violet-50': meta.color === 'violet',
                  'bg-emerald-50': meta.color === 'emerald',
                  'bg-blue-50': meta.color === 'blue',
                  'bg-amber-50': meta.color === 'amber',
                }">
                {{ meta.icon }}
              </div>
              <div class="w-28 flex-shrink-0">
                <p class="text-sm font-medium text-gray-800">{{ meta.label }}</p>
                <p class="text-xs text-gray-400 leading-tight">{{ meta.desc }}</p>
              </div>
              <select
                :value="cfg.modules[key]"
                @change="saveModule(key, ($event.target as HTMLSelectElement).value)"
                :disabled="saving === key"
                class="flex-1 text-xs border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:opacity-60 min-w-0"
              >
                <optgroup v-for="provider in [...new Set(modelsForModule(key).map(m => m.provider))]" :key="provider" :label="provider">
                  <option v-for="m in modelsForModule(key).filter(m => m.provider === provider)" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </option>
                </optgroup>
              </select>
              <div v-if="saving === key" class="text-xs text-indigo-500 flex-shrink-0">保存...</div>
            </div>
          </div>
        </div>

        <!-- Embedding -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <div class="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Embedding 模型</p>
              <p class="text-xs text-gray-400">用于语义搜索与知识库检索</p>
            </div>
            <span v-if="saving === 'emb'" class="ml-auto text-xs text-sky-500">保存中...</span>
          </div>
          <div class="p-5">
            <select v-model="cfg.embedding" @change="selectEmbedding(cfg.embedding)"
              class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
              <option v-for="m in embeddingModels" :key="m.id" :value="m.id">
                {{ m.name }}{{ m.dimensions ? ' · ' + m.dimensions + 'd' : '' }} · {{ m.provider }}
              </option>
            </select>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
