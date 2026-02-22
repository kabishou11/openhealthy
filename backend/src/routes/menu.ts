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
      difficulty,
      maxCookingTime,
      tags,
      taste,
    } = request.query as {
      query?: string;
      category?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      maxCookingTime?: number;
      tags?: string;
      taste?: string;
    };

    const result = await howToCookMCP.searchRecipes({
      query,
      category,
      difficulty,
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
    let result = await menuPlanner.generatePlan(
      userProfile || {},
      calories,
      options?.duration || 7,
      options?.excludeIngredients
    );

    // If LLM unavailable or returned empty plan, generate from recipe database
    const weeklyPlan = (result as any).weeklyPlan;
    if (!weeklyPlan || weeklyPlan.length === 0) {
      result = await generateMenuFromDatabase(calories, userProfile?.allergies, userProfile?.healthConditions);
    }

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

  // Get random meal by type (for single meal regeneration)
  fastify.get('/api/v1/menu/random-meal', async (request) => {
    const { type } = request.query as { type?: string };

    const categoryMap: Record<string, string> = {
      '早餐': '早餐',
      '午餐': '荤菜',
      '晚餐': '素菜',
    };

    const category = categoryMap[type || '午餐'] || '荤菜';
    const result = await howToCookMCP.searchRecipes({ category });
    const recipes = result.recipes;

    if (recipes.length === 0) {
      return { error: 'No recipes found' };
    }

    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const main = pick(recipes);
    const dishes: { name: string }[] = [{ name: main.name }];
    let totalCalories = main.nutrition?.calories || 400;

    if (type === '午餐') {
      const [stapleRes, soupRes] = await Promise.all([
        howToCookMCP.searchRecipes({ category: '主食' }),
        howToCookMCP.searchRecipes({ category: '汤' }),
      ]);
      const staple = pick(stapleRes.recipes);
      const soup = pick(soupRes.recipes);
      if (staple) { dishes.push({ name: staple.name }); totalCalories += staple.nutrition?.calories || 250; }
      if (soup) { dishes.push({ name: soup.name }); totalCalories += soup.nutrition?.calories || 80; }
    } else if (type === '晚餐') {
      const stapleRes = await howToCookMCP.searchRecipes({ category: '主食' });
      const staple = pick(stapleRes.recipes);
      if (staple) { dishes.push({ name: staple.name }); totalCalories += staple.nutrition?.calories || 250; }
    }

    return { name: type || '午餐', dishes, totalNutrition: { calories: totalCalories } };
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

// Generate a weekly menu from the recipe database (fallback when LLM unavailable)
async function generateMenuFromDatabase(
  calories: number,
  allergies?: string[],
  healthConditions?: string[]
): Promise<Record<string, unknown>> {
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const [breakfastResult, mainResult, vegResult, soupResult, stapleResult] = await Promise.all([
    howToCookMCP.searchRecipes({ category: '早餐' }),
    howToCookMCP.searchRecipes({ category: '荤菜' }),
    howToCookMCP.searchRecipes({ category: '素菜' }),
    howToCookMCP.searchRecipes({ category: '汤' }),
    howToCookMCP.searchRecipes({ category: '主食' }),
  ]);

  // Filter out allergens
  const filterRecipes = (recipes: any[]) => {
    if (!allergies?.length) return recipes;
    return recipes.filter(r =>
      !r.contraindications?.some((c: string) => allergies.includes(c))
    );
  };

  const breakfasts = filterRecipes(breakfastResult.recipes);
  const mains = filterRecipes(mainResult.recipes);
  const vegs = filterRecipes(vegResult.recipes);
  const soups = filterRecipes(soupResult.recipes);
  const staples = filterRecipes(stapleResult.recipes);

  // Shuffle array with seed offset for variety each call
  const shuffle = (arr: any[], offset: number) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (i * 7 + offset * 13) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const seed = Date.now() % 100;

  const weeklyPlan = dayNames.map((day, i) => {
    const bf = shuffle(breakfasts, seed + i)[0] || { name: '燕麦粥', nutrition: { calories: 350 } };
    const main = shuffle(mains, seed + i + 1)[0] || { name: '清蒸鱼', nutrition: { calories: 300 } };
    const veg = shuffle(vegs, seed + i + 2)[0] || { name: '炒时蔬', nutrition: { calories: 150 } };
    const soup = shuffle(soups, seed + i + 3)[0] || { name: '蔬菜汤', nutrition: { calories: 80 } };
    const staple = shuffle(staples, seed + i)[0] || { name: '米饭', nutrition: { calories: 250 } };

    const bfCal = bf.nutrition?.calories || 350;
    const lunchCal = (main.nutrition?.calories || 300) + (staple.nutrition?.calories || 250) + (soup.nutrition?.calories || 80);
    const dinnerCal = (veg.nutrition?.calories || 150) + (staple.nutrition?.calories || 250);
    const totalCal = bfCal + lunchCal + dinnerCal;

    return {
      day,
      meals: [
        { name: '早餐', dishes: [{ name: bf.name }], totalNutrition: { calories: bfCal } },
        { name: '午餐', dishes: [{ name: main.name }, { name: staple.name }, { name: soup.name }], totalNutrition: { calories: lunchCal } },
        { name: '晚餐', dishes: [{ name: veg.name }, { name: staple.name }], totalNutrition: { calories: dinnerCal } },
      ],
      calories: totalCal,
    };
  });

  return {
    weeklyPlan,
    recommendations: ['基于食谱库生成的个性化餐单'],
    warnings: [],
  };
}
