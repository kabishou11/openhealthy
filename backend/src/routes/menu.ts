/**
 * Menu Routes
 *
 * API endpoints for menu planning
 */

import { FastifyInstance } from 'fastify';
import { howToCookMCP } from '../mcp_tools/howtocook.js';
import { MenuPlannerAgent } from '../agents/langchain-agents.js';

// Initialize menu planner with default config (uses env vars)
const menuPlanner = new MenuPlannerAgent();

export async function menuRoutes(fastify: FastifyInstance) {
  // Search recipes
  fastify.get('/api/v1/menu/recipes', async (request) => {
    const {
      query,
      category,
      maxCookingTime,
      tags,
      taste,
    } = request.query as {
      query?: string;
      category?: string;
      maxCookingTime?: number;
      tags?: string;
      taste?: string;
    };

    const result = await howToCookMCP.searchRecipes({
      query,
      category,
    });

    return result;
  });

  // Get recipe by ID
  fastify.get('/api/v1/menu/recipes/:id', async (request) => {
    const { id } = request.params as { id: string };
    const recipe = await howToCookMCP.getRecipeById(id);

    if (!recipe) {
      return { error: 'Recipe not found' };
    }

    return recipe;
  });

  // Get random recipes
  fastify.get('/api/v1/menu/recipes/random', async (request) => {
    const { count } = request.query as { count?: number };
    const recipes = await howToCookMCP.getRandomRecipes(count || 3);
    return { recipes };
  });

  // Get categories
  fastify.get('/api/v1/menu/categories', async () => {
    const categories = await howToCookMCP.getCategories();
    return { categories };
  });

  // Generate weekly menu
  fastify.post('/api/v1/menu/generate', async (request) => {
    const { userId, userProfile, targets, options } = request.body as {
      userId?: string;
      userProfile?: {
        name?: string;
        age?: number;
        gender?: string;
        height?: number;
        weight?: number;
        bmi?: number;
        healthConditions?: string[];
        allergies?: string[];
        tastePreferences?: string;
      };
      targets?: Record<string, number>;
      options?: {
        duration?: number;
        excludeIngredients?: string[];
        budget?: string;
      };
    };

    // Calculate calories from targets or profile
    let calories = targets?.calories || 2000;
    if (!targets?.calories && userProfile?.weight && userProfile?.height && userProfile?.age && userProfile?.gender) {
      // Calculate BMR and TDEE
      let bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age;
      bmr += userProfile.gender === '男' ? 5 : -161;
      calories = Math.round(bmr * 1.55); // Light activity
    }

    // Generate menu plan using the agent
    const result = await menuPlanner.generatePlan(
      userProfile || {},
      calories,
      options?.duration || 7,
      options?.excludeIngredients
    );

    return {
      userId,
      userProfile,
      targets: {
        calories,
        protein: targets?.protein || Math.round(calories * 0.15 / 4),
        carbohydrates: targets?.carbohydrates || Math.round(calories * 0.55 / 4),
        fat: targets?.fat || Math.round(calories * 0.30 / 9),
      },
      plan: result,
    };
  });

  // Get recipes by ingredients (using howtocook search)
  fastify.post('/api/v1/menu/recipes/by-ingredients', async (request) => {
    const { ingredients } = request.body as { ingredients: string[] };
    // Simple search by matching ingredients in recipe names/descriptions
    const allRecipes = await howToCookMCP.searchRecipes({});
    const matched = allRecipes.recipes.filter(r =>
      ingredients.some(ing =>
        r.ingredients.some(i => i.name.includes(ing))
      )
    );
    return { recipes: matched };
  });
}
