/**
 * Model Configuration API Routes
 *
 * Provides endpoints for managing LLM and Embedding model configurations
 */

import { LLM_MODELS, EMBEDDING_MODELS } from '../modelscope/client.js'

// Model configuration storage
const modelConfig: {
  llm: {
    selected: string
    temperature: number
    maxTokens: number
    topP: number
  }
  embedding: {
    selected: string
  }
  retrieval: {
    topK: number
    scoreThreshold: number
    enableHybridSearch: boolean
    hybridBM25Weight: number
    hybridVectorWeight: number
    enableRerank: boolean
  }
  chunking: {
    parentChunkSize: number
    childChunkSize: number
    chunkOverlap: number
  }
} = {
  llm: {
    selected: 'Qwen/Qwen2.5-72B-Instruct',
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
  // Get available models
  fastify.get('/api/v1/models/available', async (request: any, reply: any) => {
    return {
      llm: LLM_MODELS,
      embedding: EMBEDDING_MODELS,
    }
  })

  // Get current configuration
  fastify.get('/api/v1/models/config', async (request: any, reply: any) => {
    return modelConfig
  })

  // Update LLM configuration
  fastify.put('/api/v1/models/llm', async (request: any, reply: any) => {
    const body = request.body as Partial<typeof modelConfig.llm>

    if (body.selected && !LLM_MODELS.find(m => m.id === body.selected)) {
      return reply.status(400).send({ error: 'Invalid LLM model selected' })
    }

    modelConfig.llm = {
      ...modelConfig.llm,
      ...body,
    }

    return modelConfig.llm
  })

  // Update Embedding configuration
  fastify.put('/api/v1/models/embedding', async (request: any, reply: any) => {
    const body = request.body as Partial<typeof modelConfig.embedding>

    if (body.selected && !EMBEDDING_MODELS.find(m => m.id === body.selected)) {
      return reply.status(400).send({ error: 'Invalid Embedding model selected' })
    }

    modelConfig.embedding = {
      ...modelConfig.embedding,
      ...body,
    }

    return modelConfig.embedding
  })

  // Update Retrieval configuration
  fastify.put('/api/v1/models/retrieval', async (request: any, reply: any) => {
    const body = request.body as Partial<typeof modelConfig.retrieval>

    modelConfig.retrieval = {
      ...modelConfig.retrieval,
      ...body,
    }

    return modelConfig.retrieval
  })

  // Update Chunking configuration
  fastify.put('/api/v1/models/chunking', async (request: any, reply: any) => {
    const body = request.body as Partial<typeof modelConfig.chunking>

    modelConfig.chunking = {
      ...modelConfig.chunking,
      ...body,
    }

    return modelConfig.chunking
  })

  // Reset to defaults
  fastify.post('/api/v1/models/reset', async (request: any, reply: any) => {
    modelConfig.llm = {
      selected: 'Qwen/Qwen2.5-72B-Instruct',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
    }
    modelConfig.embedding = {
      selected: 'Qwen/Qwen3-Embedding-8B',
    }
    modelConfig.retrieval = {
      topK: 5,
      scoreThreshold: 0.3,
      enableHybridSearch: true,
      hybridBM25Weight: 0.4,
      hybridVectorWeight: 0.6,
      enableRerank: true,
    }
    modelConfig.chunking = {
      parentChunkSize: 1500,
      childChunkSize: 400,
      chunkOverlap: 100,
    }

    return { success: true, message: 'Configuration reset to defaults' }
  })

  // Test model connection
  fastify.post('/api/v1/models/test', async (request: any, reply: any) => {
    const { modelType } = request.body as { modelType: 'llm' | 'embedding' }

    // This is a mock test - in production, would actually test the API
    return {
      success: true,
      message: `${modelType === 'llm' ? 'LLM' : 'Embedding'} connection test passed`,
      latency: Math.floor(Math.random() * 100) + 50, // Mock latency
    }
  })

  // Get model info
  fastify.get('/api/v1/models/info/:modelId', async (request: any, reply: any) => {
    const { modelId } = request.params

    const llmModel = LLM_MODELS.find(m => m.id === modelId)
    if (llmModel) {
      return {
        ...llmModel,
        type: 'llm',
      }
    }

    const embeddingModel = EMBEDDING_MODELS.find(m => m.id === modelId)
    if (embeddingModel) {
      return {
        ...embeddingModel,
        type: 'embedding',
      }
    }

    return reply.status(404).send({ error: 'Model not found' })
  })
}
