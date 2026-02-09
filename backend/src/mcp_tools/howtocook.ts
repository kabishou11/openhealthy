/**
 * HowToCook MCP Tool
 *
 * Wrapper around the comprehensive recipe database
 */

import { recipeDatabase, Recipe } from './recipe-database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('howtocook-mcp');

// For backward compatibility
export interface SearchParams {
  query?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  tags?: string[];
  taste?: string;
  suitableFor?: string[];
}

export class HowToCookMCP {
  async searchRecipes(params: SearchParams = {}) {
    return recipeDatabase.searchRecipes({
      query: params.query,
      category: params.category,
      difficulty: params.difficulty,
      tags: params.tags,
      taste: params.taste,
    });
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    // Support both old id format (howtocook-xxx) and new
    const fullId = id.startsWith('howtocook-') ? id : `howtocook-${id}`;
    return recipeDatabase.getRecipeById(fullId);
  }

  async getRandomRecipes(count: number = 3): Promise<Recipe[]> {
    return recipeDatabase.getRandomRecipes(count);
  }

  async getCategories(): Promise<string[]> {
    return recipeDatabase.getCategories();
  }

  async getAllTags(): Promise<string[]> {
    return recipeDatabase.getAllTags();
  }

  async getRecipesByContraindication(healthCondition: string): Promise<Recipe[]> {
    return recipeDatabase.getByContraindication(healthCondition);
  }

  async getSuitableRecipes(healthConditions: string[]): Promise<Recipe[]> {
    return recipeDatabase.getSuitableFor(healthConditions);
  }

  async getRecipeNutrition(id: string) {
    const recipe = await this.getRecipeById(id);
    return recipe?.nutrition || null;
  }

  async getRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    const all = await recipeDatabase.searchRecipes({});
    return all.recipes.filter(r =>
      ingredients.some(ing =>
        r.ingredients.some(i => i.name.includes(ing))
      )
    );
  }

  getDatabaseSize(): number {
    return recipeDatabase.getSize();
  }
}

export const howToCookMCP = new HowToCookMCP();

// Log initial size
setTimeout(() => {
  logger.info(`Recipe database loaded: ${howToCookMCP.getDatabaseSize()} recipes`);
}, 100);
