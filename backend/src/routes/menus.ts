// Menu Routes - 餐单管理
import { FastifyInstance } from 'fastify';
import { db, initializeDatabase } from '../models/db.js';
import { generateId } from '../auth/jwt.js';

export async function menuRoutes(fastify: FastifyInstance) {
  let initialized = false;
  const ensureDb = () => {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }
  };

  // 获取今日餐单
  fastify.get('/api/v1/menus/today', async (request, reply) => {
    ensureDb();
    const today = new Date().toISOString().split('T')[0];

    const menu = db.prepare(`
      SELECT * FROM daily_menus WHERE date = ? LIMIT 1
    `).get(today) as any;

    if (!menu) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        ...menu,
        meals: menu.meals ? JSON.parse(menu.meals) : {},
        total_nutrition: menu.total_nutrition ? JSON.parse(menu.total_nutrition) : null,
      },
    };
  });

  // Get daily menus for a cafeteria
  fastify.get('/api/v1/menus', async (request, reply) => {
    const { cafeteria_id, start_date, end_date } = request.query as {
      cafeteria_id?: string;
      start_date?: string;
      end_date?: string;
    };

    ensureDb();

    let query = 'SELECT * FROM daily_menus WHERE 1=1';
    const params: any[] = [];

    if (cafeteria_id) {
      query += ' AND cafeteria_id = ?';
      params.push(cafeteria_id);
    }

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY date DESC';

    const stmt = db.prepare(query);
    const menus = stmt.all(...params);

    return {
      success: true,
      data: menus.map((menu: any) => ({
        ...menu,
        meals: JSON.parse(menu.meals || '{}'),
        total_nutrition: menu.total_nutrition ? JSON.parse(menu.total_nutrition) : null,
      })),
    };
  });

  // Get single menu
  fastify.get('/api/v1/menus/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    const stmt = db.prepare('SELECT * FROM daily_menus WHERE id = ?');
    const menu = stmt.get(id);

    if (!menu) {
      return reply.status(404).send({ error: 'Not Found', message: 'Menu not found' });
    }

    return {
      success: true,
      data: {
        ...menu,
        meals: JSON.parse(menu.meals || '{}'),
        total_nutrition: menu.total_nutrition ? JSON.parse(menu.total_nutrition) : null,
      },
    };
  });

  // Create daily menu
  fastify.post('/api/v1/menus', async (request, reply) => {
    const {
      cafeteria_id,
      date,
      week_day,
      meals,
      total_nutrition,
    } = request.body as any;

    ensureDb();

    if (!cafeteria_id || !date || !meals) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cafeteria ID, date, and meals are required',
      });
    }

    const id = generateId();

    // Check if menu already exists for this date
    const existing = db.prepare(
      'SELECT id FROM daily_menus WHERE cafeteria_id = ? AND date = ?'
    ).get(cafeteria_id, date);

    if (existing) {
      // Update existing menu
      db.prepare(`
        UPDATE daily_menus
        SET meals = ?, total_nutrition = ?, week_day = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(JSON.stringify(meals), JSON.stringify(total_nutrition || {}), week_day || 0, existing.id);

      return {
        success: true,
        data: { id: existing.id },
        message: 'Menu updated successfully',
      };
    }

    db.prepare(`
      INSERT INTO daily_menus (
        id, cafeteria_id, date, week_day, meals, total_nutrition,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', datetime('now'), datetime('now'))
    `).run(id, cafeteria_id, date, week_day || 0, JSON.stringify(meals), JSON.stringify(total_nutrition || {}));

    return {
      success: true,
      data: { id },
      message: 'Menu created successfully',
    };
  });

  // Publish menu
  fastify.post('/api/v1/menus/:id/publish', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    const menu = db.prepare('SELECT * FROM daily_menus WHERE id = ?').get(id);
    if (!menu) {
      return reply.status(404).send({ error: 'Not Found', message: 'Menu not found' });
    }

    db.prepare(`
      UPDATE daily_menus
      SET status = 'PUBLISHED', published_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    return {
      success: true,
      message: 'Menu published successfully',
    };
  });

  // Delete menu
  fastify.delete('/api/v1/menus/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    db.prepare('DELETE FROM daily_menus WHERE id = ?').run(id);

    return {
      success: true,
      message: 'Menu deleted successfully',
    };
  });

  // Get menu for a specific date (simplified for frontend)
  fastify.get('/api/v1/menu/daily', async (request, reply) => {
    const { cafeteria_id, date } = request.query as {
      cafeteria_id?: string;
      date?: string;
    };

    ensureDb();

    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!cafeteria_id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cafeteria ID is required',
      });
    }

    const menu = db.prepare(
      'SELECT * FROM daily_menus WHERE cafeteria_id = ? AND date = ?'
    ).get(cafeteria_id, targetDate);

    if (!menu) {
      return {
        success: true,
        data: null,
        message: 'No menu found for this date',
      };
    }

    return {
      success: true,
      data: {
        ...menu,
        meals: JSON.parse(menu.meals || '{}'),
        total_nutrition: menu.total_nutrition ? JSON.parse(menu.total_nutrition) : null,
      },
    };
  });

  // Get weekly menu (7 days)
  fastify.get('/api/v1/menu/weekly', async (request, reply) => {
    const { cafeteria_id, start_date } = request.query as {
      cafeteria_id?: string;
      start_date?: string;
    };

    ensureDb();

    if (!cafeteria_id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cafeteria ID is required',
      });
    }

    const start = start_date ? new Date(start_date) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const menus = db.prepare(`
      SELECT * FROM daily_menus
      WHERE cafeteria_id = ?
      AND date >= ?
      AND date <= ?
      ORDER BY date ASC
    `).all(cafeteria_id, start.toISOString().split('T')[0], end.toISOString().split('T')[0]);

    // Fill in missing days with empty menus
    const weekMenus: any[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = dayNames[day.getDay()];

      const menu = menus.find((m: any) => m.date === dateStr);
      if (menu) {
        weekMenus.push({
          ...menu,
          meals: JSON.parse(menu.meals || '{}'),
          total_nutrition: menu.total_nutrition ? JSON.parse(menu.total_nutrition) : null,
          week_day: weekDay,
        });
      } else {
        weekMenus.push({
          id: null,
          cafeteria_id,
          date: dateStr,
          week_day: weekDay,
          meals: {},
          total_nutrition: null,
          status: 'DRAFT',
        });
      }
    }

    return {
      success: true,
      data: weekMenus,
    };
  });
}
