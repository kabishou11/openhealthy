/**
 * 个人健康档案 API
 */

import { db } from '../models/db.js'
import crypto from 'crypto'

export async function registerPersonalHealthRoutes(fastify: any) {
  // 获取所有记录（列表，不含 image_data 和 raw_text 以减少传输量）
  fastify.get('/api/v1/personal-health', async (_req: any, reply: any) => {
    try {
      const rows = db.prepare(`
        SELECT id, user_id, scan_date, title, source_type, structured_data, groups_data, summary, notes, created_at
        FROM personal_health_records
        ORDER BY scan_date DESC, created_at DESC
      `).all() as any[]

      return {
        success: true,
        data: rows.map(r => ({
          ...r,
          structured_data: r.structured_data ? JSON.parse(r.structured_data) : {},
          groups: r.groups_data ? JSON.parse(r.groups_data) : null,
        })),
      }
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // 获取单条记录（含原始文本和图片）
  fastify.get('/api/v1/personal-health/:id', async (req: any, reply: any) => {
    const { id } = req.params as { id: string }
    try {
      const row = db.prepare('SELECT * FROM personal_health_records WHERE id = ?').get(id) as any
      if (!row) return reply.status(404).send({ error: '记录不存在' })
      return {
        success: true,
        data: {
          ...row,
          structured_data: row.structured_data ? JSON.parse(row.structured_data) : {},
          groups: row.groups_data ? JSON.parse(row.groups_data) : null,
        },
      }
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // 保存新记录
  fastify.post('/api/v1/personal-health', async (req: any, reply: any) => {
    const body = req.body as {
      rawText?: string
      structuredData?: Record<string, any>
      groups?: any[]          // 新格式：分组数据
      scanDate?: string
      title?: string
      notes?: string
      summary?: string
      sourceType?: string
      imageData?: string
    }
    try {
      const id = crypto.randomUUID()
      const scanDate = body.scanDate || new Date().toISOString().split('T')[0]
      const title = body.title || `体检记录 ${scanDate}`
      db.prepare(`
        INSERT INTO personal_health_records
          (id, scan_date, raw_text, structured_data, groups_data, title, notes, summary, source_type, image_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        scanDate,
        body.rawText || '',
        JSON.stringify(body.structuredData || {}),
        body.groups ? JSON.stringify(body.groups) : null,
        title,
        body.notes || '',
        body.summary || '',
        body.sourceType || 'scan',
        body.imageData || null,
      )
      return { success: true, id }
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // 更新记录
  fastify.put('/api/v1/personal-health/:id', async (req: any, reply: any) => {
    const { id } = req.params as { id: string }
    const body = req.body as {
      structuredData?: Record<string, any>
      groups?: any[]
      title?: string
      notes?: string
      summary?: string
      scanDate?: string
    }
    try {
      const existing = db.prepare('SELECT id FROM personal_health_records WHERE id = ?').get(id)
      if (!existing) return reply.status(404).send({ error: '记录不存在' })

      const updates: string[] = []
      const values: any[] = []
      if (body.structuredData !== undefined) {
        updates.push('structured_data = ?')
        values.push(JSON.stringify(body.structuredData))
      }
      if (body.groups !== undefined) {
        updates.push('groups_data = ?')
        values.push(JSON.stringify(body.groups))
      }
      if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title) }
      if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes) }
      if (body.summary !== undefined) { updates.push('summary = ?'); values.push(body.summary) }
      if (body.scanDate !== undefined) { updates.push('scan_date = ?'); values.push(body.scanDate) }
      updates.push("updated_at = datetime('now')")
      values.push(id)

      db.prepare(`UPDATE personal_health_records SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      return { success: true }
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // 删除记录
  fastify.delete('/api/v1/personal-health/:id', async (req: any, reply: any) => {
    const { id } = req.params as { id: string }
    try {
      db.prepare('DELETE FROM personal_health_records WHERE id = ?').run(id)
      return { success: true }
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })
}
