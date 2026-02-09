/**
 * Knowledge Base API Routes
 *
 * Provides CRUD operations for knowledge base entries
 * Note: RAG integration temporarily disabled
 */

type KnowledgeCategory = 'nutrition' | 'diabetes' | 'hypertension' | 'tcm' | 'gout' | 'fatty_liver' | 'pregnancy' | 'weight_loss'

// Knowledge entry interface
export interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: KnowledgeCategory
  source: string
  tags: string[]
  status: 'published' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

// In-memory storage (replace with database in production)
const knowledgeStore: Map<string, KnowledgeEntry> = new Map()

// Initialize with sample data
function initSampleData() {
  const samples: Omit<KnowledgeEntry, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'kb-001',
      title: '糖尿病饮食原则',
      content: '糖尿病饮食原则：控制总热量；均衡营养；定时定量进餐；增加膳食纤维摄入；选择低GI食物；限制简单糖类。',
      category: 'diabetes',
      source: '糖尿病营养治疗指南',
      tags: ['糖尿病', '血糖控制', '低GI'],
      status: 'published',
    },
    {
      id: 'kb-002',
      title: '高血压DASH饮食',
      content: '高血压饮食（DASH）：富含水果、蔬菜、全谷物；低脂奶制品；限制饱和脂肪、胆固醇、精制糖和钠的摄入。',
      category: 'hypertension',
      source: '高血压营养管理指南',
      tags: ['高血压', 'DASH饮食', '降压'],
      status: 'published',
    },
    {
      id: 'kb-003',
      title: '阴虚体质饮食宜忌',
      content: '阴虚体质饮食宜滋阴润燥：多吃梨、银耳、百合、麦冬、枸杞等滋阴食物；忌辛辣、温燥食物。',
      category: 'tcm',
      source: '中医食疗学',
      tags: ['阴虚体质', '滋阴', '食疗'],
      status: 'published',
    },
    {
      id: 'kb-004',
      title: '痛风饮食禁忌',
      content: '痛风饮食原则：限制高嘌呤食物（动物内脏、海鲜、浓肉汤）；限制酒精；增加水分摄入；控制体重。',
      category: 'gout',
      source: '痛风营养治疗指南',
      tags: ['痛风', '嘌呤', '饮食禁忌'],
      status: 'published',
    },
  ]

  const now = new Date().toISOString().split('T')[0]
  samples.forEach(sample => {
    knowledgeStore.set(sample.id, {
      ...sample,
      createdAt: now,
      updatedAt: now,
    })
  })
}

// Initialize on module load
initSampleData()

export async function registerKnowledgeRoutes(fastify: any) {
  // Get all knowledge entries
  fastify.get('/api/v1/knowledge', async (request: any, reply: any) => {
    const { category, status, search, page = '1', limit = '20' } = request.query

    let entries = Array.from(knowledgeStore.values())

    // Apply filters
    if (category) {
      entries = entries.filter(e => e.category === category)
    }
    if (status) {
      entries = entries.filter(e => e.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      entries = entries.filter(e =>
        e.title.toLowerCase().includes(searchLower) ||
        e.content.toLowerCase().includes(searchLower) ||
        e.tags.some(t => t.toLowerCase().includes(searchLower))
      )
    }

    // Pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const start = (pageNum - 1) * limitNum
    const paginatedEntries = entries.slice(start, start + limitNum)

    return {
      entries: paginatedEntries,
      total: entries.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(entries.length / limitNum),
    }
  })

  // Get single knowledge entry
  fastify.get('/api/v1/knowledge/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const entry = knowledgeStore.get(id)

    if (!entry) {
      return reply.status(404).send({ error: 'Knowledge entry not found' })
    }

    return entry
  })

  // Create knowledge entry
  fastify.post('/api/v1/knowledge', async (request: any, reply: any) => {
    const body = request.body as Partial<KnowledgeEntry>
    const id = `kb-${Date.now()}`
    const now = new Date().toISOString().split('T')[0]

    const entry: KnowledgeEntry = {
      id,
      title: body.title || '',
      content: body.content || '',
      category: body.category || 'nutrition',
      source: body.source || '',
      tags: body.tags || [],
      status: body.status || 'draft',
      createdAt: now,
      updatedAt: now,
    }

    knowledgeStore.set(id, entry)

    return entry
  })

  // Update knowledge entry
  fastify.put('/api/v1/knowledge/:id', async (request: any, reply: any) => {
    const { id } = request.params
    const body = request.body as Partial<KnowledgeEntry>

    const existing = knowledgeStore.get(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Knowledge entry not found' })
    }

    const updated: KnowledgeEntry = {
      ...existing,
      ...body,
      id: existing.id, // Prevent ID change
      updatedAt: new Date().toISOString().split('T')[0],
    }

    knowledgeStore.set(id, updated)

    return updated
  })

  // Delete knowledge entry
  fastify.delete('/api/v1/knowledge/:id', async (request: any, reply: any) => {
    const { id } = request.params

    if (!knowledgeStore.has(id)) {
      return reply.status(404).send({ error: 'Knowledge entry not found' })
    }

    knowledgeStore.delete(id)

    return { success: true, message: 'Knowledge entry deleted' }
  })

  // Batch import
  fastify.post('/api/v1/knowledge/import', async (request: any, reply: any) => {
    const { entries } = request.body as { entries: Partial<KnowledgeEntry>[] }
    const now = new Date().toISOString().split('T')[0]
    const imported: string[] = []

    for (const entryData of entries) {
      const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const entry: KnowledgeEntry = {
        id,
        title: entryData.title || '',
        content: entryData.content || '',
        category: entryData.category || 'nutrition',
        source: entryData.source || '',
        tags: entryData.tags || [],
        status: entryData.status || 'draft',
        createdAt: now,
        updatedAt: now,
      }
      knowledgeStore.set(id, entry)
      imported.push(id)
    }

    return {
      success: true,
      imported: imported.length,
      ids: imported,
    }
  })

  // Export knowledge
  fastify.get('/api/v1/knowledge/export', async (request: any, reply: any) => {
    const { category } = request.query

    let entries = Array.from(knowledgeStore.values())

    if (category) {
      entries = entries.filter(e => e.category === category)
    }

    return {
      exported: entries.length,
      entries: entries.filter(e => e.status === 'published'),
    }
  })

  // Get categories with counts
  fastify.get('/api/v1/knowledge/categories', async (request: any, reply: any) => {
    const counts: Record<string, number> = {}
    const statusCounts: Record<string, Record<string, number>> = {}

    for (const entry of knowledgeStore.values()) {
      counts[entry.category] = (counts[entry.category] || 0) + 1

      if (!statusCounts[entry.category]) {
        statusCounts[entry.category] = {}
      }
      statusCounts[entry.category][entry.status] = (statusCounts[entry.category][entry.status] || 0) + 1
    }

    return {
      categories: Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        published: statusCounts[name]?.published || 0,
        drafts: statusCounts[name]?.drafts || 0,
      })),
      total: knowledgeStore.size,
    }
  })

  // Rebuild RAG index (disabled)
  fastify.post('/api/v1/knowledge/reindex', async (request: any, reply: any) => {
    return {
      success: true,
      message: 'RAG reindex temporarily disabled',
      indexed: 0,
    }
  })
}
