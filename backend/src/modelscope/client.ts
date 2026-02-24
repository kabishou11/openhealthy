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

// Available models - can be fetched from API or configured
export const LLM_MODELS = [
  // Qwen3 系列
  { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3-235B-A22B (MoE)', provider: 'Qwen', contextLength: '128K', description: '通义千问3 MoE旗舰模型，235B参数激活22B' },
  { id: 'Qwen/Qwen3-Next-80B-A3B-Instruct', name: 'Qwen3-Next-80B-A3B', provider: 'Qwen', contextLength: '128K', description: '通义千问3 Next MoE模型，80B参数激活3B' },
  { id: 'Qwen/Qwen3-32B', name: 'Qwen3-32B', provider: 'Qwen', contextLength: '128K', description: '通义千问3 32B参数模型' },
  { id: 'Qwen/Qwen3-14B', name: 'Qwen3-14B', provider: 'Qwen', contextLength: '128K', description: '通义千问3 14B参数模型' },
  { id: 'Qwen/Qwen3-8B', name: 'Qwen3-8B', provider: 'Qwen', contextLength: '128K', description: '通义千问3 8B参数模型' },
  { id: 'Qwen/Qwen3-4B', name: 'Qwen3-4B', provider: 'Qwen', contextLength: '32K', description: '通义千问3 4B参数模型' },
  { id: 'Qwen/Qwen3-1.7B', name: 'Qwen3-1.7B', provider: 'Qwen', contextLength: '32K', description: '通义千问3 1.7B参数模型' },
  // Qwen2.5 系列
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B', provider: 'Qwen', contextLength: '128K', description: '通义千问2.5 72B指令微调模型' },
  { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B', provider: 'Qwen', contextLength: '128K', description: '通义千问2.5 32B指令微调模型' },
  { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5-14B', provider: 'Qwen', contextLength: '128K', description: '通义千问2.5 14B指令微调模型' },
  { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B', provider: 'Qwen', contextLength: '128K', description: '通义千问2.5 7B指令微调模型' },
  { id: 'Qwen/Qwen2.5-3B-Instruct', name: 'Qwen2.5-3B', provider: 'Qwen', contextLength: '32K', description: '通义千问2.5 3B指令微调模型' },
  // DeepSeek 系列
  { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek V3 旗舰模型' },
  { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek R1 推理模型' },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'DeepSeek-R1-Qwen-32B', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek R1 蒸馏 Qwen 32B' },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B', name: 'DeepSeek-R1-Qwen-14B', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek R1 蒸馏 Qwen 14B' },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', name: 'DeepSeek-R1-Qwen-7B', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek R1 蒸馏 Qwen 7B' },
  { id: 'deepseek-ai/DeepSeek-V2-Chat', name: 'DeepSeek-V2', provider: 'DeepSeek', contextLength: '128K', description: 'DeepSeek V2 聊天模型' },
  // Moonshot
  { id: 'moonshotai/Kimi-K2.5', name: 'Kimi K2.5', provider: 'Moonshot', contextLength: '128K', description: 'Moonshot Kimi K2.5 大语言模型' },
  // 01.AI
  { id: '01-ai/Yi-1.5-34B-Chat', name: 'Yi-1.5-34B', provider: '01.AI', contextLength: '32K', description: '01.AI Yi-1.5 34B对话模型' },
  { id: '01-ai/Yi-1.5-9B-Chat', name: 'Yi-1.5-9B', provider: '01.AI', contextLength: '32K', description: '01.AI Yi-1.5 9B对话模型' },
  // ZhipuAI
  { id: 'THUDM/GLM-4-9b-chat', name: 'GLM-4-9B', provider: 'ZhipuAI', contextLength: '128K', description: '智谱 GLM-4 9B对话模型' },
  { id: 'THUDM/glm-4-9b-chat-1m', name: 'GLM-4-9B-1M', provider: 'ZhipuAI', contextLength: '1M', description: '智谱 GLM-4 9B 超长上下文模型' },
  // Meta Llama
  { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama-3.1-70B', provider: 'Meta', contextLength: '128K', description: 'Meta Llama 3.1 70B指令微调模型' },
  { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama-3.1-8B', provider: 'Meta', contextLength: '128K', description: 'Meta Llama 3.1 8B指令微调模型' },
  { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama-3.2-3B', provider: 'Meta', contextLength: '128K', description: 'Meta Llama 3.2 3B指令微调模型' },
  // InternLM
  { id: 'internlm/internlm2_5-20b-chat', name: 'InternLM2.5-20B', provider: 'InternLM', contextLength: '32K', description: '书生浦语 InternLM2.5 20B对话模型' },
  { id: 'internlm/internlm2_5-7b-chat', name: 'InternLM2.5-7B', provider: 'InternLM', contextLength: '32K', description: '书生浦语 InternLM2.5 7B对话模型' },
  // Mistral
  { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral-7B-v0.3', provider: 'Mistral', contextLength: '32K', description: 'Mistral 7B指令微调模型 v0.3' },
]

export const EMBEDDING_MODELS = [
  { id: 'Qwen/Qwen3-Embedding-8B', name: 'Qwen3-Embedding-8B', provider: 'ModelScope', dimensions: 768, description: '阿里巴巴通义千问Embedding模型' },
  { id: 'BAAI/bge-large-zh-v1.5', name: 'BGE Large Zh v1.5', provider: 'BAAI', dimensions: 1024, description: '智源BGE大模型中文版本v1.5' },
  { id: 'BAAI/bge-base-zh-v1.5', name: 'BGE Base Zh v1.5', provider: 'BAAI', dimensions: 768, description: '智源BGE基线模型中文版本v1.5' },
  { id: 'BAAI/bge-small-zh-v1.5', name: 'BGE Small Zh v1.5', provider: 'BAAI', dimensions: 512, description: '智源BGE小模型中文版本v1.5' },
  { id: 'maidalun1020/bge-large-zh-imeh', name: 'BGE Large Zh IMEH', provider: 'Custom', dimensions: 1024, description: 'BGE大模型中文优化版本' },
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
    // Always use fetch to avoid axios serialization issues
    const body = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      top_p: params.topP ?? 0.9,
      stream: params.stream ?? false,
      enable_thinking: false, // Required for non-streaming calls
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('ModelScope API error:', response.status, errText)
      throw new Error(`ModelScope API error: ${response.status} - ${errText}`)
    }

    return response.json() as Promise<ChatCompletionResponse>
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
      enable_thinking: false, // Disable thinking for streaming too
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

  /**
   * Fetch available models from ModelScope API
   */
  async fetchAvailableModels(): Promise<{ llm: typeof LLM_MODELS; embedding: typeof EMBEDDING_MODELS }> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json() as { data?: { id: string; owned_by?: string }[] }
      const models = data.data || []

      if (models.length === 0) {
        return { llm: LLM_MODELS, embedding: EMBEDDING_MODELS }
      }

      const llmModels: typeof LLM_MODELS = []
      const embeddingModels: typeof EMBEDDING_MODELS = []

      for (const model of models) {
        const id = model.id
        const nameParts = id.split('/')
        const name = nameParts[nameParts.length - 1] || id
        const provider = nameParts[0] || 'ModelScope'
        const isEmbedding = id.toLowerCase().includes('embedding') || id.toLowerCase().includes('embed')

        if (isEmbedding) {
          embeddingModels.push({ id, name, provider, dimensions: 768, description: `${name} embedding model` })
        } else {
          llmModels.push({ id, name, provider, contextLength: '32K', description: `${name} language model` })
        }
      }

      return {
        llm: llmModels.length > 0 ? llmModels : LLM_MODELS,
        embedding: embeddingModels.length > 0 ? embeddingModels : EMBEDDING_MODELS,
      }
    } catch (error) {
      console.error('Failed to fetch models from ModelScope, using fallback list:', error)
      return { llm: LLM_MODELS, embedding: EMBEDDING_MODELS }
    }
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
