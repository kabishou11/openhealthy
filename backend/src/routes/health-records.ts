// Health Records Routes
import { FastifyInstance } from 'fastify';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware.js';
import { db } from '../models/db.js';

export async function healthRoutes(fastify: FastifyInstance) {
  // Get health records for a student
  fastify.get('/api/v1/health/records/:studentId', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };

    try {
      const stmt = db.prepare(`
        SELECT * FROM health_records
        WHERE student_id = ?
        ORDER BY checkup_date DESC
      `);
      const records = stmt.all(studentId);

      return {
        success: true,
        data: records,
      };
    } catch (error) {
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch health records',
      });
    }
  });

  // Create new health record
  fastify.post('/api/v1/health/records', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const body = request.body as {
      studentId: string;
      checkupDate: string;
      schoolYear?: string;
      height: number;
      weight: number;
      bmi: number;
      visionLeft: number;
      visionRight: number;
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      hemoglobin?: number;
      fastingGlucose?: number;
      rawData?: object;
      aiAnalysis?: string;
    };

    try {
      const { db } = await import('../models/db.js');
      const crypto = await import('crypto');
      const id = crypto.randomUUID();

      const stmt = db.prepare(`
        INSERT INTO health_records (
          id, student_id, checkup_date, school_year, height, weight, bmi,
          vision_left, vision_right, blood_pressure_systolic, blood_pressure_diastolic,
          hemoglobin, fasting_glucose, raw_data, ai_analysis, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      stmt.run(
        id,
        body.studentId,
        body.checkupDate,
        body.schoolYear || null,
        body.height,
        body.weight,
        body.bmi,
        body.visionLeft,
        body.visionRight,
        body.bloodPressureSystolic || null,
        body.bloodPressureDiastolic || null,
        body.hemoglobin || null,
        body.fastingGlucose || null,
        JSON.stringify(body.rawData || {}),
        body.aiAnalysis || null
      );

      return {
        success: true,
        data: { id: body.studentId },
      };
    } catch (error) {
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create health record',
      });
    }
  });

  // Get health summary for a student
  fastify.get('/api/v1/health/summary/:studentId', {
    preHandler: [optionalAuthMiddleware],
  }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };

    try {
      // Get latest health record
      const latestRecord = db.prepare(`
        SELECT * FROM health_records
        WHERE student_id = ?
        ORDER BY checkup_date DESC
        LIMIT 1
      `).get(studentId) as Record<string, any> | undefined;

      // Get special diets
      const specialDiets = db.prepare(`
        SELECT * FROM special_diets
        WHERE student_id = ? AND status = 'ACTIVE'
      `).all(studentId);

      // Calculate BMI category
      let bmiCategory = 'unknown';
      if (latestRecord?.bmi) {
        const bmi = latestRecord.bmi;
        if (bmi < 18.5) bmiCategory = '偏瘦';
        else if (bmi < 24) bmiCategory = '正常';
        else if (bmi < 28) bmiCategory = '偏胖';
        else bmiCategory = '肥胖';
      }

      // Calculate nutrition targets based on age and activity
      let nutritionTargets = {
        calories: 1800,
        protein: 60,
        fat: 60,
        carbs: 250,
      };

      return {
        success: true,
        data: {
          latestRecord: latestRecord ? {
            ...latestRecord,
            bmiCategory,
            raw_data: latestRecord.raw_data ? JSON.parse(latestRecord.raw_data) : null,
          } : null,
          specialDiets,
          nutritionTargets,
        },
      };
    } catch (error) {
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch health summary',
      });
    }
  });

  // Get student's health trend
  fastify.get('/api/v1/health/trend/:studentId', {
    preHandler: [optionalAuthMiddleware],
  }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };

    try {
      const records = db.prepare(`
        SELECT id, checkup_date, height, weight, bmi, vision_left, vision_right
        FROM health_records
        WHERE student_id = ?
        ORDER BY checkup_date ASC
      `).all(studentId);

      return {
        success: true,
        data: records,
      };
    } catch (error) {
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch health trend',
      });
    }
  });
}
