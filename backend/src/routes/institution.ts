/**
 * Institution Routes
 *
 * API endpoints for institution-specific features (schools, hospitals, enterprises)
 */

import { FastifyInstance } from 'fastify';

// Institution types
type InstitutionType = 'school' | 'hospital' | 'enterprise' | 'nursing_home';

// Mock data for demonstration
const institutions: Map<string, {
  id: string;
  type: InstitutionType;
  name: string;
  settings: Record<string, unknown>;
}> = new Map([
  ['inst-001', {
    id: 'inst-001',
    type: 'school',
    name: '阳光中学',
    settings: {
      targetAgeGroup: { min: 12, max: 18 },
      budgetPerMeal: 15,
      nutritionStandards: { calories: 650, protein: 25, fat: 20 },
      mealCountPerDay: 3,
    },
  }],
  ['inst-002', {
    id: 'inst-002',
    type: 'hospital',
    name: '市中心医院营养科',
    settings: {
      specialties: ['diabetes', 'hypertension', 'renal'],
      reportFrequency: 'daily',
    },
  }],
]);

export async function institutionRoutes(fastify: FastifyInstance) {
  // Get all institutions
  fastify.get('/api/v1/institution', async () => {
    return {
      institutions: Array.from(institutions.values()),
    };
  });

  // Get institution by ID
  fastify.get('/api/v1/institution/:id', async (request) => {
    const { id } = request.params as { id: string };
    const institution = institutions.get(id);

    if (!institution) {
      return { error: 'Institution not found' };
    }

    return institution;
  });

  // Create institution
  fastify.post('/api/v1/institution', async (request) => {
    const { type, name, settings } = request.body as {
      type: InstitutionType;
      name: string;
      settings: Record<string, unknown>;
    };

    const id = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const institution = { id, type, name, settings };
    institutions.set(id, institution);

    return institution;
  });

  // School-specific endpoints
  fastify.get('/api/v1/institution/:id/nutrition-report', async (request) => {
    const { id } = request.params as { id: string };
    const institution = institutions.get(id);

    if (!institution || institution.type !== 'school') {
      return { error: 'School not found' };
    }

    // Mock nutrition report
    return {
      date: new Date().toISOString(),
      summary: {
        averageCalories: 648,
        averageProtein: 24,
        averageFat: 19,
        averageSodium: 780,
        participationRate: 92,
      },
      compliance: {
        calories: { target: 650, actual: 648, status: 'compliant' },
        protein: { target: 25, actual: 24, status: 'compliant' },
        fat: { target: 20, actual: 19, status: 'compliant' },
        sodium: { target: 900, actual: 780, status: 'compliant' },
      },
      topDishes: [
        { name: '红烧鸡腿', rating: 4.8, servings: 350 },
        { name: '番茄炒蛋', rating: 4.6, servings: 320 },
        { name: '紫菜蛋花汤', rating: 4.5, servings: 280 },
      ],
      allergenAlerts: 2,
    };
  });

  fastify.get('/api/v1/institution/:id/menu-plan', async (request) => {
    const { id } = request.params as { id: string };
    const { week } = request.query as { week?: number };

    const institution = institutions.get(id);
    if (!institution || institution.type !== 'school') {
      return { error: 'School not found' };
    }

    // Mock weekly menu
    return {
      week: week || 1,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        day,
        meals: [
          {
            type: 'breakfast',
            name: '营养早餐',
            dishes: ['白粥', '茶叶蛋', '馒头', '凉拌黄瓜'],
            nutrition: { calories: 350, protein: 12, fat: 8 },
          },
          {
            type: 'lunch',
            name: '均衡午餐',
            dishes: ['红烧鸡腿', '番茄炒蛋', '炒时蔬', '米饭'],
            nutrition: { calories: 650, protein: 28, fat: 18 },
          },
          {
            type: 'dinner',
            name: '轻盈晚餐',
            dishes: ['清蒸鱼', '炒土豆丝', '蔬菜汤', '米饭'],
            nutrition: { calories: 550, protein: 22, fat: 12 },
          },
        ],
      })),
    };
  });

  // Hospital-specific endpoints
  fastify.get('/api/v1/institution/:id/prescriptions', async (request) => {
    const { id } = request.params as { id: string };
    const { patientId } = request.query as { patientId?: string };

    const institution = institutions.get(id);
    if (!institution || institution.type !== 'hospital') {
      return { error: 'Hospital not found' };
    }

    // Mock dietary prescriptions
    return {
      prescriptions: [
        {
          id: 'rx-001',
          patientId: patientId || 'patient-001',
          condition: 'type_2_diabetes',
          type: 'diabetic_diet',
          targetCalories: 1600,
          mealCount: 4,
          notes: '低GI主食，限盐',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rx-002',
          patientId: patientId || 'patient-001',
          condition: 'hypertension',
          type: 'low_sodium_diet',
          targetSodium: 1500,
          mealCount: 3,
          notes: '限盐，增加钾摄入',
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });

  fastify.post('/api/v1/institution/:id/prescriptions', async (request) => {
    const { id } = request.params as { id: string };
    const { patientId, condition, dietType, targets } = request.body as {
      patientId: string;
      condition: string;
      dietType: string;
      targets: Record<string, number>;
    };

    const institution = institutions.get(id);
    if (!institution || institution.type !== 'hospital') {
      return { error: 'Hospital not found' };
    }

    return {
      id: `rx-${Date.now()}`,
      patientId,
      condition,
      type: dietType,
      targets,
      createdAt: new Date().toISOString(),
    };
  });

  // Enterprise-specific endpoints
  fastify.get('/api/v1/institution/:id/employee-stats', async (request) => {
    const { id } = request.params as { id: string };

    const institution = institutions.get(id);
    if (!institution || institution.type !== 'enterprise') {
      return { error: 'Enterprise not found' };
    }

    // Mock employee stats
    return {
      totalEmployees: 500,
      enrolled: 320,
      participationRate: 64,
      averageCalories: 680,
      topPreferences: ['减脂餐', '素食', '低盐餐'],
      feedback: {
        satisfaction: 4.5,
        suggestions: ['增加素食选项', '减少米饭量'],
      },
    };
  });

  // Nursing home-specific endpoints
  fastify.get('/api/v1/institution/:id/elderly-nutrition', async (request) => {
    const { id } = request.params as { id: string };

    const institution = institutions.get(id);
    if (!institution || institution.type !== 'nursing_home') {
      return { error: 'Nursing home not found' };
    }

    return {
      residents: 80,
      specialNeeds: {
        softFood: 45,
        lowSodium: 60,
        diabetic: 25,
        puree: 10,
      },
      recommendations: [
        '增加软烂易嚼的食物选项',
        '提高蛋白质摄入量防止肌肉流失',
        '注意维生素D和钙的补充',
        '控制钠摄入量',
      ],
    };
  });
}
