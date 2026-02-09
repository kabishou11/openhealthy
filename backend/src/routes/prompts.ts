/**
 * Prompts API Routes
 *
 * Provides CRUD operations for prompt templates and few-shot examples
 */

export interface PromptTemplate {
  id: string
  name: string
  type: 'system' | 'user' | 'fewshot'
  content: string
  description: string
  variables: string[]
  category: string
  isDefault: boolean
  usage: number
  createdAt: string
  updatedAt: string
}

// In-memory storage
const promptsStore: Map<string, PromptTemplate> = new Map()

// Initialize with sample prompts
function initSamplePrompts() {
  const now = new Date().toISOString().split('T')[0]
  const samples: Omit<PromptTemplate, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'sys-001',
      name: '营养专家系统提示词',
      type: 'system',
      category: 'general',
      description: 'NutriMind AI营养专家的默认系统提示词',
      content: `你是一位专业的营养健康顾问 NutriMind。你的职责是为用户提供科学、准确、实用的营养健康建议。

## 核心原则
1. **科学性优先**: 所有建议基于营养学研究和临床指南
2. **个性化**: 根据用户的健康状况、偏好制定建议
3. **实用性**: 提供可操作的饮食建议
4. **安全性**: 涉及疾病管理时，强调遵医嘱

## 回复风格
- 使用清晰的标题和列表结构
- 适当使用emoji增加亲和力
- 重点内容加粗强调`,
      variables: ['user_profile', 'health_conditions', 'query'],
      isDefault: true,
      usage: 1234,
    },
    {
      id: 'sys-002',
      name: '糖尿病问答提示词',
      type: 'system',
      category: 'diabetes',
      description: '针对糖尿病用户的专业问答提示词',
      content: `你是糖尿病营养管理专家，专注于为糖尿病患者提供饮食指导。

## 糖尿病饮食核心原则
1. 控制总热量
2. 选择低GI食物
3. 均衡营养
4. 定时定量

## 推荐食物
- 主食: 糙米、燕麦、红薯
- 蔬菜: 西兰花、菠菜
- 蛋白质: 鱼、豆腐、鸡胸肉`,
      variables: ['blood_glucose', 'dietary_restrictions'],
      isDefault: false,
      usage: 567,
    },
    {
      id: 'fs-001',
      name: '糖尿病饮食Few-shot',
      type: 'fewshot',
      category: 'diabetes',
      description: '糖尿病饮食建议的问答示例',
      content: `## 示例1
用户: 糖尿病早餐吃什么好？
助手: 糖尿病早餐建议：
✅ 推荐：杂粮粥+水煮蛋+黄瓜；全麦面包+无糖豆浆+坚果
❌ 避免：白粥、油条、甜面包

## 示例2
用户: 糖尿病能吃水果吗？
助手: 可以适量吃，选择低GI水果：
✅ 苹果、梨、柚子（每天200g内）
⚠️ 避免：荔枝、西瓜（高GI）`,
      variables: [],
      isDefault: false,
      usage: 189,
    },
    {
      id: 'sys-003',
      name: '中医食疗提示词',
      type: 'system',
      category: 'tcm',
      description: '中医食疗体质调理的专业提示词',
      content: `你是中医食疗专家，擅长根据中医理论进行体质辨识和饮食调理。

## 八种基本体质
1. 平和质 - 健康体质
2. 气虚质 - 易疲劳
3. 阳虚质 - 畏寒怕冷
4. 阴虚质 - 口干咽燥
5. 痰湿质 - 形体肥胖
6. 湿热质 - 面垢油光
7. 血瘀质 - 面色晦暗
8. 气郁质 - 情志抑郁

## 食疗原则
- 阴虚宜滋阴润燥
- 阳虚宜温补阳气
- 平和质注意阴阳平衡`,
      variables: ['constitution_type', 'season'],
      isDefault: false,
      usage: 234,
    },
  ]

  samples.forEach(sample => {
    promptsStore.set(sample.id, {
      ...sample,
      createdAt: now,
      updatedAt: now,
    })
  })
}

initSamplePrompts()

export async function registerPromptsRoutes(fastify: any) {
  // Get all prompts
  fastify.get('/api/v1/prompts', async (request: any, reply: any) => {
    const { type, category, search, page = '1', limit = '20' } = request.query

    let prompts = Array.from(promptsStore.values())

    if (type) {
      prompts = prompts.filter(p => p.type === type)
    }
    if (category) {
      prompts = prompts.filter(p => p.category === category)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      prompts = prompts.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const start = (pageNum - 1) * limitNum
    const paginatedPrompts = prompts.slice(start, start + limitNum)

    return {
      prompts: paginatedPrompts,
      total: prompts.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(prompts.length / limitNum),
    }
  })

  // Get single prompt
  fastify.get('/api/v1/prompts/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const prompt = promptsStore.get(id)

    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    return prompt
  })

  // Create prompt
  fastify.post('/api/v1/prompts', async (request: any, reply: any) => {
    const body = request.body as Partial<PromptTemplate>
    const id = `prompt-${Date.now()}`
    const now = new Date().toISOString().split('T')[0]

    const prompt: PromptTemplate = {
      id,
      name: body.name || '',
      type: body.type || 'system',
      content: body.content || '',
      description: body.description || '',
      variables: body.variables || [],
      category: body.category || 'general',
      isDefault: body.isDefault || false,
      usage: 0,
      createdAt: now,
      updatedAt: now,
    }

    promptsStore.set(id, prompt)

    return prompt
  })

  // Update prompt
  fastify.put('/api/v1/prompts/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const body = request.body as Partial<PromptTemplate>

    const existing = promptsStore.get(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    const updated: PromptTemplate = {
      ...existing,
      ...body,
      id: existing.id,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    promptsStore.set(id, updated)

    return updated
  })

  // Delete prompt
  fastify.delete('/api/v1/prompts/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const prompt = promptsStore.get(id)

    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    if (prompt.isDefault) {
      return reply.status(400).send({ error: 'Cannot delete default prompt' })
    }

    promptsStore.delete(id)

    return { success: true, message: 'Prompt deleted' }
  })

  // Duplicate prompt
  fastify.post('/api/v1/prompts/:id/duplicate', async (request: any, reply: any) => {
    const { id } = request.params
    const original = promptsStore.get(id)

    if (!original) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    const now = new Date().toISOString().split('T')[0]
    const copy: PromptTemplate = {
      ...original,
      id: `prompt-${Date.now()}`,
      name: `${original.name} (副本)`,
      isDefault: false,
      usage: 0,
      createdAt: now,
      updatedAt: now,
    }

    promptsStore.set(copy.id, copy)

    return copy
  })

  // Set as default
  fastify.post('/api/v1/prompts/:id/default', async (request: any, reply: any) => {
    const { id } = request.params
    const prompt = promptsStore.get(id)

    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    const category = prompt.category

    // Remove default from other prompts in same category
    for (const [promptId, p] of promptsStore) {
      if (p.category === category) {
        p.isDefault = p.id === id
        promptsStore.set(promptId, p)
      }
    }

    return { success: true, message: 'Default prompt updated' }
  })

  // Get categories
  fastify.get('/api/v1/prompts/categories', async (request: any, reply: any) => {
    const counts: Record<string, { total: number; system: number; fewshot: number }> = {}

    for (const prompt of promptsStore.values()) {
      if (!counts[prompt.category]) {
        counts[prompt.category] = { total: 0, system: 0, fewshot: 0 }
      }
      counts[prompt.category].total++
      if (prompt.type === 'system') counts[prompt.category].system++
      if (prompt.type === 'fewshot') counts[prompt.category].fewshot++
    }

    return {
      categories: Object.entries(counts).map(([name, counts]) => ({
        name,
        ...counts,
      })),
    }
  })

  // Increment usage
  fastify.post('/api/v1/prompts/:id/use', async (request: any, reply: any) => {
    const { id } = request.params
    const prompt = promptsStore.get(id)

    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    prompt.usage++
    promptsStore.set(id, prompt)

    return { success: true, usage: prompt.usage }
  })

  // Get default prompt for category
  fastify.get('/api/v1/prompts/default/:category', async (request: any, reply: any) => {
    const { category } = request.params

    const defaults = Array.from(promptsStore.values())
      .filter(p => p.category === category && p.isDefault && p.type === 'system')

    if (defaults.length === 0) {
      // Return general default
      const general = promptsStore.get('sys-001')
      if (general) return general
      return reply.status(404).send({ error: 'No default prompt found' })
    }

    return defaults[0]
  })
}
