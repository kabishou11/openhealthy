import type { FastifyInstance } from 'fastify'
import { db } from '../models/db.js'
import { config } from '../config.js'

export async function registerAnalyzeHealthRoutes(app: FastifyInstance) {
  // 档案对话接口：基于某条健康档案与 AI 医生对话（流式）
  app.post('/api/v1/analyze-health/chat', async (request, reply) => {
    const { recordId, message, history } = request.body as {
      recordId: string
      message: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!recordId || !message) {
      return reply.status(400).send({ error: '缺少 recordId 或 message' })
    }

    // 查询档案数据
    const record = db.prepare(
      'SELECT title, groups_data, summary, raw_text FROM personal_health_records WHERE id = ?'
    ).get(recordId) as any

    if (!record) {
      return reply.status(404).send({ error: '档案不存在' })
    }

    const apiKey = config.modelScopeToken
    const apiBase = config.modelScopeApiUrl
    const model = 'Qwen/Qwen3-Next-80B-A3B-Instruct'

    if (!apiKey) {
      return reply.status(500).send({ error: '未配置 MODELSCOPE_TOKEN' })
    }

    // 构建档案上下文
    let dataContext = ''
    if (record.groups_data) {
      try {
        const groups = JSON.parse(record.groups_data)
        dataContext = groups.map((g: any) => {
          const items = g.items.map((i: any) => {
            const tag = i.status === 'high' ? '【偏高】' : i.status === 'low' ? '【偏低】' : ''
            return `  ${i.key}: ${i.value}${i.unit ? ' ' + i.unit : ''}${i.ref ? `（参考: ${i.ref}）` : ''}${tag}`
          }).join('\n')
          return `【${g.name}】\n${items}`
        }).join('\n\n')
      } catch { /* ignore */ }
    }

    const systemPrompt = `你是一位专业、友善的 AI 健康顾问。用户正在查看一份健康档案，你需要基于这份档案的数据回答用户的问题。

档案标题：${record.title || '健康检查'}
${record.summary ? `\nAI 总结：\n${record.summary}\n` : ''}
${dataContext ? `\n检测数据：\n${dataContext}\n` : ''}
规则：
- 用中文回答，语气专业但通俗易懂
- 基于档案数据给出具体分析，不要泛泛而谈
- 如果用户问的问题超出档案数据范围，诚实说明并给出一般性建议
- 涉及严重健康问题时，建议用户咨询专业医生
- 回答简洁有条理，避免过长`

    // 构建消息列表
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // 加入历史对话
    if (history?.length) {
      for (const h of history.slice(-10)) {
        messages.push({ role: h.role, content: h.content })
      }
    }
    messages.push({ role: 'user', content: message })

    // 流式请求
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const errText = await response.text()
      return reply.status(502).send({ error: `模型调用失败: ${response.status} ${errText.slice(0, 200)}` })
    }

    // 转发流式响应
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        reply.raw.write(chunk)
      }
    } finally {
      reply.raw.end()
    }
  })
}
