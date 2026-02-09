/**
 * Nutrition Routes
 *
 * API endpoints for nutrition analysis and calculations
 */

import { FastifyInstance } from 'fastify';
import { nutritionDatabaseMCP } from '../mcp_tools/nutrition-db.js';
import { userHealthMCP } from '../mcp_tools/user-health.js';
import { NutritionAnalyzerAgent } from '../agents/langchain-agents.js';

const nutritionAnalyzer = new NutritionAnalyzerAgent({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
});

export async function nutritionRoutes(fastify: FastifyInstance) {
  // Search foods
  fastify.get('/api/v1/nutrition/foods', async (request) => {
    const { query, category, minProtein, minFiber, maxCalories, tags } = request.query as {
      query?: string;
      category?: string;
      minProtein?: number;
      minFiber?: number;
      maxCalories?: number;
      tags?: string;
    };

    const result = await nutritionDatabaseMCP.searchFoods({
      query,
      category,
      minProtein,
      minFiber,
      maxCalories,
      tags: tags ? tags.split(',') : undefined,
    });

    return result;
  });

  // Get food by ID
  fastify.get('/api/v1/nutrition/foods/:id', async (request) => {
    const { id } = request.params as { id: string };
    const food = await nutritionDatabaseMCP.getFoodById(id);

    if (!food) {
      return { error: 'Food not found' };
    }

    return food;
  });

  // Get food nutrition
  fastify.get('/api/v1/nutrition/foods/:id/nutrition', async (request) => {
    const { id } = request.params as { id: string };
    const { servingSize } = request.query as { servingSize?: number };

    const nutrition = await nutritionDatabaseMCP.getNutritionInfo(id, servingSize);

    if (!nutrition) {
      return { error: 'Food not found' };
    }

    return nutrition;
  });

  // Calculate meal nutrition
  fastify.post('/api/v1/nutrition/calculate', async (request) => {
    const { foods } = request.body as {
      foods: Array<{ id: string; amount: number }>;
    };

    const nutrition = await nutritionDatabaseMCP.calculateMealNutrition(foods);
    return nutrition;
  });

  // Get categories
  fastify.get('/api/v1/nutrition/categories', async () => {
    const categories = await nutritionDatabaseMCP.getCategories();
    return { categories };
  });

  // Get foods high in nutrient
  fastify.get('/api/v1/nutrition/high/:nutrient', async (request) => {
    const { nutrient } = request.params as { nutrient: string };
    const { limit } = request.query as { limit?: number };

    // Validate nutrient
    const validNutrients = [
      'protein', 'carbohydrates', 'fat', 'fiber', 'calcium',
      'iron', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE'
    ];

    if (!validNutrients.includes(nutrient)) {
      return { error: 'Invalid nutrient' };
    }

    const foods = await nutritionDatabaseMCP.getHighInNutrient(
      nutrient as Parameters<typeof nutritionDatabaseMCP.getHighInNutrient>[0],
      limit || 10
    );

    return { foods };
  });

  // Analyze nutrition needs
  fastify.post('/api/v1/nutrition/analyze', async (request) => {
    const { userId } = request.body as { userId: string };

    const targets = await userHealthMCP.calculateNutritionTargets(userId);
    const profile = await userHealthMCP.getProfile(userId);

    if (!targets || !profile) {
      return { error: 'User not found' };
    }

    // Generate analysis using the agent
    const gender = profile.gender === 'other' ? 'female' : profile.gender;
    const analysis = await nutritionAnalyzer.analyze(
      profile.height,
      profile.weight,
      profile.age,
      gender,
      profile.activityLevel
    );

    return {
      profile: {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        bmi: profile.bmi,
        healthConditions: profile.healthConditions,
      },
      targets,
      analysis,
    };
  });

  // Get health trends
  fastify.get('/api/v1/nutrition/trends/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    const trends = await userHealthMCP.getHealthTrends(userId);

    if (!trends) {
      return { error: 'User not found' };
    }

    return trends;
  });
}
