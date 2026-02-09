<script setup lang="ts">
import { marked } from 'marked'

useSeoMeta({
  title: '智能问答 - NutriMind',
  description: '基于知识库的智能营养问答',
})

// Knowledge categories
const categories = [
  { id: 'nutrition', name: '营养知识', icon: '🥗' },
  { id: 'diabetes', name: '糖尿病', icon: '🍬' },
  { id: 'hypertension', name: '高血压', icon: '❤️' },
  { id: 'fatty_liver', name: '脂肪肝', icon: '🫁' },
  { id: 'tcm', name: '中医食疗', icon: '🌿' },
  { id: 'gout', name: '痛风', icon: '🦶' },
  { id: 'pregnancy', name: '孕期', icon: '🤰' },
  { id: 'weight_loss', name: '减脂', icon: '⚡' },
]

// Default models (will be fetched from backend)
const defaultModels = [
  { id: 'moonshotai/Kimi-K2.5', name: 'Kimi K2.5', provider: 'ModelScope', contextLength: '128K' },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B', provider: 'ModelScope', contextLength: '32K' },
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B', provider: 'ModelScope', contextLength: '128K' },
  { id: '01-ai/Yi-1.5-34B-Chat', name: 'Yi-1.5-34B', provider: '01.AI', contextLength: '32K' },
]

const models = ref(defaultModels)
const selectedModel = ref(defaultModels[0].id)
const isModelsLoading = ref(false)
const modelsError = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const newMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  timestamp: Date
}

const messages = ref<Message[]>([
  {
    id: 'welcome',
    role: 'assistant',
    content: '您好！我是 NutriMind 智能营养助手 👋\n\n我可以帮您解答：\n- 疾病饮食注意事项\n- 中医食疗建议\n- 营养搭配指导\n- 健康生活方式\n\n请直接输入您的问题。',
    timestamp: new Date(),
  },
])

// Fetch available models from backend
const fetchModels = async () => {
  isModelsLoading.value = true
  modelsError.value = null

  try {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001/api/v1'

    const response = await fetch(`${apiBase}/models/available`)
    if (response.ok) {
      const data = await response.json()
      if (data.llm && data.llm.length > 0) {
        models.value = data.llm
        selectedModel.value = models.value[0].id
      }
    }
    else {
      modelsError.value = '获取模型列表失败，使用默认模型'
    }
  }
  catch (e) {
    console.log('Using default models')
    modelsError.value = '无法连接到后端服务，使用默认模型'
  }
  finally {
    isModelsLoading.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const renderMarkdown = (text: string) => {
  return marked(text)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return

  const userMessage = newMessage.value.trim()
  newMessage.value = ''

  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  })

  isLoading.value = true
  scrollToBottom()

  try {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase || 'http://localhost:3001/api/v1'

    let responseContent = ''

    // Try backend API
    try {
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel.value,
          history: messages.value.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        responseContent = data.response || data.message || '抱歉，我没有理解您的问题。'
      }
      else {
        throw new Error('API request failed')
      }
    }
    catch {
      // Fallback to demo mode
      responseContent = getDemoResponse(userMessage)
    }

    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      model: selectedModel.value,
      timestamp: new Date(),
    })
  }
  catch (error) {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '抱歉，我遇到了一些问题。请稍后再试。',
      timestamp: new Date(),
    })
  }
  finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const getDemoResponse = (query: string): string => {
  const lower = query.toLowerCase()

  if (lower.includes('糖尿病') || lower.includes('血糖')) {
    return `**糖尿病饮食建议**\n\n1. **控制总热量**：根据体重计算每日所需热量\n2. **选择低GI食物**：糙米、燕麦、红薯\n3. **均衡营养**：碳水45-60%，蛋白质15-20%\n4. **定时定量**：规律进餐\n\n**推荐食物**：\n- 主食：糙米、荞麦、燕麦\n- 蔬菜：西兰花、菠菜、芹菜\n- 蛋白质：鱼、豆腐、鸡胸肉\n\n**禁忌**：白米、白面包、糖果、甜饮料`
  }

  if (lower.includes('高血压') || lower.includes('降压')) {
    return `**高血压饮食建议**\n\n1. **低盐饮食**：每日盐<5g\n2. **多吃蔬果**：富含钾元素\n3. **控制脂肪**：选择不饱和脂肪酸\n4. **限酒**\n\n**推荐食物**：\n- 芹菜、菠菜、西红柿\n- 香蕉、橙子\n- 深海鱼、坚果\n\n**注意**：遵医嘱服药，定期监测血压`
  }

  if (lower.includes('减脂') || lower.includes('减肥') || lower.includes('瘦身')) {
    return `**减脂饮食建议**\n\n1. **控制热量**：比日常低300-500kcal\n2. **高蛋白**：每餐25-30g蛋白质\n3. **低GI主食**：糙米、燕麦、红薯\n4. **多喝水**：每天2000ml以上\n5. **少食多餐**：4-5餐/天\n\n**运动建议**：有氧+力量训练结合`
  }

  if (lower.includes('你好') || lower.includes('hi')) {
    return '您好！我是 NutriMind 智能营养助手。请问有什么营养健康问题我可以帮您解答？'
  }

  return `关于"**${query}**"，根据营养学建议：\n\n**饮食建议**：\n- 保持均衡饮食\n- 多吃蔬菜水果\n- 适量优质蛋白\n\n**注意事项**：\n- 具体方案请提供更多健康信息\n- 如有疾病请遵医嘱`
}

const quickQuestions = [
  '糖尿病应该怎么吃？',
  '高血压饮食禁忌',
  '减脂怎么吃有效',
  '脂肪肝如何调理',
  '痛风不能吃什么',
  '孕期营养补充',
]

const useQuickQuestion = (q: string) => {
  newMessage.value = q
}

const selectCategory = (id: string) => {
  selectedCategory.value = selectedCategory.value === id ? null : id
}

onMounted(() => {
  fetchModels()
  scrollToBottom()
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex bg-gray-50">
    <!-- 左侧分类边栏 -->
    <div class="w-48 bg-white border-r border-gray-200 p-3 hidden md:block overflow-y-auto">
      <h3 class="text-xs font-medium text-gray-500 uppercase mb-2 px-2">知识分类</h3>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectCategory(cat.id)"
        class="w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-all"
        :class="selectedCategory === cat.id
          ? 'bg-emerald-100 text-emerald-700'
          : 'hover:bg-gray-100 text-gray-600'"
      >
        <span class="mr-2">{{ cat.icon }}</span>
        {{ cat.name }}
      </button>
    </div>

    <!-- 右侧对话区 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部模型选择栏 -->
      <div class="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">模型:</span>
          <select
            v-model="selectedModel"
            class="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            :disabled="isModelsLoading"
          >
            <option v-for="m in models" :key="m.id" :value="m.id">
              {{ m.name }} ({{ m.provider }})
            </option>
          </select>
          <!-- 加载状态 -->
          <span v-if="isModelsLoading" class="text-xs text-gray-400">
            <svg class="w-4 h-4 animate-spin inline" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            加载中...
          </span>
        </div>
        <NuxtLink to="/knowledge/models" class="text-xs text-emerald-600 hover:text-emerald-700">
          配置模型 →
        </NuxtLink>
      </div>

      <!-- 对话区域 -->
      <div
        ref="chatContainer"
        class="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div class="max-w-2xl mx-auto">
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex gap-3"
            :class="message.role === 'user' ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="message.role === 'user' ? 'bg-gray-400' : 'bg-emerald-500'"
            >
              <svg v-if="message.role === 'user'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            <!-- Message Bubble -->
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2"
              :class="message.role === 'user'
                ? 'bg-emerald-500 text-white rounded-br-sm'
                : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'"
            >
              <!-- Model indicator for assistant messages -->
              <div v-if="message.role === 'assistant' && message.model" class="mb-1 pb-1 border-b border-gray-100">
                <span class="text-xs text-gray-400 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ models.find(m => m.id === message.model)?.name || message.model }}
                </span>
              </div>
              <div
                class="prose prose-sm max-w-none leading-relaxed"
                :class="message.role === 'user' ? 'text-white' : 'text-gray-800'"
                v-html="renderMarkdown(message.content)"
              ></div>
              <p
                class="text-xs mt-1"
                :class="message.role === 'user' ? 'text-emerald-100' : 'text-gray-400'"
              >
                {{ new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
            <div class="bg-white rounded-2xl px-4 py-2 shadow-sm">
              <span class="text-sm text-gray-500">思考中...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div v-if="messages.length <= 2" class="bg-white border-t border-gray-100 px-4 py-2">
        <div class="max-w-2xl mx-auto">
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="q in quickQuestions"
              :key="q"
              @click="useQuickQuestion(q)"
              class="px-3 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 rounded-full text-xs transition-colors"
            >
              {{ q }}
            </button>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="bg-white border-t border-gray-200 px-4 py-3">
        <div class="max-w-2xl mx-auto">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="输入营养健康问题..."
              class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              :disabled="isLoading"
            />
            <button
              type="submit"
              class="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!newMessage.trim() || isLoading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose {
  --tw-prose-body: inherit;
  --tw-prose-headings: inherit;
  --tw-prose-links: inherit;
  --tw-prose-bold: inherit;
  --tw-prose-quotes: inherit;
  --tw-prose-code: inherit;
  --tw-prose-pre-bg: transparent;
}

.prose p {
  margin: 0.5em 0;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}

.prose ul, .prose ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.prose li {
  margin: 0.25em 0;
}

.prose strong {
  font-weight: 600;
}
</style>
