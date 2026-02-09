/**
 * ModelScope API Client
 *
 * Provides integration with ModelScope API for LLM and Embedding calls
 * API Base URL: https://api-inference.modelscope.cn/v1
 */

import { config } from '../config.js'

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
  { id: '01-ai/Yi-1.5-34B-Chat', name: 'Yi-1.5-34B', provider: '01.AI', contextLength: '32K' },
]

export const EMBEDDING_MODELS = [
  { id: 'Qwen/Qwen3-Embedding-8B', name: 'Qwen3-Embedding-8B', provider: 'ModelScope', dimensions: 768 },
  { id: 'BAAI/bge-large-zh', name: 'BGE Large Zh', provider: 'BAAI', dimensions: 1024 },
]

/**
 * ModelScope API Client
 */
export class ModelScopeClient {
  private axios: any
  private baseUrl: string
  private token: string

  constructor() {
    this.baseUrl = config.modelScopeApiUrl || 'https://api-inference.modelscope.cn/v1'
    this.token = config.modelScopeToken || ''
    this.initAxios()
  }

  private async initAxios() {
    try {
      const axiosModule = await import('axios')
      this.axios = axiosModule.default
    }
    catch {
      this.axios = null
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!this.token && this.token.length > 0
  }

  /**
   * Chat completion (LLM)
   */
  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    const body = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      top_p: params.topP ?? 0.9,
      stream: params.stream ?? false,
    }

    if (this.axios) {
      const response = await this.axios.post(
        `${this.baseUrl}/chat/completions`,
        body,
        { headers: this.getHeaders() }
      )
      return response.data
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`ModelScope API error: ${response.status}`)
    }

    return {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: params.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: '' },
        finishReason: 'stop',
      }],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }
    }
  }

  /**
   * Streaming chat completion
   */
  async *streamChatCompletion(params: ChatCompletionParams): AsyncGenerator<string> {
    const body = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      top_p: params.topP ?? 0.9,
      stream: true,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`ModelScope API error: ${response.status}`)
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

  /**
   * Get embeddings for text(s)
   */
  async getEmbeddings(params: EmbeddingParams): Promise<number[][]> {
    const inputs = Array.isArray(params.input) ? params.input : [params.input]

    const body = {
      model: params.model,
      input: inputs,
      encoding_format: params.encodingFormat ?? 'float',
    }

    if (this.axios) {
      const response = await this.axios.post(
        `${this.baseUrl}/embeddings`,
        body,
        { headers: this.getHeaders() }
      )
      return response.data.data.map((item: any) => item.embedding)
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`ModelScope API error: ${response.status}`)
    }

    const result: any = await response.json()
    return result.data.map((item: any) => item.embedding)
  }

  /**
   * Get single embedding
   */
  async getEmbedding(text: string, model: string = 'Qwen/Qwen3-Embedding-8B'): Promise<number[]> {
    const [embedding] = await this.getEmbeddings({ model, input: text })
    return embedding
  }
}

// Singleton instance
let clientInstance: ModelScopeClient | null = null

export function getModelScopeClient(): ModelScopeClient {
  if (!clientInstance) {
    clientInstance = new ModelScopeClient()
  }
  return clientInstance
}

export function resetModelScopeClient(): void {
  clientInstance = null
}
