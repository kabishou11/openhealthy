// Models API Composable
import { useAuthStore } from '~/stores/auth'

export interface ModelInfo {
  id: string
  name: string
  provider: string
  description?: string
  contextLength?: string
  dimensions?: number
  type?: string
  strengths?: string[]
  status?: string
}

export function useModelsAPI() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {}
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return headers
  }

  // Get available models
  const getAvailableModels = async (): Promise<{ llm: ModelInfo[]; embedding: ModelInfo[] }> => {
    const response = await fetch(`${config.public.apiBase}/models/available`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    const data = await response.json()
    return data
  }

  // Get current config
  const getModelConfig = async (): Promise<any> => {
    const response = await fetch(`${config.public.apiBase}/models/config`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch model config')
    }

    const data = await response.json()
    return data
  }

  // Update LLM model
  const updateLLMModel = async (modelId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${config.public.apiBase}/models/llm`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to update LLM model')
    }

    return response.json()
  }

  // Update Embedding model
  const updateEmbeddingModel = async (modelId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${config.public.apiBase}/models/embedding`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to update embedding model')
    }

    return response.json()
  }

  // Test model connection
  const testModel = async (modelId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${config.public.apiBase}/models/test`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to test model')
    }

    return response.json()
  }

  return {
    getAvailableModels,
    getModelConfig,
    updateLLMModel,
    updateEmbeddingModel,
    testModel,
  }
}
