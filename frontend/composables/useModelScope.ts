/**
 * ModelScope API Composable
 *
 * Provides ModelScope API integration for LLM and Embedding calls
 */

export interface ModelScopeConfig {
  baseUrl: string
  token: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finishReason: string
  }[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface EmbeddingParams {
  model: string
  input: string | string[]
  encodingFormat?: 'float' | 'base64'
}

export interface EmbeddingResponse {
  object: string
  data: {
    object: string
    embedding: number[]
    index: number
  }[]
  model: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

// Available models
export const LLM_MODELS = [
  { id: 'moonshotai/Kimi-K2.5', name: 'Kimi K2.5', provider: 'ModelScope', contextLength: '128K' },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B', provider: 'ModelScope', contextLength: '32K' },
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B', provider: 'ModelScope', contextLength: '128K' },
]

export const EMBEDDING_MODELS = [
  { id: 'Qwen/Qwen3-Embedding-8B', name: 'Qwen3-Embedding-8B', provider: 'ModelScope', dimensions: 768 },
  { id: 'BAAI/bge-large-zh', name: 'BGE Large Zh', provider: 'BAAI', dimensions: 1024 },
]

export function useModelScope() {
  const config = ref<ModelScopeConfig>({
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    token: '',
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Configure ModelScope settings
   */
  const configure = (newConfig: Partial<ModelScopeConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * Set API token
   */
  const setToken = (token: string) => {
    config.value.token = token
  }

  /**
   * Chat completion (LLM)
   */
  const chatCompletion = async (
    params: ChatCompletionParams
  ): Promise<ChatCompletionResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<ChatCompletionResponse>(
        `${config.value.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.value.token}`,
            'Content-Type': 'application/json',
          },
          body: {
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 4096,
            top_p: params.topP ?? 0.9,
            stream: params.stream ?? false,
          },
        }
      )

      return response
    }
    catch (e: any) {
      error.value = e.message || 'API调用失败'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Streaming chat completion
   */
  const streamChatCompletion = async function* (
    params: ChatCompletionParams
  ): AsyncGenerator<string> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${config.value.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.value.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 4096,
            top_p: params.topP ?? 0.9,
            stream: true,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            }
            catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }
    catch (e: any) {
      error.value = e.message || '流式API调用失败'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Get embeddings for text(s)
   */
  const getEmbeddings = async (
    params: EmbeddingParams
  ): Promise<number[][]> => {
    isLoading.value = true
    error.value = null

    try {
      const inputs = Array.isArray(params.input) ? params.input : [params.input]

      const response = await $fetch<EmbeddingResponse>(
        `${config.value.baseUrl}/embeddings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.value.token}`,
            'Content-Type': 'application/json',
          },
          body: {
            model: params.model,
            input: inputs,
            encoding_format: params.encodingFormat ?? 'float',
          },
        }
      )

      return response.data.map(item => item.embedding)
    }
    catch (e: any) {
      error.value = e.message || 'Embedding API调用失败'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Get single embedding
   */
  const getEmbedding = async (
    text: string,
    model: string = 'Qwen/Qwen3-Embedding-8B'
  ): Promise<number[]> => {
    const [embedding] = await getEmbeddings({ model, input: text })
    return embedding
  }

  /**
   * Test connection
   */
  const testConnection = async (): Promise<boolean> => {
    try {
      // Simple models list request to test
      await $fetch(`${config.value.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${config.value.token}`,
        },
      })
      return true
    }
    catch {
      return false
    }
  }

  /**
   * Check if token is configured
   */
  const isConfigured = computed(() => {
    return !!config.value.token && config.value.token.length > 0
  })

  return {
    // State
    config: readonly(config),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isConfigured,

    // Configuration
    configure,
    setToken,
    testConnection,

    // LLM methods
    chatCompletion,
    streamChatCompletion,

    // Embedding methods
    getEmbeddings,
    getEmbedding,

    // Models
    llmModels: LLM_MODELS,
    embeddingModels: EMBEDDING_MODELS,
  }
}
