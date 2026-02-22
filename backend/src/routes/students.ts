// Student Routes - 学生管理
import { FastifyInstance } from 'fastify';
import { db, initializeDatabase } from '../models/db.js';
import { generateId } from '../auth/jwt.js';
import { authMiddleware } from '../auth/middleware.js';

export async function studentRoutes(fastify: FastifyInstance) {
  let initialized = false;
  const ensureDb = () => {
    if (!initialized) {
      initializeDatabase();
      initialized = true;
    }
  };

  // 获取当前用户关联的学生（家长查看孩子，学生查看自己）
  fastify.get('/api/v1/students/linked', { preHandler: authMiddleware }, async (request, reply) => {
    ensureDb();
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    let students: any[] = [];

    if (user.role === 'STUDENT') {
      // 学生查看自己的档案
      students = db.prepare(`
        SELECT s.*, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
      `).all(user.id) as any[];
    } else if (user.role === 'PARENT') {
      // 家长查看关联孩子（通过 user_id 关联）
      students = db.prepare(`
        SELECT s.*, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
      `).all(user.id) as any[];
    } else {
      // 管理员/教师查看所有学生（限制前20条）
      students = db.prepare(`
        SELECT s.*, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LIMIT 20
      `).all() as any[];
    }

    // 解析 JSON 字段
    const parsed = students.map((s: any) => ({
      ...s,
      allergies: s.allergies ? JSON.parse(s.allergies) : [],
      conditions: s.conditions ? JSON.parse(s.conditions) : [],
    }));

    return { success: true, data: parsed };
  });

  // Get all students for a school
  fastify.get('/api/v1/students', async (request, reply) => {
    const { school_id, class_id, search, status } = request.query as {
      school_id?: string;
      class_id?: string;
      search?: string;
      status?: string;
    };

    ensureDb();

    let query = `
      SELECT s.*, c.name as class_name, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (school_id) {
      query += ' AND s.school_id = ?';
      params.push(school_id);
    }

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (search) {
      query += ' AND (s.name LIKE ? OR s.student_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.name ASC';

    const stmt = db.prepare(query);
    const students = stmt.all(...params);

    // Parse JSON fields
    return {
      success: true,
      data: students.map((s: any) => ({
        ...s,
        allergies: s.allergies ? JSON.parse(s.allergies) : [],
        conditions: s.conditions ? JSON.parse(s.conditions) : [],
      })),
    };
  });

  // Get single student
  fastify.get('/api/v1/students/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    const stmt = db.prepare(`
      SELECT s.*, c.name as class_name, u.phone as parent_phone, u.name as parent_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `);
    const student = stmt.get(id);

    if (!student) {
      return reply.status(404).send({ error: 'Not Found', message: 'Student not found' });
    }

    return {
      success: true,
      data: {
        ...student,
        allergies: student.allergies ? JSON.parse(student.allergies) : [],
        conditions: student.conditions ? JSON.parse(student.conditions) : [],
      },
    };
  });

  // Create student
  fastify.post('/api/v1/students', async (request, reply) => {
    const {
      user_id,
      school_id,
      class_id,
      student_id,
      name,
      gender,
      birth_date,
      avatar,
      allergies,
      conditions,
    } = request.body as any;

    ensureDb();

    if (!school_id || !name || !gender || !birth_date) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'School ID, name, gender, and birth date are required',
      });
    }

    const id = generateId();

    // Calculate BMI if height and weight provided
    let bmi: number | null = null;
    if (request.body.height && request.body.weight) {
      const heightM = request.body.height / 100;
      bmi = Math.round((request.body.weight / (heightM * heightM)) * 10) / 10;
    }

    db.prepare(`
      INSERT INTO students (
        id, user_id, school_id, class_id, student_id, name, gender, birth_date,
        avatar, height, weight, bmi, vision_left, vision_right, allergies, conditions,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).run(
      id,
      user_id || null,
      school_id,
      class_id || null,
      student_id || null,
      name,
      gender,
      birth_date,
      avatar || null,
      request.body.height || null,
      request.body.weight || null,
      bmi,
      request.body.vision_left || null,
      request.body.vision_right || null,
      JSON.stringify(allergies || []),
      JSON.stringify(conditions || [])
    );

    return {
      success: true,
      data: { id },
      message: 'Student created successfully',
    };
  });

  // Update student
  fastify.put('/api/v1/students/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;

    ensureDb();

    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Student not found' });
    }

    // Calculate BMI if height or weight updated
    let bmi = existing.bmi;
    if (updates.height !== undefined || updates.weight !== undefined) {
      const height = updates.height || existing.height;
      const weight = updates.weight || existing.weight;
      if (height && weight) {
        const heightM = height / 100;
        bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
      }
    }

    const fields = [
      'user_id', 'class_id', 'student_id', 'name', 'avatar',
      'height', 'weight', 'bmi', 'vision_left', 'vision_right',
      'blood_pressure_systolic', 'blood_pressure_diastolic',
      'heart_rate', 'hemoglobin', 'status'
    ];

    const setClause: string[] = [];
    const values: any[] = [];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    // Handle JSON fields
    if (updates.allergies !== undefined) {
      setClause.push('allergies = ?');
      values.push(JSON.stringify(updates.allergies));
    }
    if (updates.conditions !== undefined) {
      setClause.push('conditions = ?');
      values.push(JSON.stringify(updates.conditions));
    }

    if (bmi !== undefined && bmi !== existing.bmi) {
      setClause.push('bmi = ?');
      values.push(bmi);
    }

    if (setClause.length === 0) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No valid fields to update',
      });
    }

    setClause.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE students SET ${setClause.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return {
      success: true,
      message: 'Student updated successfully',
    };
  });

  // Delete student
  fastify.delete('/api/v1/students/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    ensureDb();

    db.prepare("UPDATE students SET status = 'transferred' WHERE id = ?").run(id);

    return {
      success: true,
      message: 'Student marked as transferred',
    };
  });

  // Get students with special diets (for cafeteria)
  fastify.get('/api/v1/students/special-diets', async (request, reply) => {
    const { school_id, cafeteria_id } = request.query as {
      school_id?: string;
      cafeteria_id?: string;
    };

    ensureDb();

    let query = `
      SELECT DISTINCT s.*, c.name as class_name, sd.type, sd.detail, sd.severity
      FROM students s
      JOIN special_diets sd ON s.id = sd.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE sd.status = 'ACTIVE'
    `;
    const params: any[] = [];

    if (school_id) {
      query += ' AND s.school_id = ?';
      params.push(school_id);
    }

    if (cafeteria_id) {
      query += ' AND s.cafeteria_id = ?';
      params.push(cafeteria_id);
    }

    query += ' ORDER BY sd.severity, s.name';

    const students = db.prepare(query).all(...params);

    return {
      success: true,
      data: students.map((s: any) => ({
        ...s,
        allergies: s.allergies ? JSON.parse(s.allergies) : [],
        conditions: s.conditions ? JSON.parse(s.conditions) : [],
      })),
    };
  });

  // Get BMI statistics for a school
  fastify.get('/api/v1/students/bmi-stats', async (request, reply) => {
    const { school_id } = request.query as { school_id?: string };

    ensureDb();

    let query = 'SELECT COUNT(*) as total, AVG(bmi) as avg_bmi FROM students WHERE status = "active" AND bmi IS NOT NULL';
    const params: any[] = [];

    if (school_id) {
      query += ' AND school_id = ?';
      params.push(school_id);
    }

    const stats = db.prepare(query).get(...params);

    // BMI distribution
    const distribution = db.prepare(`
      SELECT
        COUNT(CASE WHEN bmi < 18.5 THEN 1 END) as underweight,
        COUNT(CASE WHEN bmi >= 18.5 AND bmi < 24 THEN 1 END) as normal,
        COUNT(CASE WHEN bmi >= 24 AND bmi < 28 THEN 1 END) as overweight,
        COUNT(CASE WHEN bmi >= 28 THEN 1 END) as obese
      FROM students
      WHERE status = 'active' AND bmi IS NOT NULL
      ${school_id ? 'AND school_id = ?' : ''}
    `).get(...params);

    return {
      success: true,
      data: {
        ...stats,
        distribution,
      },
    };
  });
}
