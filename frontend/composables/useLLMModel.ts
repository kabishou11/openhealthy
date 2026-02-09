import { isClient } from '@vueuse/core'
import type { ChatMessage } from './useModelScope'

// Model configuration interface
export interface LLMModel {
  id: string
  name: string
  provider: string
  description?: string
  context_length?: number
  capabilities?: string[]
  isDefault?: boolean
}

// ModelScope API response types
interface ModelScopeModel {
  model_id: string
  model_name: string
  owner: string
  description?: string
  task: string
  latest_version?: {
    max_tokens?: number
  }
}

interface ModelScopeListResponse {
  models: ModelScopeModel[]
  total: number
  page: number
  page_size: number
}

export function useLLMModel() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'
  const demoMode = config.public.demoMode || false

  // Available models list - will be fetched from API
  const models = ref<LLMModel[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Currently selected model - persisted in localStorage
  const selectedModelId = useStorage<string | null>('nutrimind-selected-model', null)

  // Filtered models for display
  const chatModels = computed(() => {
    // Filter for chat/instruct models only
    return models.value.filter(m => {
      const id = m.id.toLowerCase()
      const name = m.name.toLowerCase()
      // Include chat, instruct, and general models
      return id.includes('chat') ||
             id.includes('instruct') ||
             id.includes('general') ||
             name.includes('chat') ||
             name.includes('instruct')
    })
  })

  // Group by provider
  const modelsByProvider = computed(() => {
    const grouped: Record<string, LLMModel[]> = {}
    for (const model of chatModels.value) {
      if (!grouped[model.provider]) {
        grouped[model.provider] = []
      }
      grouped[model.provider].push(model)
    }
    return grouped
  })

  // Current model info
  const currentModel = computed(() => {
    if (selectedModelId.value) {
      const model = models.value.find(m => m.id === selectedModelId.value)
      if (model)
        return model
    }
    // Default to first chat model
    return chatModels.value[0]
  })

  // Get provider info from model ID
  const getProviderFromModelId = (modelId: string): string => {
    const parts = modelId.split('/')
    if (parts.length >= 2) {
      return parts[0]
    }
    return 'Unknown'
  }

  // Format model name from ID
  const formatModelName = (modelId: string, originalName?: string): string => {
    if (originalName)
      return originalName

    const parts = modelId.split('/')
    const name = parts[parts.length - 1]
    // Remove common suffixes and format nicely
    return name
      .replace(/-instruct$/i, '')
      .replace(/-chat$/i, '')
      .replace(/_/g, ' ')
      .replace(/(\d+)b/gi, '$1B')
  }

  // Fetch models from ModelScope API
  const fetchModels = async () => {
    if (!isClient)
      return

    isLoading.value = true
    error.value = null

    try {
      // Method 1: Try direct ModelScope inference API
      try {
        const response = await fetch('https://api-inference.modelscope.cn/v1/models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data: ModelScopeListResponse = await response.json()

          if (data.models && Array.isArray(data.models)) {
            models.value = data.models
              .filter(m => {
                // Filter for chat-related models
                const id = m.model_id.toLowerCase()
                const task = m.task.toLowerCase()
                return id.includes('chat') ||
                       id.includes('instruct') ||
                       id.includes('qwen') ||
                       id.includes('yi') ||
                       id.includes('glm') ||
                       id.includes('baichuan') ||
                       id.includes('llama') ||
                       id.includes('mistral') ||
                       task.includes('chat') ||
                       task.includes('conversational')
              })
              .map((m, index) => ({
                id: m.model_id,
                name: formatModelName(m.model_id, m.model_name),
                provider: getProviderFromModelId(m.model_id),
                description: m.description,
                context_length: m.latest_version?.max_tokens,
                isDefault: index === 0,
              }))
              .slice(0, 20) // Limit to top 20 chat models

            // Auto-select first model if none selected
            if (!selectedModelId.value && chatModels.value.length > 0) {
              selectedModelId.value = chatModels.value[0].id
            }

            return
          }
        }
      }
      catch (e) {
        console.log('Direct ModelScope API not available, trying proxy...')
      }

      // Method 2: Try backend proxy
      try {
        const response = await fetch(`${apiBase}/api/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.models && Array.isArray(data.models)) {
            models.value = data.models.map((m: any) => ({
              id: m.id || m.model_id || m.model,
              name: m.name || formatModelName(m.id || m.model_id || m.model),
              provider: m.provider || getProviderFromModelId(m.id || m.model_id || m.model),
              description: m.description,
              context_length: m.context_length || m.max_tokens || m.maxContext,
              capabilities: m.capabilities,
            }))

            if (!selectedModelId.value && models.value.length > 0) {
              selectedModelId.value = models.value[0].id
            }
            return
          }
        }
      }
      catch (e) {
        console.log('Backend proxy not available')
      }

      // Method 3: Fallback to hardcoded list (should rarely happen)
      throw new Error('Unable to fetch models from any source')
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load models'

      // Set fallback models
      models.value = [
        {
          id: 'Qwen/Qwen2.5-72B-Instruct',
          name: 'Qwen 2.5 72B Instruct',
          provider: 'ModelScope',
          description: '阿里通义千问 72B 参数指令微调模型',
          context_length: 32768,
          isDefault: true,
        },
        {
          id: 'Qwen/Qwen2.5-32B-Instruct',
          name: 'Qwen 2.5 32B Instruct',
          provider: 'ModelScope',
          description: '阿里通义千问 32B 参数指令微调模型',
          context_length: 32768,
        },
        {
          id: 'Qwen/Qwen2.5-14B-Instruct',
          name: 'Qwen 2.5 14B Instruct',
          provider: 'ModelScope',
          description: '阿里通义千问 14B 参数指令微调模型',
          context_length: 32768,
        },
        {
          id: 'Qwen/Qwen2.5-7B-Instruct',
          name: 'Qwen 2.5 7B Instruct',
          provider: 'ModelScope',
          description: '阿里通义千问 7B 参数指令微调模型',
          context_length: 32768,
        },
        {
          id: '01-ai/Yi-1.5-34B-Chat',
          name: 'Yi-1.5 34B Chat',
          provider: '01-ai',
          description: '零一万物 Yi-1.5 34B 聊天模型',
          context_length: 4096,
        },
        {
          id: 'THUDM/GLM-4-9B',
          name: 'GLM-4 9B',
          provider: 'Zhipu',
          description: '智谱 GLM-4 9B 聊天模型',
          context_length: 128000,
        },
      ]

      if (!selectedModelId.value && models.value.length > 0) {
        selectedModelId.value = models.value[0].id
      }
    }
    finally {
      isLoading.value = false
    }
  }

  // Select a model
  const selectModel = (modelId: string) => {
    const model = models.value.find(m => m.id === modelId)
    if (model) {
      selectedModelId.value = modelId
    }
  }

  // Refresh models
  const refreshModels = async () => {
    await fetchModels()
  }

  // Get model by ID
  const getModel = (modelId: string) => {
    return models.value.find(m => m.id === modelId)
  }

  return {
    models,
    chatModels,
    selectedModelId,
    currentModel,
    isLoading,
    error,
    modelsByProvider,
    fetchModels,
    selectModel,
    getModel,
    refreshModels,
  }
}

// Chat state management
export function useChat() {
  const {
    selectedModelId,
    currentModel,
    getModel,
  } = useLLMModel()

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'
  const demoMode = config.public.demoMode || false

  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize with welcome message
  const initWelcome = () => {
    if (messages.value.length === 0) {
      messages.value = [{
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是 NutriMind 智能营养师助手。有什么关于营养健康的问题我可以帮助你解答吗？\n\n• 今天吃什么好？\n• 减脂应该怎么吃？\n• 有糖尿病应该注意什么？\n• 帮我制定一周餐单',
        timestamp: new Date(),
      }]
    }
  }

  // Demo responses for testing without API key
  const demoResponses: Record<string, string[]> = {
    default: [
      '这是一个演示模式回复。在 .env 文件中配置 MODELSCOPE_API_KEY 后，您将可以使用完整的 AI 对话功能。',
      '您好！我是 NutriMind 智能营养师。要使用完整功能，请配置 ModelScope API 密钥。',
    ],
    greeting: [
      '你好！很高兴为您服务。请告诉我您的饮食需求或健康问题。',
      '您好！我是 NutriMind 智能营养师助手。我可以帮助您制定餐单、分析营养成分或提供健康建议。',
    ],
    food: [
      '根据营养学建议，均衡饮食应该包括：\n\n• 主食：粗细搭配，建议糙米、燕麦等全谷物\n• 蛋白质：鱼、禽肉、蛋、豆腐等\n• 蔬菜：每天300-500克，深色蔬菜占一半\n• 水果：每天200-350克\n• 奶制品：每天300ml\n\n需要我为您推荐具体的食谱吗？',
    ],
    diet: [
      '减脂期间的饮食建议：\n\n1. 控制总热量摄入，建议比日常需求低300-500kcal\n2. 增加蛋白质摄入（每餐25-30g），有助于保持肌肉量\n3. 选择低GI主食，如糙米、燕麦、红薯\n4. 多吃蔬菜增加饱腹感\n5. 避免油炸食品、含糖饮料\n6. 少量多餐，细嚼慢咽\n\n运动方面建议结合有氧运动和力量训练。',
    ],
    menu: [
      '为您推荐一周健康餐单：\n\n**周一**\n早餐：燕麦粥+水煮蛋+牛奶\n午餐：糙米饭+清蒸鱼+西兰花\n晚餐：荞麦面+凉拌木耳\n\n**周二**\n早餐：全麦面包+豆浆+香蕉\n午餐：糙米饭+宫保鸡丁+炒菠菜\n晚餐：蔬菜沙拉+烤鸡胸\n\n需要我生成完整的周计划吗？',
    ],
    disease: [
      '针对您的健康状况，建议：\n\n• 保持规律饮食，少食多餐\n• 避免辛辣、油腻食物\n• 多吃新鲜蔬菜水果\n• 适量运动，保持心情愉悦\n• 定期体检，关注身体变化\n\n重要提示：如有任何不适，请及时就医。本AI仅提供一般性营养建议。',
    ],
  }

  const getDemoResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return demoResponses.greeting[Math.floor(Math.random() * demoResponses.greeting.length)]
    }
    if (lowerMessage.includes('吃') || lowerMessage.includes('食谱') || lowerMessage.includes('菜单')) {
      return demoResponses.food[Math.floor(Math.random() * demoResponses.food.length)]
    }
    if (lowerMessage.includes('减脂') || lowerMessage.includes('减肥') || lowerMessage.includes('瘦身')) {
      return demoResponses.diet[Math.floor(Math.random() * demoResponses.diet.length)]
    }
    if (lowerMessage.includes('餐单') || lowerMessage.includes('周计划') || lowerMessage.includes('一周')) {
      return demoResponses.menu[Math.floor(Math.random() * demoResponses.menu.length)]
    }
    if (lowerMessage.includes('脂肪肝') || lowerMessage.includes('糖尿病') || lowerMessage.includes('高血压') || lowerMessage.includes('病')) {
      return demoResponses.disease[Math.floor(Math.random() * demoResponses.disease.length)]
    }

    return demoResponses.default[Math.floor(Math.random() * demoResponses.default.length)]
  }

  // Send message to API - with backend, direct ModelScope, and demo mode fallback
  const sendMessage = async (content: string) => {
    if (isLoading.value || !content.trim())
      return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    messages.value.push(userMessage)
    isLoading.value = true
    error.value = null

    // Check if we should use demo mode
    const useDemoMode = demoMode || !import.meta.env.MODELSCOPE_API_KEY

    if (useDemoMode) {
      // Demo mode - return simulated response
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getDemoResponse(content.trim()),
        timestamp: new Date(),
      }

      messages.value.push(assistantMessage)
      isLoading.value = false
      return
    }

    try {
      // Try backend first (for proper API key handling)
      try {
        const response = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            model: selectedModelId.value,
            history: messages.value.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (response.ok) {
          const data = await response.json()

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || data.message || '抱歉，我没有理解您的问题。',
            timestamp: new Date(),
          }

          messages.value.push(assistantMessage)
          isLoading.value = false
          return
        }
      }
      catch (e) {
        console.log('Backend not available, trying direct ModelScope API...')
      }

      // Fallback: Direct ModelScope API call (OpenAI-compatible endpoint)
      const apiKey = process.env.MODELSCOPE_API_KEY || ''

      if (!apiKey) {
        // Switch to demo mode if no API key
        isLoading.value = false
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getDemoResponse(content.trim()),
          timestamp: new Date(),
        }
        messages.value.push(assistantMessage)
        return
      }

      const modelId = selectedModelId.value || currentModel.value?.id || 'Qwen/Qwen2.5-7B-Instruct'

      const response = await fetch('https://api-inference.modelscope.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: '你是 NutriMind，一个专业的智能营养师助手。你的专长是：\n1. 提供个性化的饮食建议\n2. 根据用户的身体状况推荐合适的食物\n3. 分析食物的营养成分\n4. 制定健康餐单计划\n5. 提供食疗建议\n\n请用友好、专业的语气回答用户的问题。如果涉及医疗建议，请提醒用户咨询专业医生。'
            },
            ...messages.value.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题。',
        timestamp: new Date(),
      }

      messages.value.push(assistantMessage)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'

      // Provide helpful error message
      let helpText = ''
      if (error.value.includes('API 密钥') || error.value.includes('401') || error.value.includes('403')) {
        helpText = '\n\n请在 .env 文件中设置 MODELSCOPE_API_KEY 环境变量。'
      }
      else if (error.value.includes('Failed to fetch') || error.value.includes('网络')) {
        helpText = '\n\n网络请求失败，将切换到演示模式。'
        // Switch to demo mode
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getDemoResponse(content.trim()),
          timestamp: new Date(),
        }
        messages.value.push(assistantMessage)
        isLoading.value = false
        return
      }

      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，处理消息时遇到问题：${error.value}。${helpText}`,
        timestamp: new Date(),
      })
    }
    finally {
      isLoading.value = false
    }
  }

  // Clear all messages
  const clearMessages = () => {
    messages.value = []
    initWelcome()
  }

  // Remove specific message
  const removeMessage = (id: string) => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }

  return {
    messages,
    isLoading,
    error,
    selectedModelId,
    currentModel,
    sendMessage,
    clearMessages,
    removeMessage,
    initWelcome,
    getModel,
  }
}
