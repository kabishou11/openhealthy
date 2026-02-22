/**
 * NutriMind Agent Framework
 *
 * Uses ModelScope API directly instead of LangChain/OpenAI
 */

import { createLogger } from '../utils/logger.js';
import { getModelScopeClient, ChatMessage } from '../modelscope/client.js';

const logger = createLogger('langchain-agent');

// ==================== Configuration ====================

export interface LangChainConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const defaultConfig: LangChainConfig = {
  model: process.env.OPENAI_MODEL || 'Qwen/Qwen3-8B',
  temperature: 0.1,
  maxTokens: 2000,
};

// ==================== ModelScope LLM Wrapper ====================

interface SimpleLLM {
  invoke(messages: ChatMessage[]): Promise<{ content: string }>;
  stream(messages: ChatMessage[]): AsyncGenerator<string>;
}

function createModelScopeLLM(config: LangChainConfig = defaultConfig): SimpleLLM {
  const client = getModelScopeClient();
  const model = config.model || defaultConfig.model!;
  const temperature = config.temperature ?? 0.1;
  const maxTokens = config.maxTokens ?? 2000;

  return {
    async invoke(messages) {
      if (!client.isConfigured()) {
        logger.warn('ModelScope token not configured - using fallback response');
        return { content: '' };
      }
      const response = await client.chatCompletion({ model, messages, temperature, maxTokens });
      return { content: response.choices[0]?.message?.content || '' };
    },
    async *stream(messages) {
      if (!client.isConfigured()) {
        yield '未配置 ModelScope Token，请在 .env 中设置 MODELSCOPE_TOKEN';
        return;
      }
      yield* client.streamChatCompletion({ model, messages, temperature, maxTokens });
    },
  };
}

export function getLLM(config?: LangChainConfig): SimpleLLM {
  return createModelScopeLLM(config);
}

export function getChatModel(config?: LangChainConfig): SimpleLLM {
  return getLLM(config);
}

// ==================== Base Agent Class ====================

export abstract class BaseLangChainAgent {
  protected llm: SimpleLLM;
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
    this.llm = createModelScopeLLM(config);
    logger.info(`Agent ${name} initialized`);
  }

  async execute(input: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        { role: 'system' as const, content: this.systemPrompt },
        { role: 'user' as const, content: input },
      ]);
      logger.info(`Agent ${this.name} executed successfully`);
      return response.content;
    } catch (error) {
      console.error(`Agent ${this.name} failed:`, error);
      throw error;
    }
  }

  async *stream(input: string): AsyncGenerator<string> {
    yield* this.llm.stream([
      { role: 'system' as const, content: this.systemPrompt },
      { role: 'user' as const, content: input },
    ]);
  }
}

// ==================== Nutrition Analysis Agent ====================

export class NutritionAnalyzerAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'NutritionAnalyzer',
      `你是 NutriMind 系统中的专业营养分析师。
根据用户的身体数据，计算 BMI、BMR、TDEE 和宏量营养素需求。
使用 Mifflin-St Jeor 公式计算 BMR。
用中文回答，提供清晰的 JSON 格式数据。`,
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
      `分析以下用户的营养需求：
- 身高: ${height}cm
- 体重: ${weight}kg
- 年龄: ${age}
- 性别: ${gender === 'male' ? '男' : '女'}
- 活动水平: ${activityLevel}

请提供 BMI、BMR、TDEE 和推荐宏量营养素（JSON格式）。`
    );
  }
}

// ==================== Diet Therapy Expert Agent ====================

export class DietTherapyExpertAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'DietTherapyExpert',
      `你是 NutriMind 系统中的中医食疗专家。
根据用户的健康状况，提供中医食疗建议、体质分析和季节养生方案。
用中文回答，温暖专业。`,
      config
    );
  }

  async getAdvice(healthConditions: string[]): Promise<string> {
    return this.execute(
      `用户健康状况：${healthConditions.join('、') || '无特殊情况'}
请提供中医食疗建议和饮食调理方案。`
    );
  }
}

// ==================== Menu Planner Agent ====================

export class MenuPlannerAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'MenuPlanner',
      `你是 NutriMind 系统中的专业营养师和菜单规划师。
根据用户信息生成个性化的每日餐单计划。
必须返回严格的 JSON 格式，包含 weeklyPlan 数组。`,
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
1. 必须返回 JSON 格式，结构如下：
{"weeklyPlan":[{"day":"周一","meals":[{"name":"早餐","dishes":[{"name":"燕麦粥"}],"totalNutrition":{"calories":400}},{"name":"午餐","dishes":[{"name":"米饭"},{"name":"清蒸鱼"}],"totalNutrition":{"calories":700}},{"name":"晚餐","dishes":[{"name":"蔬菜面"}],"totalNutrition":{"calories":500}}],"calories":1600}]}
2. 包含${days}天（周一到${days === 7 ? '周日' : `第${days}天`}）
3. 每天包含早餐、午餐、晚餐
4. 根据健康状况调整菜品（如糖尿病少糖、高血压少盐）
5. 避开过敏原

只返回JSON，不要其他文字。`;

    try {
      const response = await this.llm.invoke([
        { role: 'system' as const, content: this.systemPrompt },
        { role: 'user' as const, content: prompt },
      ]);

      const content = response.content;
      logger.info(`MenuPlanner generated response: ${content.substring(0, 200)}...`);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          logger.warn('Failed to parse JSON from MenuPlanner response');
        }
      }

      return { weeklyPlan: [], recommendations: ['餐单生成失败，请重试'], warnings: [] };
    } catch (error) {
      console.error('MenuPlanner failed:', error);
      return { weeklyPlan: [], recommendations: ['餐单生成失败'], warnings: ['系统错误，请稍后重试'] };
    }
  }
}

// ==================== Health Advisor Agent ====================

export class HealthAdvisorAgent extends BaseLangChainAgent {
  constructor(config: LangChainConfig = defaultConfig) {
    super(
      'HealthAdvisor',
      `你是 NutriMind 系统中温暖专业的健康顾问。
用中文进行自然的营养健康对话，提供循证建议，遇到医疗问题建议咨询专业医生。`,
      config
    );
  }

  async chat(message: string, context?: string): Promise<string> {
    const fullMessage = context ? `[背景: ${context}] ${message}` : message;
    return this.execute(fullMessage);
  }
}

// ==================== NutriMind Agent Network ====================

export class NutriMindAgentNetwork {
  private nutritionAnalyzer: NutritionAnalyzerAgent;
  private dietTherapyExpert: DietTherapyExpertAgent;
  private menuPlanner: MenuPlannerAgent;
  private healthAdvisor: HealthAdvisorAgent;

  constructor(config: LangChainConfig = defaultConfig) {
    this.nutritionAnalyzer = new NutritionAnalyzerAgent(config);
    this.dietTherapyExpert = new DietTherapyExpertAgent(config);
    this.menuPlanner = new MenuPlannerAgent(config);
    this.healthAdvisor = new HealthAdvisorAgent(config);
    logger.info('NutriMind Agent Network initialized');
  }

  async analyzeNutrition(height: number, weight: number, age: number, gender: 'male' | 'female', activityLevel: string): Promise<string> {
    return this.nutritionAnalyzer.analyze(height, weight, age, gender, activityLevel);
  }

  async getDietTherapyAdvice(healthConditions: string[]): Promise<string> {
    return this.dietTherapyExpert.getAdvice(healthConditions);
  }

  async generateMenuPlan(
    userInfo: { name?: string; age?: number; gender?: string; height?: number; weight?: number; bmi?: number; healthConditions?: string[]; allergies?: string[]; tastePreferences?: string },
    calories: number = 2000,
    days: number = 7,
    restrictions?: string[]
  ): Promise<Record<string, unknown>> {
    return this.menuPlanner.generatePlan(userInfo, calories, days, restrictions);
  }

  async chat(message: string, context?: string): Promise<string> {
    return this.healthAdvisor.chat(message, context);
  }

  async getStatus(): Promise<Record<string, boolean>> {
    return { nutritionAnalyzer: true, dietTherapyExpert: true, menuPlanner: true, healthAdvisor: true };
  }
}

// ==================== Tool Functions ====================

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
    const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
  },
  calculateMacros: (calories: number): { protein: number; carbs: number; fat: number } => ({
    protein: Math.round(calories * 0.18 / 4),
    carbs: Math.round(calories * 0.50 / 4),
    fat: Math.round(calories * 0.32 / 9),
  }),
};
