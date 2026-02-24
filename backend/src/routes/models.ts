/**
 * Model Configuration API Routes
 */

import { LLM_MODELS, EMBEDDING_MODELS, getModelScopeClient } from '../modelscope/client.js'
import { config as appConfig } from '../config.js'

// Runtime overrides (in-memory, reset on restart)
const runtimeOverrides: { apiKey?: string; apiUrl?: string } = {}

// Per-module model config
const moduleModels: Record<string, string> = {
  chat:       'Qwen/Qwen3-235B-A22B',
  menu:       'Qwen/Qwen3-235B-A22B',
  healthChat: 'Qwen/Qwen3-Next-80B-A3B-Instruct',
  scan:       'Qwen/Qwen3-VL-235B-A22B-Instruct',
}

// Model configuration storage
const modelConfig = {
  llm: {
    selected: 'Qwen/Qwen3-235B-A22B',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9,
  },
  embedding: {
    selected: 'Qwen/Qwen3-Embedding-8B',
  },
  retrieval: {
    topK: 5,
    scoreThreshold: 0.3,
    enableHybridSearch: true,
    hybridBM25Weight: 0.4,
    hybridVectorWeight: 0.6,
    enableRerank: true,
  },
}

/** Get the effective API key (runtime override > env) */
export function getEffectiveApiKey(): string {
  return runtimeOverrides.apiKey || appConfig.modelScopeToken
}

/** Get the effective API URL (runtime override > env) */
export function getEffectiveApiUrl(): string {
  return runtimeOverrides.apiUrl || appConfig.modelScopeApiUrl
}

/** Get model for a specific module */
export function getModuleModel(module: string): string {
  return moduleModels[module] || modelConfig.llm.selected
}

export async function registerModelsRoutes(fastify: any) {
  // Get available models
  fastify.get('/api/v1/models/available', async (_request: any, _reply: any) => {
    const client = getModelScopeClient()
    if (client.isConfigured()) {
      const models = await client.fetchAvailableModels()
      return { ...models, tokenConfigured: true }
    }
    return { llm: LLM_MODELS, embedding: EMBEDDING_MODELS, tokenConfigured: false }
  })

  // Get current configuration
  fastify.get('/api/v1/models/config', async (_request: any, _reply: any) => {
    return {
      ...modelConfig,
      modules: { ...moduleModels },
      api: {
        url: getEffectiveApiUrl(),
        keyConfigured: !!getEffectiveApiKey(),
        keyMasked: getEffectiveApiKey() ? '••••••••' + getEffectiveApiKey().slice(-4) : '',
      },
    }
  })

  // Update API settings
  fastify.put('/api/v1/models/api', async (request: any, _reply: any) => {
    const { apiKey, apiUrl } = request.body as { apiKey?: string; apiUrl?: string }
    if (apiKey !== undefined && apiKey !== '') runtimeOverrides.apiKey = apiKey
    if (apiUrl !== undefined && apiUrl !== '') runtimeOverrides.apiUrl = apiUrl
    return { success: true, keyConfigured: !!getEffectiveApiKey(), url: getEffectiveApiUrl() }
  })

  // Update per-module model
  fastify.put('/api/v1/models/module', async (request: any, _reply: any) => {
    const { module, modelId } = request.body as { module: string; modelId: string }
    if (module && modelId && module in moduleModels) moduleModels[module] = modelId
    return { success: true, modules: { ...moduleModels } }
  })

  // Update LLM configuration
  fastify.put('/api/v1/models/llm', async (request: any, _reply: any) => {
    const body = request.body as any
    const selected = body.selected || body.modelId
    if (selected) {
      modelConfig.llm.selected = selected
      moduleModels.chat = selected
      moduleModels.menu = selected
    }
    if (body.temperature !== undefined) modelConfig.llm.temperature = body.temperature
    if (body.maxTokens !== undefined) modelConfig.llm.maxTokens = body.maxTokens
    if (body.topP !== undefined) modelConfig.llm.topP = body.topP
    return modelConfig.llm
  })

  // Update Embedding configuration
  fastify.put('/api/v1/models/embedding', async (request: any, _reply: any) => {
    const body = request.body as any
    const selected = body.selected || body.modelId
    if (selected) modelConfig.embedding.selected = selected
    return modelConfig.embedding
  })

  // Reset to defaults
  fastify.post('/api/v1/models/reset', async (_request: any, _reply: any) => {
    modelConfig.llm = { selected: 'Qwen/Qwen3-235B-A22B', temperature: 0.7, maxTokens: 4096, topP: 0.9 }
    modelConfig.embedding = { selected: 'Qwen/Qwen3-Embedding-8B' }
    moduleModels.chat = 'Qwen/Qwen3-235B-A22B'
    moduleModels.menu = 'Qwen/Qwen3-235B-A22B'
    moduleModels.healthChat = 'Qwen/Qwen3-Next-80B-A3B-Instruct'
    moduleModels.scan = 'Qwen/Qwen3-VL-235B-A22B-Instruct'
    return { success: true }
  })

  // Test model connection
  fastify.post('/api/v1/models/test', async (request: any, _reply: any) => {
    const { modelId } = request.body as { modelId?: string }
    const apiKey = getEffectiveApiKey()
    const apiUrl = getEffectiveApiUrl()
    if (!apiKey) return { success: false, message: '未配置 API Key' }
    const testId = modelId || modelConfig.llm.selected
    const isEmbedding = testId.toLowerCase().includes('embedding')
    const start = Date.now()
    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      if (isEmbedding) {
        const res = await fetch(`${apiUrl}/embeddings`, {
          method: 'POST', headers,
          body: JSON.stringify({ model: testId, input: '测试' }),
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        const res = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST', headers,
          body: JSON.stringify({ model: testId, messages: [{ role: 'user', content: '你好' }], max_tokens: 5 }),
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      return { success: true, message: `连接成功 (${Date.now() - start}ms)` }
    } catch (error: any) {
      return { success: false, message: `连接失败: ${error.message}` }
    }
  })

  // Get model info
  fastify.get('/api/v1/models/info/:modelId', async (request: any, reply: any) => {
    const { modelId } = request.params
    const llmModel = LLM_MODELS.find(m => m.id === modelId)
    if (llmModel) return { ...llmModel, type: 'llm' }
    const embeddingModel = EMBEDDING_MODELS.find(m => m.id === modelId)
    if (embeddingModel) return { ...embeddingModel, type: 'embedding' }
    return reply.status(404).send({ error: 'Model not found' })
  })
}
