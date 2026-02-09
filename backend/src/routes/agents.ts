/**
 * Agent Routes
 *
 * API endpoints for LangChain-based agent operations
 */

import { FastifyInstance } from 'fastify';
import { NutriMindAgentNetwork } from '../agents/langchain-agents.js';

const agentNetwork = new NutriMindAgentNetwork();

export async function agentRoutes(fastify: FastifyInstance) {
  // Get agent status
  fastify.get('/api/v1/agents/status', async () => {
    const status = await agentNetwork.getStatus();
    return {
      framework: 'LangChain',
      version: '0.2.0',
      agents: status,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    };
  });

  // Full nutrition consultation (using LangChain agent)
  fastify.post('/api/v1/agents/consultation', async (request) => {
    const { height, weight, age, gender, activityLevel, healthConditions } = request.body as {
      height: number;
      weight: number;
      age: number;
      gender: 'male' | 'female';
      activityLevel: string;
      healthConditions?: string[];
    };

    try {
      // Run agents in sequence
      const nutritionAnalysis = await agentNetwork.analyzeNutrition(
        height,
        weight,
        age,
        gender,
        activityLevel
      );

      const dietTherapy = healthConditions?.length
        ? await agentNetwork.getDietTherapyAdvice(healthConditions)
        : 'No specific health conditions provided.';

      const menuPlan = await agentNetwork.generateMenuPlan({}, 2000, 7);

      return {
        success: true,
        framework: 'LangChain',
        results: {
          nutritionAnalysis,
          dietTherapy,
          menuPlan,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Nutrition analysis
  fastify.post('/api/v1/agents/analyze', async (request) => {
    const { height, weight, age, gender, activityLevel } = request.body as {
      height: number;
      weight: number;
      age: number;
      gender: 'male' | 'female';
      activityLevel: string;
    };

    const result = await agentNetwork.analyzeNutrition(
      height,
      weight,
      age,
      gender,
      activityLevel
    );

    return {
      success: true,
      result,
    };
  });

  // Diet therapy advice
  fastify.post('/api/v1/agents/diet-therapy', async (request) => {
    const { healthConditions } = request.body as {
      healthConditions: string[];
    };

    const result = await agentNetwork.getDietTherapyAdvice(healthConditions);

    return {
      success: true,
      result,
    };
  });

  // Generate menu plan
  fastify.post('/api/v1/agents/menu-plan', async (request) => {
    const { calories, days, restrictions, userInfo } = request.body as {
      calories?: number;
      days?: number;
      restrictions?: string[];
      userInfo?: {
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
    };

    const result = await agentNetwork.generateMenuPlan(
      userInfo || {},
      calories || 2000,
      days || 7,
      restrictions
    );

    return {
      success: true,
      result,
    };
  });

  // Chat with health advisor (LangChain-powered)
  fastify.post('/api/v1/agents/chat', async (request) => {
    const { message, context } = request.body as {
      message: string;
      context?: {
        userProfile?: {
          name?: string;
          healthConditions?: string[];
        };
      };
    };

    if (!message) {
      return { error: 'Message is required' };
    }

    try {
      const response = await agentNetwork.chat(message);

      return {
        success: true,
        response,
        sessionId: `session-${Date.now()}`,
        framework: 'LangChain',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // TCM constitution analysis
  fastify.post('/api/v1/agents/constitution', async (request) => {
    const { healthConditions } = request.body as {
      healthConditions: string[];
    };

    const constitution = await agentNetwork.getDietTherapyAdvice(healthConditions);

    return {
      success: true,
      constitution,
    };
  });
}
