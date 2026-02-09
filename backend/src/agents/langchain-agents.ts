/**
 * LangChain-based Agent Framework for NutriMind
 *
 * Simplified integration with LangChain for nutrition AI agents
 */

import { createLogger } from '../utils/logger.js';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

const logger = createLogger('langchain-agent');

// ==================== Configuration ====================

export interface LangChainConfig {
  openaiApiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const defaultConfig: LangChainConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-72B-Instruct',
  temperature: 0.1,
  maxTokens: 2000,
};

// ==================== LLM Setup ====================

let llm: ChatOpenAI | null = null;

export function getLLM(config: LangChainConfig = defaultConfig): ChatOpenAI {
  if (!llm) {
    // Check if API key is available
    if (!config.openaiApiKey) {
      logger.warn('OpenAI API key not configured - using mock responses');
      // Return a mock LLM for testing without API key
      return createMockLLM();
    }
    llm = new ChatOpenAI({
      apiKey: config.openaiApiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      streaming: true,
    });
    logger.info(`Initialized ChatOpenAI with model: ${config.model}`);
  }
  return llm;
}

// Mock LLM for testing without API key
function createMockLLM(): ChatOpenAI {
  return {
    invoke: async (input: any) => {
      const content = Array.isArray(input)
        ? input[input.length - 1]?.content || ''
        : input?.content || '';
      return { content: `[Mock Response] ${content}` };
    },
    stream: async function* (input: any) {
      const content = Array.isArray(input)
        ? input[input.length - 1]?.content || ''
        : input?.content || '';
      yield `[Mock Response] ${content}`;
    },
  } as unknown as ChatOpenAI;
}

// Alias for backwards compatibility
export function getChatModel(config?: LangChainConfig): ChatOpenAI {
  return getLLM(config);
}

// ==================== Base Agent Class ====================

export abstract class BaseLangChainAgent {
  protected llm: ChatOpenAI;
  protected config: LangChainConfig;
  protected name: string;
  protected systemPrompt: string;

  constructor(
    name: string,
    systemPrompt: string,
    config: LangChainConfig = defaultConfig
  ) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.config = config;
    this.llm = getLLM(config);
    logger.info(`Agent ${name} initialized`);
  }

  /**
   * Get the agent's system prompt
   */
  protected getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Execute the agent with input
   */
  async execute(input: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: input },
      ]);

      const content = typeof response === 'string' ? response : response.content;
      logger.info(`Agent ${this.name} executed successfully`);
      return content as string;
    } catch (error) {
      console.error(`Agent ${this.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Stream execution results
   */
  async *stream(input: string): AsyncGenerator<string> {
    const stream = await this.llm.stream([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: input },
    ]);

    for await (const chunk of stream) {
      const content = typeof chunk === 'string' ? chunk : chunk.content;
      yield content as string;
    }
  }
}

// ==================== Nutrition Analysis Agent ====================

export class NutritionAnalyzerAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'NutritionAnalyzer',
      `You are a professional Nutrition Analyst Agent in the NutriMind system.

## Your Role
Analyze user health data and calculate personalized nutritional requirements.

## Guidelines
1. Calculate BMI and BMR using standard formulas
2. Determine daily caloric needs based on activity level
3. Calculate macronutrient distribution
4. Generate comprehensive nutrition reports

## Formulas
- BMI = weight(kg) / height(m)^2
- BMR (Mifflin-St Jeor): Men=10W+6.25H-5A+5, Women=10W+6.25H-5A-161
- TDEE = BMR × Activity Multiplier (1.2-1.9)

## Output Format
Provide clear, structured JSON with BMI, BMR, TDEE, and macro breakdown.`,
      config
    );
  }

  async analyze(
    height: number,
    weight: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: string
  ): Promise<string> {
    return this.execute(
      `Analyze nutrition needs for:
- Height: ${height}cm
- Weight: ${weight}kg
- Age: ${age}
- Gender: ${gender}
- Activity Level: ${activityLevel}

Provide BMI, BMR, TDEE, and recommended macronutrients in JSON format.`
    );
  }
}

// ==================== Diet Therapy Expert Agent ====================

export class DietTherapyExpertAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'DietTherapyExpert',
      `You are a professional Diet Therapy Expert Agent specializing in TCM nutrition.

## Your Role
Provide TCM-based dietary recommendations for:
1. Body constitution analysis
2. Seasonal adjustments
3. Food nature and flavor properties
4. Disease-specific dietary therapy

## TCM Constitutions
- Yin Deficiency: Heat signs, dry mouth → Cool/yin foods
- Yang Deficiency: Cold intolerance → Warm/yang foods
- Qi Deficiency: Weak voice → Qi-tonifying foods
- Phlegm-Dampness: Heavy body → Transform dampness foods

Provide recommendations in Chinese.`,
      config
    );
  }

  async getAdvice(healthConditions: string[]): Promise<string> {
    return this.execute(
      `Provide TCM diet therapy advice for conditions: ${healthConditions.join(', ')}

Include:
1. Recommended foods
2. Foods to avoid
3. Seasonal tips`
    );
  }

  async analyzeConstitution(healthConditions: string[]): Promise<string> {
    return this.execute(
      `Analyze TCM constitution based on: ${healthConditions.join(', ')}

Respond in JSON format with:
- primary_constitution
- description
- dietary_principles`
    );
  }
}

// ==================== Menu Planner Agent ====================

export class MenuPlannerAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'MenuPlanner',
      `你是一个专业的菜单规划助手，为用户生成营养均衡的周餐计划。

## 你的角色
根据用户的身体数据和健康状况，生成个性化的周餐计划：
1. 满足每日营养需求目标
2. 遵守饮食限制和过敏原
3. 提供多样化和营养均衡的饮食
4. 考虑用户的口味偏好

## 输出格式
必须返回严格符合以下 JSON Schema 的结构化数据：

\`\`\`json
{
  "weeklyPlan": [
    {
      "day": "周一",
      "calories": 2000,
      "meals": [
        {
          "name": "早餐",
          "dishes": [
            {
              "name": "菜品名称",
              "portion": "100g",
              "calories": 300,
              "protein": 15,
              "carbs": 40,
              "fat": 10,
              "description": "简短描述"
            }
          ],
          "totalNutrition": {
            "calories": 500,
            "protein": 20,
            "carbs": 60,
            "fat": 15
          }
        }
      ]
    }
  ],
  "recommendations": ["建议1", "建议2"],
  "warnings": ["注意事项1"]
}
\`\`\`

## 注意事项
- 每日三餐两点（早餐、午餐、晚餐、加餐）
- 严格控制总热量误差在 ±100kcal 以内
- 蛋白质、碳水、脂肪比例合理
- 包含实用的烹饪小贴士`,
      config
    );
  }

  async generatePlan(
    userInfo: {
      name?: string
      age?: number
      gender?: string
      height?: number
      weight?: number
      bmi?: number
      healthConditions?: string[]
      allergies?: string[]
      tastePreferences?: string
    },
    calories: number = 2000,
    days: number = 7,
    restrictions?: string[]
  ): Promise<Record<string, unknown>> {
    const prompt = `生成一份${days}天的餐单计划，每天目标热量 ${calories} kcal。

用户信息：
- 姓名: ${userInfo.name || '未提供'}
- 年龄: ${userInfo.age || '未提供'}
- 性别: ${userInfo.gender || '未提供'}
- 身高: ${userInfo.height || '未提供'}cm
- 体重: ${userInfo.weight || '未提供'}kg
- BMI: ${userInfo.bmi?.toFixed(1) || '未提供'}
- 健康状况: ${userInfo.healthConditions?.join(', ') || '无'}
- 过敏原: ${userInfo.allergies?.join(', ') || '无'}
- 口味偏好: ${userInfo.tastePreferences || '无'}

饮食限制: ${restrictions?.join(', ') || '无'}

要求：
1. 必须返回 JSON 格式数据，不要其他内容
2. 每天包含：早餐、午餐、晚餐、加餐
3. 每个餐次包含具体菜品、份量、营养成分
4. 计算每日总热量，确保在目标热量 ±100kcal 范围内
5. 根据健康状况调整菜品选择（如有糖尿病少糖、高血压少盐）
6. 避开过敏原

只返回JSON，不要其他文字。`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt },
      ]);

      // Extract content from response
      let content = '';
      if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response === 'object' && 'content' in response) {
        content = (response as any).content || '';
      }

      logger.info(`MenuPlanner generated response: ${content.substring(0, 200)}...`);

      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse JSON, returning raw content');
        }
      }

      // If JSON parsing fails, return structured error
      return {
        weeklyPlan: [],
        recommendations: ['餐单生成失败，请重试'],
        warnings: [],
        rawResponse: content,
      };
    } catch (error) {
      console.error('MenuPlanner failed:', error);
      return {
        weeklyPlan: [],
        recommendations: ['餐单生成失败'],
        warnings: ['系统错误，请稍后重试'],
      };
    }
  }
}

// ==================== Health Advisor Agent ====================

export class HealthAdvisorAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'HealthAdvisor',
      `You are a warm, professional Health Advisor Agent in the NutriMind system.

## Your Role
Engage in natural conversations about nutrition and health.

## Guidelines
- Be helpful and informative
- Ask clarifying questions when needed
- Provide evidence-based information
- Suggest consulting professionals for medical concerns
- Never diagnose or prescribe medication

Respond in Chinese, be warm and caring.`,
      config
    );
  }

  async chat(message: string, context?: string): Promise<string> {
    const fullMessage = context ? `[Context: ${context}] ${message}` : message;
    return this.execute(fullMessage);
  }
}

// ==================== NutriMind Agent Network ====================

export class NutriMindAgentNetwork {
  private nutritionAnalyzer: NutritionAnalyzerAgent;
  private dietTherapyExpert: DietTherapyExpertAgent;
  private menuPlanner: MenuPlannerAgent;
  private healthAdvisor: HealthAdvisorAgent;
  private config: LangChainConfig;

  constructor(config: LangChainConfig = defaultConfig) {
    this.config = config;
    this.nutritionAnalyzer = new NutritionAnalyzerAgent(config);
    this.dietTherapyExpert = new DietTherapyExpertAgent(config);
    this.menuPlanner = new MenuPlannerAgent(config);
    this.healthAdvisor = new HealthAdvisorAgent(config);
    logger.info('NutriMind Agent Network initialized');
  }

  /**
   * Analyze nutrition needs
   */
  async analyzeNutrition(
    height: number,
    weight: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: string
  ): Promise<string> {
    return this.nutritionAnalyzer.analyze(height, weight, age, gender, activityLevel);
  }

  /**
   * Get diet therapy advice
   */
  async getDietTherapyAdvice(healthConditions: string[]): Promise<string> {
    return this.dietTherapyExpert.getAdvice(healthConditions);
  }

  /**
   * Generate menu plan
   */
  async generateMenuPlan(
    userInfo: {
      name?: string
      age?: number
      gender?: string
      height?: number
      weight?: number
      bmi?: number
      healthConditions?: string[]
      allergies?: string[]
      tastePreferences?: string
    },
    calories: number = 2000,
    days: number = 7,
    restrictions?: string[]
  ): Promise<Record<string, unknown>> {
    return this.menuPlanner.generatePlan(userInfo, calories, days, restrictions);
  }

  /**
   * Chat with health advisor
   */
  async chat(message: string, context?: string): Promise<string> {
    return this.healthAdvisor.chat(message, context);
  }

  /**
   * Get network status
   */
  async getStatus(): Promise<Record<string, boolean>> {
    return {
      nutritionAnalyzer: true,
      dietTherapyExpert: true,
      menuPlanner: true,
      healthAdvisor: true,
    };
  }
}

// ==================== Tool Functions (Simple) ====================

export const tools = {
  calculateBMI: (height: number, weight: number): number => {
    const heightM = height / 100;
    return Math.round((weight / (heightM * heightM)) * 10) / 10;
  },

  calculateBMR: (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (gender === 'male') bmr += 5;
    else bmr -= 161;
    return Math.round(bmr);
  },

  calculateTDEE: (bmr: number, activityLevel: string): number => {
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
  },

  calculateMacros: (calories: number): { protein: number; carbs: number; fat: number } => {
    return {
      protein: Math.round(calories * 0.18 / 4),
      carbs: Math.round(calories * 0.50 / 4),
      fat: Math.round(calories * 0.32 / 9),
    };
  },
};
