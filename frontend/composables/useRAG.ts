/**
 * RAG (Retrieval Augmented Generation) Composable
 *
 * Provides RAG search functionality with hybrid retrieval
 * BM25 + Vector search with hierarchical chunking
 */

export interface RAGConfig {
  topK?: number
  scoreThreshold?: number
  enableHybridSearch?: boolean
  hybridBM25Weight?: number
  hybridVectorWeight?: number
  enableRerank?: boolean
}

export interface RAGQuery {
  query: string
  category?: string
  filters?: Record<string, any>
  context?: Record<string, any>
}

export interface RAGSource {
  id: string
  title: string
  content: string
  category: string
  source: string
  score: number
}

export interface RAGResponse {
  answer: string
  sources: RAGSource[]
  metadata: {
    retrievalTime: number
    totalChunks: number
    modelUsed: string
  }
}

// Default configuration
const defaultConfig: RAGConfig = {
  topK: 5,
  scoreThreshold: 0.3,
  enableHybridSearch: true,
  hybridBM25Weight: 0.4,
  hybridVectorWeight: 0.6,
  enableRerank: true,
}

export function useRAG() {
  const config = ref<RAGConfig>({ ...defaultConfig })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Perform RAG query
   */
  const query = async (params: RAGQuery): Promise<RAGResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const startTime = Date.now()

      const response = await $fetch<{
        answer: string
        sources: RAGSource[]
        retrieval_time: number
        total_chunks: number
        model_used: string
      }>('/api/v1/rag/query', {
        method: 'POST',
        body: {
          query: params.query,
          category: params.category,
          filters: params.filters,
          context: params.context,
          top_k: config.value.topK,
          score_threshold: config.value.scoreThreshold,
          enable_hybrid_search: config.value.enableHybridSearch,
          hybrid_bm25_weight: config.value.hybridBM25Weight,
          hybrid_vector_weight: config.value.hybridVectorWeight,
          enable_rerank: config.value.enableRerank,
        },
      })

      return {
        answer: response.answer,
        sources: response.sources.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          category: s.category,
          source: s.source,
          score: s.score,
        })),
        metadata: {
          retrievalTime: response.retrieval_time,
          totalChunks: response.total_chunks,
          modelUsed: response.model_used,
        },
      }
    }
    catch (e: any) {
      error.value = e.message || 'RAG查询失败'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Quick query with category
   */
  const queryCategory = async (query: string, category: string): Promise<RAGResponse> => {
    return query({ query, category })
  }

  /**
   * Get knowledge categories
   */
  const getCategories = async (): Promise<{ id: string; name: string; count: number }[]> => {
    try {
      const response = await $fetch<{ categories: { name: string; count: number }[] }>('/api/v1/rag/categories')
      return response.categories.map(c => ({
        id: c.name,
        name: c.name,
        count: c.count,
      }))
    }
    catch {
      return []
    }
  }

  /**
   * Get knowledge base statistics
   */
  const getStats = async (): Promise<{
    totalDocuments: number
    totalChunks: number
    lastUpdated: string
  }> => {
    try {
      const response = await $fetch<{
        total_documents: number
        total_chunks: number
        last_updated: string
      }>('/api/v1/rag/stats')
      return {
        totalDocuments: response.total_documents,
        totalChunks: response.total_chunks,
        lastUpdated: response.last_updated,
      }
    }
    catch {
      return {
        totalDocuments: 0,
        totalChunks: 0,
        lastUpdated: '',
      }
    }
  }

  /**
   * Update configuration
   */
  const updateConfig = (newConfig: Partial<RAGConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * Reset to defaults
   */
  const resetConfig = () => {
    config.value = { ...defaultConfig }
  }

  return {
    // State
    config: readonly(config),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    query,
    queryCategory,
    getCategories,
    getStats,
    updateConfig,
    resetConfig,
  }
}
