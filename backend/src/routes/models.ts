/**
 * Model Configuration API Routes
 */

import { LLM_MODELS, EMBEDDING_MODELS, getModelScopeClient } from '../modelscope/client.js'

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
  chunking: {
    parentChunkSize: 1500,
    childChunkSize: 400,
    chunkOverlap: 100,
  },
}

export async function registerModelsRoutes(fastify: any) {
  // Get available models — fetch from ModelScope API, fallback to hardcoded list
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
    return modelConfig
  })

  // Update LLM configuration — accepts both `selected` and `modelId`
  fastify.put('/api/v1/models/llm', async (request: any, _reply: any) => {
    const body = request.body as any
    const selected = body.selected || body.modelId
    if (selected) modelConfig.llm.selected = selected
    if (body.temperature !== undefined) modelConfig.llm.temperature = body.temperature
    if (body.maxTokens !== undefined) modelConfig.llm.maxTokens = body.maxTokens
    if (body.topP !== undefined) modelConfig.llm.topP = body.topP
    return modelConfig.llm
  })

  // Update Embedding configuration — accepts both `selected` and `modelId`
  fastify.put('/api/v1/models/embedding', async (request: any, _reply: any) => {
    const body = request.body as any
    const selected = body.selected || body.modelId
    if (selected) modelConfig.embedding.selected = selected
    return modelConfig.embedding
  })

  // Update Retrieval configuration
  fastify.put('/api/v1/models/retrieval', async (request: any, _reply: any) => {
    modelConfig.retrieval = { ...modelConfig.retrieval, ...request.body }
    return modelConfig.retrieval
  })

  // Update Chunking configuration
  fastify.put('/api/v1/models/chunking', async (request: any, _reply: any) => {
    modelConfig.chunking = { ...modelConfig.chunking, ...request.body }
    return modelConfig.chunking
  })

  // Reset to defaults
  fastify.post('/api/v1/models/reset', async (_request: any, _reply: any) => {
    modelConfig.llm = { selected: 'Qwen/Qwen3-8B', temperature: 0.7, maxTokens: 4096, topP: 0.9 }
    modelConfig.embedding = { selected: 'Qwen/Qwen3-Embedding-8B' }
    modelConfig.retrieval = { topK: 5, scoreThreshold: 0.3, enableHybridSearch: true, hybridBM25Weight: 0.4, hybridVectorWeight: 0.6, enableRerank: true }
    modelConfig.chunking = { parentChunkSize: 1500, childChunkSize: 400, chunkOverlap: 100 }
    return { success: true, message: 'Configuration reset to defaults' }
  })

  // Test model connection — actually calls the API
  fastify.post('/api/v1/models/test', async (request: any, _reply: any) => {
    const { modelId } = request.body as { modelId?: string }
    const client = getModelScopeClient()

    if (!client.isConfigured()) {
      return { success: false, message: 'ModelScope API 未配置，请在 .env 中设置 MODELSCOPE_TOKEN' }
    }

    const testId = modelId || modelConfig.llm.selected
    const isEmbedding = testId.toLowerCase().includes('embedding') || testId.toLowerCase().includes('embed')
    const start = Date.now()

    try {
      if (isEmbedding) {
        await client.getEmbedding('测试', testId)
      } else {
        await client.chatCompletion({
          model: testId,
          messages: [{ role: 'user', content: '你好' }],
          maxTokens: 10,
        })
      }
      return { success: true, message: `模型 ${testId} 连接成功`, latency: Date.now() - start }
    } catch (error: any) {
      return { success: false, message: `连接失败: ${error.message}`, latency: Date.now() - start }
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
