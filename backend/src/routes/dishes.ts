// Dish Routes - 菜品管理
import { FastifyInstance } from 'fastify';
import { db, initializeDatabase } from '../models/db.js';
import { generateId } from '../auth/jwt.js';

export async function dishRoutes(fastify: FastifyInstance) {
  // Initialize DB on first request
  let initialized = false;
  const ensureDb = () => {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }
  };

  // Get all dishes for a cafeteria
  fastify.get('/api/v1/dishes', async (request, reply) => {
    const { cafeteria_id, category, search, available } = request.query as {
      cafeteria_id?: string;
      category?: string;
      search?: string;
      available?: string;
    };

    ensureDb();

    let query = 'SELECT * FROM dishes WHERE 1=1';
    const params: any[] = [];

    if (cafeteria_id) {
      query += ' AND cafeteria_id = ?';
      params.push(cafeteria_id);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    if (available !== undefined) {
      query += ' AND is_available = ?';
      params.push(available === 'true' ? 1 : 0);
    }

    query += ' ORDER BY category, name';

    const stmt = db.prepare(query);
    const dishes = stmt.all(...params);

    // Parse JSON fields
    const parsed = dishes.map((dish: any) => ({
      ...dish,
      nutrition: JSON.parse(dish.nutrition || '{}'),
      allergens: dish.allergens ? JSON.parse(dish.allergens) : [],
      tags: dish.tags ? JSON.parse(dish.tags) : [],
      contraindications: dish.contraindications ? JSON.parse(dish.contraindications) : [],
      suitable_for: dish.suitable_for ? JSON.parse(dish.suitable_for) : [],
      is_available: Boolean(dish.is_available),
      is_special: Boolean(dish.is_special),
    }));

    return { success: true, data: parsed };
  });

  // Get single dish
  fastify.get('/api/v1/dishes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    const stmt = db.prepare('SELECT * FROM dishes WHERE id = ?');
    const dish = stmt.get(id);

    if (!dish) {
      return reply.status(404).send({ error: 'Not Found', message: 'Dish not found' });
    }

    return {
      success: true,
      data: {
        ...dish,
        nutrition: JSON.parse(dish.nutrition || '{}'),
        allergens: dish.allergens ? JSON.parse(dish.allergens) : [],
        tags: dish.tags ? JSON.parse(dish.tags) : [],
        contraindications: dish.contraindications ? JSON.parse(dish.contraindications) : [],
        suitable_for: dish.suitable_for ? JSON.parse(dish.suitable_for) : [],
      },
    };
  });

  // Create dish
  fastify.post('/api/v1/dishes', async (request, reply) => {
    const {
      cafeteria_id,
      name,
      category,
      difficulty,
      cooking_time,
      portion_size,
      price,
      nutrition,
      allergens,
      tags,
      contraindications,
      taste,
      suitable_for,
      image_url,
      is_special,
    } = request.body as any;

    ensureDb();

    if (!cafeteria_id || !name || !category) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cafeteria ID, name, and category are required',
      });
    }

    const id = generateId();

    const stmt = db.prepare(`
      INSERT INTO dishes (
        id, cafeteria_id, name, category, difficulty, cooking_time, portion_size,
        price, nutrition, allergens, tags, contraindications, taste, suitable_for,
        image_url, is_special, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      id,
      cafeteria_id,
      name,
      category,
      difficulty || 'EASY',
      cooking_time || 30,
      portion_size || '1份',
      price || 0,
      JSON.stringify(nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 }),
      JSON.stringify(allergens || []),
      JSON.stringify(tags || []),
      JSON.stringify(contraindications || []),
      taste || 'SAVORY',
      JSON.stringify(suitable_for || []),
      image_url || null,
      is_special ? 1 : 0
    );

    return {
      success: true,
      data: { id },
      message: 'Dish created successfully',
    };
  });

  // Update dish
  fastify.put('/api/v1/dishes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;

    ensureDb();

    const existing = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Dish not found' });
    }

    const allowedFields = [
      'name', 'category', 'difficulty', 'cooking_time', 'portion_size', 'price',
      'nutrition', 'allergens', 'tags', 'contraindications', 'taste', 'suitable_for',
      'image_url', 'is_available', 'is_special',
    ];

    const setClause: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        if (['nutrition', 'allergens', 'tags', 'contraindications', 'suitable_for'].includes(field)) {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (setClause.length === 0) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No valid fields to update',
      });
    }

    setClause.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE dishes SET ${setClause.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return {
      success: true,
      message: 'Dish updated successfully',
    };
  });

  // Delete dish
  fastify.delete('/api/v1/dishes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    const existing = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Dish not found' });
    }

    db.prepare('DELETE FROM dishes WHERE id = ?').run(id);

    return {
      success: true,
      message: 'Dish deleted successfully',
    };
  });

  // Sync dishes from HowToCook recipe database
  fastify.post('/api/v1/dishes/sync', async (request, reply) => {
    const { cafeteria_id } = request.body as { cafeteria_id: string };
    ensureDb();

    if (!cafeteria_id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cafeteria ID is required',
      });
    }

    // Import from HowToCook MCP tools
    const { howToCookMCP } = await import('../mcp_tools/howtocook.js');
    const recipes = await howToCookMCP.getAllRecipes();

    let synced = 0;
    const categoryMap: Record<string, string> = {
      'breakfast': 'BREAKFAST',
      'staple': 'STAPLE',
      'meat_dish': 'MEAT',
      'vegetable_dish': 'VEGETABLE',
      'soup': 'SOUP',
      'dessert': 'DESSERT',
      'drink': 'DRINK',
      'condiment': 'CONDIMENT',
      'semi-finished': 'SEMI_FINISHED',
    };

    for (const recipe of recipes) {
      const category = categoryMap[recipe.category] || 'STAPLE';

      // Check if dish already exists
      const existing = db.prepare(
        'SELECT id FROM dishes WHERE cafeteria_id = ? AND name = ?'
      ).get(cafeteria_id, recipe.name);

      if (existing) continue;

      const id = generateId();
      db.prepare(`
        INSERT INTO dishes (
          id, cafeteria_id, name, category, difficulty, cooking_time,
          price, nutrition, allergens, contraindications,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        id,
        cafeteria_id,
        recipe.name,
        category,
        recipe.difficulty || 'MEDIUM',
        recipe.cookingTime || 30,
        0,
        JSON.stringify({
          calories: recipe.nutrition?.calories || 0,
          protein: recipe.nutrition?.protein || 0,
          carbs: recipe.nutrition?.carbs || 0,
          fat: recipe.nutrition?.fat || 0,
        }),
        JSON.stringify(recipe.allergens || []),
        JSON.stringify(recipe.contraindications || [])
      );

      synced++;
    }

    return {
      success: true,
      message: `Synced ${synced} dishes from recipe database`,
    };
  });
}
