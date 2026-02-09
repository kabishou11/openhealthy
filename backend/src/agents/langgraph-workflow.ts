/**
 * NutriMind LangGraph Workflow Implementation
 *
 * A comprehensive multi-agent orchestration system using LangGraph
 * Features:
 * - Complete conditional routing based on intent
 * - State persistence with Redis
 * - Conversation history management
 * - Session recovery
 */

import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { redisClient } from '../utils/redis.js';
import { config } from '../config.js';

// ==================== State Definition ====================

export interface NutriMindState {
  // Session info
  sessionId: string;
  userId: string | null;

  // User context
  userProfile: UserProfile | null;
  healthData: HealthData | null;

  // Conversation
  messages: ConversationMessage[];
  messageCount: number;

  // Task context
  currentIntent: IntentType | null;
  currentTask: string | null;
  taskHistory: TaskRecord[];

  // Processing state
  contextGathered: boolean;
  contextRequirements: ContextRequirement[];
  toolsExecuted: boolean;
  toolResults: Record<string, unknown>;

  // Recommendations
  recommendations: string[];
  nutritionReport: string | null;

  // Workflow control
  workflowStage: WorkflowStage;
  error: string | null;
  needsHumanReview: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TaskRecord {
  taskType: IntentType;
  node: string;
  result: unknown;
  timestamp: Date;
  duration: number;
}

export interface ContextRequirement {
  field: string;
  description: string;
  requiredFor: IntentType[];
}

export type IntentType =
  | 'nutrition_analysis'
  | 'diet_therapy'
  | 'menu_planning'
  | 'health_chat'
  | 'recipe_search'
  | 'profile_update'
  | 'unknown';

export type WorkflowStage =
  | 'init'
  | 'classifying'
  | 'gathering_context'
  | 'analyzing'
  | 'generating'
  | 'synthesizing'
  | 'completed'
  | 'error';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  bmi: number;
  bmr: number;
  activityLevel: string;
  healthConditions: string[];
  allergies: string[];
  dietaryPreferences: string[];
  tastePreferences: string;
  goals?: string[]; // Optional for compatibility
}

export interface HealthData {
  weight: number[];
  bloodPressure?: { systolic: number; diastolic: number }[];
  bloodSugar?: number[];
  symptoms: string[];
  lastCheckup: Date;
}

// ==================== Intent Classification Schema ====================

const IntentSchema = z.object({
  intent: z.enum([
    'nutrition_analysis',
    'diet_therapy',
    'menu_planning',
    'health_chat',
    'recipe_search',
    'profile_update',
    'unknown',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedContext: z.array(z.string()).optional(),
});

type IntentResult = z.infer<typeof IntentSchema>;

// ==================== Configuration ====================

interface LangGraphConfig {
  modelScopeApiKey?: string;
  modelScopeApiBase?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sessionTtl?: number; // Redis TTL in seconds
}

// Get config dynamically (reads env vars at call time)
function getDefaultConfig(): LangGraphConfig {
  return {
    modelScopeApiKey: process.env.MODELSCOPE_TOKEN || process.env.OPENAI_API_KEY || '',
    modelScopeApiBase: process.env.MODELSCOPE_API_URL || 'https://api-inference.modelscope.cn/v1',
    model: process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-72B-Instruct',  // Default to Qwen2.5-72B (faster)
    temperature: 0.1,
    maxTokens: 2000,
    sessionTtl: 86400,
  }
}

// ==================== LLM Setup ====================

let llmInstance: ChatOpenAI | null = null;

// Direct API call helper for ModelScope (bypasses LangChain issues)
async function callModelScopeAPI(messages: { role: string; content: string }[], maxTokens: number = 500): Promise<string> {
  const apiKey = process.env.MODELSCOPE_TOKEN || process.env.OPENAI_API_KEY || '';
  const apiBase = process.env.MODELSCOPE_API_URL || 'https://api-inference.modelscope.cn/v1';
  const model = process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('ModelScope API call failed:', error);
    throw error;
  }
}

export function getLLM(config?: LangGraphConfig): ChatOpenAI | null {
  const cfg = config || getDefaultConfig()
  if (!llmInstance && cfg.modelScopeApiKey) {
    llmInstance = new ChatOpenAI({
      apiKey: cfg.modelScopeApiKey,
      model: cfg.model,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
      configuration: {
        baseURL: cfg.modelScopeApiBase,
      },
    })
    console.log(`[LangGraph] LLM initialized with model: ${cfg.model} at ${cfg.modelScopeApiBase}`)
  }
  return llmInstance
}

// Mock LLM for testing without API key
export function createMockLLM(): ChatOpenAI {
  // Helper to extract text content from messages
  const extractContent = (input: BaseMessage | BaseMessage[]): string => {
    const messages = Array.isArray(input) ? input : [input];
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage === 'string') return lastMessage;
    if (lastMessage && typeof lastMessage === 'object' && 'content' in lastMessage) {
      const content = (lastMessage as any).content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ');
      }
    }
    return '';
  };

  const mockResponses: Record<string, string> = {
    nutrition_analysis: '营养分析完成。根据您的身高体重，计算BMI为XX，建议每日摄入热量约XX kcal。',
    diet_therapy: '根据中医食疗理论，建议您多吃健脾养胃的食物，如山药、小米、红枣等。',
    menu_planning: '为您设计了一周的健康菜单计划，早餐以粗粮为主，午餐均衡营养，晚餐清淡为主。',
    health_chat: '您好！我是 NutriMind 智能营养师，很高兴为您服务。',
    recipe_search: '为您找到以下菜谱...',
    profile_update: '个人资料已更新。',
    unknown: '我不太明白您的问题，请换个方式描述。',
  };

  return {
    invoke: async (input: BaseMessage | BaseMessage[]): Promise<AIMessage> => {
      const content = extractContent(input);
      return new AIMessage(`[Mock] ${content}`);
    },
    withStructuredOutput: (_schema: z.ZodType<any>) => {
      return {
        invoke: async (input: BaseMessage | BaseMessage[]): Promise<any> => {
          const content = extractContent(input).toLowerCase();

          // Simple keyword matching for intent classification
          let intent: IntentType = 'health_chat';

          if (content.includes('营养') || content.includes('bmi') || content.includes('热量')) {
            intent = 'nutrition_analysis';
          } else if (content.includes('食疗') || content.includes('体质') || content.includes('中医')) {
            intent = 'diet_therapy';
          } else if (content.includes('菜单') || content.includes('计划') || content.includes('吃')) {
            intent = 'menu_planning';
          } else if (content.includes('菜谱') || content.includes('食谱') || content.includes('怎么做')) {
            intent = 'recipe_search';
          } else if (content.includes('身高') || content.includes('体重') || content.includes('更新')) {
            intent = 'profile_update';
          }

          return {
            intent,
            confidence: 0.85,
            reasoning: 'Mock classification based on keywords',
            suggestedContext: intent === 'nutrition_analysis' ? ['height', 'weight', 'age', 'gender'] : undefined,
          };
        },
      };
    },
  } as unknown as ChatOpenAI;
}

// ==================== State Persistence ====================

const STATE_PREFIX = 'nutrimind:state:';
const HISTORY_PREFIX = 'nutrimind:history:';

export class StatePersistence {
  private config: LangGraphConfig;

  constructor(config?: LangGraphConfig) {
    this.config = config || getDefaultConfig();
  }

  /**
   * Save state to Redis
   */
  async saveState(sessionId: string, state: NutriMindState): Promise<boolean> {
    try {
      const key = `${STATE_PREFIX}${sessionId}`;
      const data = {
        ...state,
        updatedAt: new Date().toISOString(),
      };

      if (redisClient) {
        await redisClient.setEx(key, this.config.sessionTtl || 86400, JSON.stringify(data));
      } else {
        // Fallback to in-memory storage
        await this.saveToMemory(sessionId, data);
      }

      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  /**
   * Load state from Redis
   */
  async loadState(sessionId: string): Promise<NutriMindState | null> {
    try {
      const key = `${STATE_PREFIX}${sessionId}`;

      if (redisClient) {
        const data = await redisClient.get(key);
        if (data) {
          return JSON.parse(data) as NutriMindState;
        }
      } else {
        const data = await this.loadFromMemory(sessionId);
        if (data) {
          return data as NutriMindState;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  /**
   * Save message to conversation history
   */
  async saveMessage(sessionId: string, message: ConversationMessage): Promise<boolean> {
    try {
      const key = `${HISTORY_PREFIX}${sessionId}`;

      if (redisClient) {
        await redisClient.rPush(key, JSON.stringify(message));
        await redisClient.expire(key, this.config.sessionTtl || 86400);
      } else {
        await this.appendToMemoryHistory(sessionId, message);
      }

      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }

  /**
   * Load conversation history
   */
  async loadHistory(sessionId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const key = `${HISTORY_PREFIX}${sessionId}`;

      if (redisClient) {
        const messages = await redisClient.lRange(key, -limit, -1);
        return messages.map(m => JSON.parse(m) as ConversationMessage);
      } else {
        return await this.getMemoryHistory(sessionId);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * Clear session data
   */
  async clearSession(sessionId: string): Promise<boolean> {
    try {
      const stateKey = `${STATE_PREFIX}${sessionId}`;
      const historyKey = `${HISTORY_PREFIX}${sessionId}`;

      if (redisClient) {
        await redisClient.del(stateKey);
        await redisClient.del(historyKey);
      } else {
        await this.clearMemory(sessionId);
      }

      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
      return false;
    }
  }

  // In-memory fallback storage
  private memoryStore: Map<string, { state: any; history: ConversationMessage[] }> = new Map();

  private async saveToMemory(sessionId: string, data: any): Promise<void> {
    const existing = this.memoryStore.get(sessionId) || { state: null, history: [] };
    existing.state = data;
    this.memoryStore.set(sessionId, existing);
  }

  private async loadFromMemory(sessionId: string): Promise<any> {
    return this.memoryStore.get(sessionId)?.state || null;
  }

  private async appendToMemoryHistory(sessionId: string, message: ConversationMessage): Promise<void> {
    const existing = this.memoryStore.get(sessionId) || { state: null, history: [] };
    existing.history.push(message);
    if (existing.history.length > 100) {
      existing.history = existing.history.slice(-100);
    }
    this.memoryStore.set(sessionId, existing);
  }

  private async getMemoryHistory(sessionId: string): Promise<ConversationMessage[]> {
    return this.memoryStore.get(sessionId)?.history || [];
  }

  private async clearMemory(sessionId: string): Promise<void> {
    this.memoryStore.delete(sessionId);
  }
}

// ==================== Node Functions ====================

const statePersistence = new StatePersistence();

/**
 * Node 1: Initialize State
 * Initialize or restore state for a new conversation turn
 */
export async function initializeStateNode(
  sessionId: string,
  userId: string | null,
  userMessage: string,
  profile?: UserProfile
): Promise<NutriMindState> {
  // Try to load existing state
  const existingState = await statePersistence.loadState(sessionId);

  if (existingState) {
    // Restore existing state
    return {
      ...existingState,
      messages: [
        ...existingState.messages,
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        },
      ],
      messageCount: existingState.messageCount + 1,
      workflowStage: 'init',
      updatedAt: new Date(),
    };
  }

  // Create new state
  return {
    sessionId,
    userId,
    userProfile: profile || null,
    healthData: null,
    messages: [
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ],
    messageCount: 1,
    currentIntent: null,
    currentTask: null,
    taskHistory: [],
    contextGathered: true,
    contextRequirements: [],
    toolsExecuted: false,
    toolResults: {},
    recommendations: [],
    nutritionReport: null,
    workflowStage: 'init',
    error: null,
    needsHumanReview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Node 2: Classify Intent
 * Classifies user intent and determines required context
 */
export async function classifyIntentNode(
  state: NutriMindState,
  startTime: number
): Promise<Partial<NutriMindState>> {
  const llm = getLLM() || createMockLLM();
  const lastMessage = state.messages[state.messages.length - 1]?.content || '';

  const systemPrompt = `你是一个智能营养助手的消息分类器。
根据用户消息，分类到以下意图之一（只需返回意图名称）：

1. nutrition_analysis - 分析营养需求、BMI、BMR、代谢率等计算
2. diet_therapy - 中医食疗建议、体质分析、季节养生
3. menu_planning - 生成菜单、计划饮食、推荐菜品
4. health_chat - 一般健康问答、聊天、咨询
5. recipe_search - 搜索菜谱、查询食谱做法
6. profile_update - 更新个人资料、健康档案
7. unknown - 无法分类

用户消息: ${lastMessage}

只返回意图名称，不需要其他解释。`;

  try {
    console.log(`[Intent Classification] Calling ModelScope API for message: "${lastMessage}"`);

    // Use direct API call instead of LangChain to avoid hanging issues
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请分类这个意图：${lastMessage}` },
    ];

    const responseText = await callModelScopeAPI(messages, 50);
    let intentText = responseText.toLowerCase().trim();
    console.log(`[Intent Classification] LLM raw response: "${intentText}"`);

    const intentMatch = intentText.match(/(nutrition_analysis|diet_therapy|menu_planning|health_chat|recipe_search|profile_update|unknown)/);
    let intent = (intentMatch ? intentMatch[1] : 'health_chat') as IntentType;
    console.log(`[Intent Classification] Matched intent from LLM: ${intent}`);

    // Keyword-based override for better accuracy (LLM can be inconsistent)
    const lowerMessage = lastMessage.toLowerCase();
    console.log(`[Intent Classification] Checking keywords in: "${lowerMessage}"`);

    if (/糖尿病|血糖|高血糖|低血糖|高血压|高血脂|脂肪肝|痛风|肥胖|高尿酸/.test(lowerMessage)) {
      console.log(`[Intent Classification] Found diabetes-related keyword!`);
      intent = 'diet_therapy';
      console.log(`[Intent Classification] Keyword override: diet_therapy`);
    } else if (/BMI|体重|热量|卡路里|代谢|蛋白质|碳水|脂肪|营养/.test(lowerMessage)) {
      intent = 'nutrition_analysis';
      console.log(`[Intent Classification] Keyword override: nutrition_analysis`);
    } else if (/食谱|怎么做|推荐菜/.test(lowerMessage)) {
      intent = 'recipe_search';
      console.log(`[Intent Classification] Keyword override: recipe_search`);
    } else if (/一周菜单|一周食谱|生成菜单|菜单规划|健康菜单/.test(lowerMessage)) {
      intent = 'menu_planning';
      console.log(`[Intent Classification] Keyword override: menu_planning`);
    } else if (/身高|体重|年龄|性别|更新资料/.test(lowerMessage)) {
      intent = 'profile_update';
      console.log(`[Intent Classification] Keyword override: profile_update`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Intent Classification] Final intent: ${intent} in ${duration}ms`);

    // Determine context requirements
    const contextReqs: ContextRequirement[] = [];
    const suggestedContext: string[] = [];

    switch (intent) {
      case 'nutrition_analysis':
        suggestedContext.push('height', 'weight', 'age', 'gender');
        break;
      case 'diet_therapy':
        suggestedContext.push('healthConditions', 'age');
        break;
      case 'menu_planning':
        suggestedContext.push('height', 'weight', 'age', 'gender', 'healthConditions', 'tastePreferences');
        break;
      case 'recipe_search':
        suggestedContext.push('dietaryPreferences', 'tastePreferences');
        break;
    }

    const contextMap: Record<string, ContextRequirement> = {
      height: { field: 'height', description: '身高(cm)', requiredFor: ['nutrition_analysis', 'menu_planning'] },
      weight: { field: 'weight', description: '体重(kg)', requiredFor: ['nutrition_analysis', 'menu_planning'] },
      age: { field: 'age', description: '年龄', requiredFor: ['nutrition_analysis', 'diet_therapy', 'menu_planning'] },
      gender: { field: 'gender', description: '性别', requiredFor: ['nutrition_analysis', 'menu_planning'] },
      healthConditions: { field: 'healthConditions', description: '健康状况', requiredFor: ['diet_therapy', 'menu_planning', 'health_chat'] },
      tastePreferences: { field: 'tastePreferences', description: '口味偏好', requiredFor: ['menu_planning', 'recipe_search'] },
    };

    for (const field of suggestedContext) {
      if (contextMap[field]) {
        contextReqs.push(contextMap[field]);
      }
    }

    return {
      currentIntent: intent,
      currentTask: intent,
      contextRequirements: contextReqs,
      workflowStage: 'classifying',
      taskHistory: [
        ...state.taskHistory,
        {
          taskType: intent,
          node: 'classifyIntent',
          result: { intent, confidence: 0.85 },
          timestamp: new Date(),
          duration,
        },
      ],
    };
  } catch (error) {
    console.error('Intent classification failed:', error);
    // Don't set workflowStage to 'error' - instead use health_chat as fallback
    return {
      currentIntent: 'health_chat',
      currentTask: 'health_chat',
      contextRequirements: [],
      workflowStage: 'classifying',
    };
  }
}

/**
 * Node 3: Gather Context
 * Check if required context is available, request missing info if needed
 */
export async function gatherContextNode(
  state: NutriMindState,
  startTime: number
): Promise<Partial<NutriMindState>> {
  const { currentIntent, contextRequirements, userProfile } = state;
  const missingContext: ContextRequirement[] = [];

  // Check what's missing
  for (const req of contextRequirements) {
    if (!userProfile) {
      missingContext.push(req);
      continue;
    }

    const value = (userProfile as any)[req.field];
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      missingContext.push(req);
    }
  }

  const duration = Date.now() - startTime;

  // If we need context and don't have it
  if (missingContext.length > 0 && currentIntent !== 'health_chat') {
    const missingFields = missingContext.map(c => c.description).join('、');

    return {
      contextGathered: false,
      contextRequirements: missingContext,
      taskResult: {
        needsMoreInfo: true,
        missingFields,
        prompt: `为了更好地帮助您，请提供以下信息：${missingFields}`,
      },
      workflowStage: 'gathering_context',
      taskHistory: [
        ...state.taskHistory,
        {
          taskType: currentIntent || 'unknown',
          node: 'gatherContext',
          result: { missing: missingContext.map(c => c.field) },
          timestamp: new Date(),
          duration,
        },
      ],
    } as Partial<NutriMindState>;
  }

  return {
    contextGathered: true,
    contextRequirements: [],
    workflowStage: 'analyzing',
    taskHistory: [
      ...state.taskHistory,
      {
        taskType: currentIntent || 'unknown',
        node: 'gatherContext',
        result: { contextReady: true },
        timestamp: new Date(),
        duration,
      },
    ],
  } as Partial<NutriMindState>;
}

/**
 * Node 4: Execute Tool
 * Execute appropriate tool based on intent
 */
export async function executeToolNode(
  state: NutriMindState,
  startTime: number
): Promise<Partial<NutriMindState>> {
  const { currentIntent, userProfile, messages } = state;
  const lastMessage = messages[messages.length - 1]?.content || '';

  let toolResult: Record<string, unknown> = {};
  let nodeName = '';

  switch (currentIntent) {
    case 'nutrition_analysis':
      nodeName = 'nutritionAnalyzer';
      toolResult = await executeNutritionAnalysis(userProfile);
      break;

    case 'diet_therapy':
      nodeName = 'dietTherapy';
      toolResult = await executeDietTherapy(lastMessage, userProfile);
      break;

    case 'menu_planning':
      nodeName = 'menuPlanner';
      toolResult = await executeMenuPlanning(lastMessage, userProfile);
      break;

    case 'recipe_search':
      nodeName = 'recipeSearch';
      toolResult = await executeRecipeSearch(lastMessage, userProfile);
      break;

    case 'profile_update':
      nodeName = 'profileUpdate';
      toolResult = await executeProfileUpdate(lastMessage);
      break;

    case 'health_chat':
    default:
      nodeName = 'healthAdvisor';
      toolResult = await executeHealthChat(messages, userProfile);
  }

  const duration = Date.now() - startTime;

  return {
    toolsExecuted: true,
    toolResults: toolResult,
    workflowStage: 'generating',
    taskHistory: [
      ...state.taskHistory,
      {
        taskType: currentIntent || 'unknown',
        node: nodeName,
        result: toolResult,
        timestamp: new Date(),
        duration,
      },
    ],
  };
}

// ==================== Tool Execution Functions ====================

async function executeNutritionAnalysis(profile: UserProfile | null): Promise<Record<string, unknown>> {
  if (!profile) {
    return {
      type: 'nutrition_analysis',
      result: '请先提供您的身高、体重、年龄、性别等信息。',
      recommendations: [],
    };
  }

  const heightM = profile.height / 100;
  const bmi = Math.round((profile.weight / (heightM * heightM)) * 10) / 10;

  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  bmr += profile.gender === 'male' ? 5 : -161;
  bmr = Math.round(bmr);

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.2));

  const protein = Math.round(tdee * 0.18 / 4);
  const carbs = Math.round(tdee * 0.50 / 4);
  const fat = Math.round(tdee * 0.32 / 9);

  let bmiStatus = '';
  if (bmi < 18.5) bmiStatus = '偏瘦';
  else if (bmi < 24) bmiStatus = '正常';
  else if (bmi < 28) bmiStatus = '偏胖';
  else bmiStatus = '肥胖';

  const recommendations: string[] = [];
  if (bmi >= 25) recommendations.push('建议控制每日热量摄入，增加运动');
  if (bmi < 18.5) recommendations.push('建议增加营养摄入，可适当增重');
  if (profile.healthConditions.includes('diabetes')) {
    recommendations.push('注意控制糖分摄入，选择低GI食物');
    recommendations.push('少食多餐，避免血糖大幅波动');
  }
  if (profile.healthConditions.includes('hypertension')) {
    recommendations.push('减少钠盐摄入，少吃腌制食品');
    recommendations.push('多吃富含钾的食物，如香蕉、橙子等');
  }

  return {
    type: 'nutrition_analysis',
    result: {
      profile: {
        name: profile.name,
        bmi,
        bmiStatus,
        bmr,
        tdee,
        macronutrients: { protein, carbs, fat },
      },
      recommendations,
    },
  };
}

async function executeDietTherapy(message: string, profile: UserProfile | null): Promise<Record<string, unknown>> {
  const prompt = `作为中医食疗专家，分析以下问题并给出建议：

用户问题: ${message}
${profile ? `用户信息: ${profile.name}, ${profile.age}岁, 健康状况: ${profile.healthConditions.join(', ')}` : ''}

请提供：
1. 体质分析
2. 饮食建议（性味归经）
3. 需要避免的食物
4. 四季养生建议

用中文回复，专业但温暖。`;

  try {
    // Use direct API call instead of LangChain to avoid hanging issues
    const messages = [
      { role: 'system', content: '你是一位精通中医食疗的营养专家。' },
      { role: 'user', content: prompt },
    ];

    const result = await callModelScopeAPI(messages, 500);

    if (!result || result.trim() === '') {
      return {
        type: 'diet_therapy',
        result: '食疗建议生成中...',
      };
    }

    return {
      type: 'diet_therapy',
      result,
    };
  } catch (error: any) {
    console.error('Diet therapy execution failed:', error.message);
    return {
      type: 'diet_therapy',
      result: '中医食疗建议：\n\n1. 饮食有节，定时定量\n2. 五谷为养，五果为助\n3. 顺应四时，春生夏长\n4. 体质调理因人而异\n\n建议咨询专业中医师获取个性化方案。',
    };
  }
}

async function executeMenuPlanning(message: string, profile: UserProfile | null): Promise<Record<string, unknown>> {
  let calories = 2000;
  if (profile) {
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    bmr += profile.gender === 'male' ? 5 : -161;
    calories = Math.round(bmr * 1.55);
  }

  const prompt = `生成一周健康菜单计划。

目标热量: ${calories} kcal/天
${profile ? `用户偏好: ${profile.tastePreferences}, 饮食限制: ${profile.healthConditions.join(', ') || '无'}` : ''}

请生成一周菜单，包括早中晚+加餐。`;

  try {
    // Use direct API call instead of LangChain to avoid hanging issues
    const messages = [
      { role: 'system', content: '你是一位专业营养师，擅长设计健康美味的菜单。' },
      { role: 'user', content: prompt },
    ];

    const result = await callModelScopeAPI(messages, 600);

    return {
      type: 'menu_planning',
      result,
      targetCalories: calories,
    };
  } catch {
    return {
      type: 'menu_planning',
      result: `一周菜单计划（${calories} kcal/天）：

早餐：燕麦粥+鸡蛋+牛奶
午餐：糙米饭+清蒸鱼+炒时蔬
晚餐：荞麦面+豆腐+蔬菜沙拉
加餐：水果或坚果`,
      targetCalories: calories,
    };
  }
}

async function executeRecipeSearch(message: string, profile: UserProfile | null): Promise<Record<string, unknown>> {
  // This would typically call the recipe database MCP tool
  return {
    type: 'recipe_search',
    result: `菜谱搜索结果：

根据"${message}"，您可以：
1. 查看我们的菜谱库获取详细做法
2. 尝试搜索相关关键词
3. 获取个性化推荐

请问您想了解哪道菜的做法？`,
  };
}

async function executeProfileUpdate(message: string): Promise<Record<string, unknown>> {
  return {
    type: 'profile_update',
    result: '个人资料更新功能已启用。请提供您需要更新的信息。',
  };
}

async function executeHealthChat(
  messages: ConversationMessage[],
  profile: UserProfile | null
): Promise<Record<string, unknown>> {
  const history = messages
    .slice(-6)
    .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
    .join('\n');

  const prompt = `你是 NutriMind 智能营养师，温暖专业的健康顾问。

对话历史：
${history}
${profile ? `\n当前用户: ${profile.name}, ${profile.age}岁` : ''}

请回复用户，保持温暖关怀的语气。`;

  try {
    // Use direct API call instead of LangChain to avoid hanging issues
    const apiMessages = [
      { role: 'system', content: '你是一位温暖专业的营养健康顾问。' },
      { role: 'user', content: prompt },
    ];

    const result = await callModelScopeAPI(apiMessages, 500);

    return {
      type: 'health_chat',
      result,
    };
  } catch {
    return {
      type: 'health_chat',
      result: '您好！我是 NutriMind 智能营养师助手。请问有什么关于营养健康的问题我可以帮助您？',
    };
  }
}

/**
 * Node 5: Synthesize Response
 * Generate final response based on tool results
 */
export async function synthesizeResponseNode(
  state: NutriMindState,
  startTime: number
): Promise<Partial<NutriMindState>> {
  const { currentIntent, toolResults, toolsExecuted, contextGathered } = state;
  const duration = Date.now() - startTime;

  // If we need more context
  if (toolResults.needsMoreInfo as boolean) {
    return {
      toolResults: {
        ...toolResults,
        finalResponse: toolResults.prompt,
      },
      workflowStage: 'completed',
      taskHistory: [
        ...state.taskHistory,
        {
          taskType: currentIntent || 'unknown',
          node: 'synthesize',
          result: { type: 'context_request' },
          timestamp: new Date(),
          duration,
        },
      ],
    } as Partial<NutriMindState>;
  }

  let finalResponse = '';

  switch (currentIntent) {
    case 'nutrition_analysis': {
      const result = toolResults.result as any;
      if (result?.profile) {
        const p = result.profile;
        finalResponse = `📊 营养分析报告

您好${p.profile.name || ''}，根据您提供的信息：

📈 身体指标
- BMI: ${p.bmi} (${p.bmiStatus})
- 基础代谢率(BMR): ${p.bmr} kcal/天
- 每日建议热量: ${p.tdee} kcal/天

🥗 每日营养目标
- 蛋白质: ${p.macronutrients?.protein || 0}g
- 碳水化合物: ${p.macronutrients?.carbs || 0}g
- 脂肪: ${p.macronutrients?.fat || 0}g

💡 建议
${result.recommendations?.map((r: string) => `- ${r}`).join('\n') || '- 均衡饮食，适量运动'}`;
      } else {
        finalResponse = toolResults.result as string || '营养分析完成。';
      }
      break;
    }

    case 'diet_therapy':
      finalResponse = toolResults.result as string || '食疗建议已生成。';
      break;

    case 'menu_planning': {
      const result = toolResults.result as string;
      finalResponse = `📋 菜单计划\n\n${result}\n\n目标热量: ${toolResults.targetCalories || 2000} kcal/天`;
      break;
    }

    case 'recipe_search':
      finalResponse = toolResults.result as string || '您可以查看菜谱库获取详细信息。';
      break;

    case 'profile_update':
      finalResponse = toolResults.result as string || '资料已更新。';
      break;

    case 'health_chat':
    default:
      finalResponse = toolResults.result as string || '请问还有什么可以帮您？';
  }

  return {
    toolResults: {
      ...toolResults,
      finalResponse,
      needsMoreInfo: false,
      toolsExecuted,
      contextGathered,
    },
    workflowStage: 'completed',
    taskHistory: [
      ...state.taskHistory,
      {
        taskType: currentIntent || 'unknown',
        node: 'synthesize',
        result: { responseLength: finalResponse.length },
        timestamp: new Date(),
        duration,
      },
    ],
  } as Partial<NutriMindState>;
}

// ==================== Conditional Router ====================

export type NextNode =
  | 'classify_intent'
  | 'gather_context'
  | 'execute_tool'
  | 'synthesize'
  | 'error';

export function createRouter() {
  return (state: NutriMindState): NextNode => {
    const { workflowStage, currentIntent, contextGathered, error } = state;

    // Error handling
    if (error || workflowStage === 'error') {
      return 'error';
    }

    // State machine transitions
    switch (workflowStage) {
      case 'init':
        return 'classify_intent';

      case 'classifying':
        // After classification, check if we need context
        if (!contextGathered && currentIntent !== 'health_chat' && currentIntent !== 'recipe_search') {
          return 'gather_context';
        }
        return 'execute_tool';

      case 'gathering_context':
        // If still missing context, stay in gathering (user needs to respond)
        if (!contextGathered) {
          return 'gather_context';
        }
        return 'execute_tool';

      case 'analyzing':
      case 'generating':
        return 'execute_tool';

      case 'synthesizing':
      case 'completed':
        return 'synthesize';

      default:
        return 'classify_intent';
    }
  };
}

// ==================== Workflow Executor ====================

export class NutriMindWorkflow {
  private router: (state: NutriMindState) => NextNode;
  private persistence: StatePersistence;

  constructor() {
    this.router = createRouter();
    this.persistence = statePersistence;
    console.log('[LangGraph] NutriMind Workflow initialized');
  }

  /**
   * Execute workflow for a single turn
   */
  async executeTurn(
    sessionId: string,
    userId: string | null,
    message: string,
    profile?: UserProfile
  ): Promise<{ response: string; state: NutriMindState }> {
    console.log(`[LangGraph] Executing turn for session ${sessionId}`);

    // Initialize or restore state
    let state = await initializeStateNode(sessionId, userId, message, profile);

    // Persist initial state
    await this.persistence.saveState(sessionId, state);

    // Workflow execution loop
    let maxIterations = 10;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      const startTime = Date.now();
      const nextNode = this.router(state);

      console.log(`[LangGraph] Node: ${nextNode}, Iteration: ${iterations}`);

      switch (nextNode) {
        case 'classify_intent': {
          const update = await classifyIntentNode(state, startTime);
          state = { ...state, ...update };
          break;
        }

        case 'gather_context': {
          const update = await gatherContextNode(state, startTime);
          state = { ...state, ...update };

          // If we need more info, break and return the prompt
          if (state.toolResults.needsMoreInfo as boolean) {
            const response = state.toolResults.prompt as string;
            await this.finalizeSession(state, response);
            return { response, state };
          }
          break;
        }

        case 'execute_tool': {
          const update = await executeToolNode(state, startTime);
          state = { ...state, ...update, workflowStage: 'synthesizing' as WorkflowStage };
          break;
        }

        case 'synthesize': {
          const update = await synthesizeResponseNode(state, startTime);
          state = { ...state, ...update };
          await this.finalizeSession(state, state.toolResults.finalResponse as string);
          return {
            response: state.toolResults.finalResponse as string,
            state,
          };
        }

        case 'error':
          state = { ...state, workflowStage: 'error' as WorkflowStage };
          await this.finalizeSession(state, '抱歉，处理您的问题时遇到了错误。请稍后再试。');
          return { response: '抱歉，处理您的问题时遇到了错误。', state };
      }

      // Save state after each step
      await this.persistence.saveState(sessionId, state);
    }

    // Max iterations reached
    await this.finalizeSession(state, '处理超时，请稍后再试。');
    return { response: '处理超时，请稍后再试。', state };
  }

  /**
   * Finalize session - save message and state
   */
  private async finalizeSession(state: NutriMindState, response: string): Promise<void> {
    const { sessionId, messages } = state;

    // Save assistant response
    const assistantMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        intent: state.currentIntent,
        workflowStage: state.workflowStage,
      },
    };

    await this.persistence.saveMessage(sessionId, assistantMessage);

    // Update state
    state.messages.push(assistantMessage);
    state.workflowStage = 'completed';
    state.updatedAt = new Date();

    await this.persistence.saveState(sessionId, state);
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId: string, limit?: number): Promise<ConversationMessage[]> {
    return this.persistence.loadHistory(sessionId, limit);
  }

  /**
   * Clear session
   */
  async clearSession(sessionId: string): Promise<void> {
    await this.persistence.clearSession(sessionId);
  }

  /**
   * Continue conversation with additional context
   */
  async continueConversation(
    sessionId: string,
    message: string
  ): Promise<{ response: string; state: NutriMindState }> {
    const state = await this.persistence.loadState(sessionId);

    if (!state) {
      throw new Error('Session not found');
    }

    // Add new user message
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    state.messages.push(userMessage);
    state.messageCount++;
    state.workflowStage = 'init';
    state.updatedAt = new Date();

    // Resume workflow
    return this.executeTurn(sessionId, state.userId, message, state.userProfile);
  }
}

// Export singleton
export const nutriMindWorkflow = new NutriMindWorkflow();
