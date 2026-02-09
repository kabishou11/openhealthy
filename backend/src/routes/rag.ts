/**
 * RAG API Routes
 *
 * Provides REST API endpoints for knowledge base operations
 * Note: RAG functionality is temporarily disabled pending API updates
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Query body schema
interface RAGQueryBody {
  query: string
  category?: string
  topK?: number
  context?: {
    userProfile?: {
      healthConditions?: string[]
    }
  }
}

// Add knowledge body schema
interface AddKnowledgeBody {
  id: string
  content: string
  source: string
  category: string
  metadata?: Record<string, unknown>
}

/**
 * Register RAG routes
 *
 * RAG functionality is temporarily disabled - placeholder routes
 */
export async function registerRAGRoutes(app: FastifyInstance): Promise<void> {
  // Health check
  app.get('/api/v1/rag/health', async () => {
    return {
      status: 'ok',
      initialized: false,
      message: 'RAG functionality temporarily disabled',
    }
  })

  // Get knowledge base statistics
  app.get('/api/v1/rag/stats', async () => {
    return {
      success: true,
      data: {
        totalDocuments: 0,
        categories: [],
      },
    }
  })

  // Get available categories
  app.get('/api/v1/rag/categories', async () => {
    return {
      success: true,
      data: [],
    }
  })

  // Query knowledge base (POST) - Returns placeholder
  app.post('/api/v1/rag/query', async (request, reply) => {
    return {
      success: true,
      data: {
        query: (request.body as any)?.query || '',
        results: [],
        count: 0,
      },
      message: 'RAG query temporarily unavailable',
    }
  })

  // Get knowledge by category
  app.get('/api/v1/rag/category/:category', async (request) => {
    return {
      success: true,
      data: {
        category: (request.params as any).category,
        results: [],
        count: 0,
      },
    }
  })

  // Add knowledge document - Returns success without actual storage
  app.post('/api/v1/rag/knowledge', async (request) => {
    const body = request.body as any
    return {
      success: true,
      message: 'Knowledge added (placeholder)',
      data: { id: body.id || 'unknown' },
    }
  })

  // Reinitialize knowledge base
  app.post('/api/v1/rag/reset', async () => {
    return {
      success: true,
      message: 'Knowledge base reset (placeholder)',
    }
  })
}
