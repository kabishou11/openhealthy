/**
 * Chat Routes
 *
 * API endpoints for chat functionality using LangGraph Workflow
 * Features:
 * - Intent classification and routing
 * - Session persistence with Redis
 * - Conversation history
 * - Context-aware responses
 */

import { FastifyInstance } from 'fastify';
import { nutriMindWorkflow, NutriMindWorkflow, ConversationMessage, UserProfile, getLLM, createMockLLM, setSelectedModel } from '../agents/langgraph-workflow.js';
import { userHealthMCP } from '../mcp_tools/user-health.js';

// Type for the user profile from user-health MCP
interface ExternalUserProfile {
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
}

// Use the workflow instance
const workflow: NutriMindWorkflow = nutriMindWorkflow;

// Convert external profile to our UserProfile format
function convertToUserProfile(external: ExternalUserProfile | null): UserProfile | null {
  if (!external) return null;
  return {
    ...external,
    goals: [],
  };
}

export async function chatRoutes(fastify: FastifyInstance) {
  // Send chat message (LangGraph Workflow-powered)
  fastify.post('/api/v1/chat', async (request) => {
    const { message, sessionId, context, userId, model } = request.body as {
      message: string;
      sessionId?: string;
      context?: {
        healthConditions?: string[];
        allergies?: string[];
        dietaryPreferences?: string[];
      };
      userId?: string;
      model?: string;
    };

    if (!message) {
      return { error: 'Message is required' };
    }

    // Log model selection and apply it
    console.log(`[Chat] Using model: ${model || 'default'}`);
    if (model) setSelectedModel(model);

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get user profile if userId provided
    let userProfile: UserProfile | null = null;
    if (userId) {
      const externalProfile = await userHealthMCP.getProfile(userId);
      userProfile = convertToUserProfile(externalProfile);
    }

    try {
      // Execute the workflow with session support
      const result = await workflow.executeTurn(
        finalSessionId,
        userId || null,
        message,
        userProfile || undefined
      );

      return {
        response: result.response,
        sessionId: finalSessionId,
        framework: 'LangGraph',
        intent: result.state.currentIntent,
        messageCount: result.state.messageCount,
        model: model || 'default',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to simple responses if LangGraph fails
      const fallbackResponse = getFallbackResponse(message);
      return {
        response: fallbackResponse,
        sessionId: finalSessionId,
        framework: 'fallback',
        model: model || 'default',
      };
    }
  });

  // Continue conversation with session
  fastify.post('/api/v1/chat/continue', async (request) => {
    const { message, sessionId } = request.body as {
      message: string;
      sessionId: string;
    };

    if (!message || !sessionId) {
      return { error: 'Message and sessionId are required' };
    }

    try {
      const result = await workflow.continueConversation(sessionId, message);

      return {
        response: result.response,
        sessionId,
        framework: 'LangGraph',
        intent: result.state.currentIntent,
        messageCount: result.state.messageCount,
      };
    } catch (error) {
      return {
        error: 'Session not found or expired',
        message: String(error),
      };
    }
  });

  // Get chat history
  fastify.get('/api/v1/chat/:sessionId/history', async (request) => {
    const { sessionId } = request.params as { sessionId: string };
    const { limit } = request.query as { limit?: number };

    try {
      const history = await workflow.getHistory(sessionId, limit || 50);

      return {
        sessionId,
        messages: history,
        count: history.length,
      };
    } catch (error) {
      return { error: 'Failed to load history', message: String(error) };
    }
  });

  // Clear chat session
  fastify.delete('/api/v1/chat/:sessionId', async (request) => {
    const { sessionId } = request.params as { sessionId: string };

    try {
      await workflow.clearSession(sessionId);

      return {
        success: true,
        sessionId,
        message: 'Session cleared',
      };
    } catch (error) {
      return { error: 'Failed to clear session', message: String(error) };
    }
  });

  // Analyze nutrition (using workflow)
  fastify.post('/api/v1/chat/analyze', async (request) => {
    const { userId, message } = request.body as {
      userId: string;
      message?: string;
    };

    if (!userId) {
      return { error: 'User ID is required' };
    }

    const userProfileRaw = await userHealthMCP.getProfile(userId);

    if (!userProfileRaw) {
      return { error: 'User not found' };
    }

    const userProfile = convertToUserProfile(userProfileRaw);
    const sessionId = `analyze-${Date.now()}`;

    try {
      const result = await workflow.executeTurn(
        sessionId,
        userId,
        message || '请分析我的营养状况并给出建议。',
        userProfile || undefined
      );

      // Extract nutrition report from task result
      const toolResult = result.state.toolResults;

      return {
        response: result.response,
        nutritionReport: toolResult,
        sessionId,
        framework: 'LangGraph',
        userProfile: {
          name: userProfileRaw.name,
          age: userProfileRaw.age,
          height: userProfileRaw.height,
          weight: userProfileRaw.weight,
          bmi: userProfileRaw.bmi,
          bmr: userProfileRaw.bmr,
          healthConditions: userProfileRaw.healthConditions,
        },
      };
    } catch (error) {
      return {
        error: 'Analysis failed',
        message: String(error),
      };
    }
  });

  // Get diet therapy advice
  fastify.post('/api/v1/chat/therapy', async (request) => {
    const { userId, message } = request.body as {
      userId?: string;
      message?: string;
    };

    let userProfile: UserProfile | null = null;
    if (userId) {
      const externalProfile = await userHealthMCP.getProfile(userId);
      userProfile = convertToUserProfile(externalProfile);
    }

    const sessionId = `therapy-${Date.now()}`;

    try {
      const result = await workflow.executeTurn(
        sessionId,
        userId || null,
        message || '请提供中医食疗建议。',
        userProfile || undefined
      );

      return {
        response: result.response,
        sessionId,
        framework: 'LangGraph',
        intent: result.state.currentIntent,
      };
    } catch (error) {
      return {
        error: 'Therapy request failed',
        message: String(error),
      };
    }
  });

  // Generate meal plan
  fastify.post('/api/v1/chat/menu', async (request) => {
    const { userId, days, calories, message } = request.body as {
      userId?: string;
      days?: number;
      calories?: number;
      message?: string;
    };

    let userProfile: UserProfile | null = null;
    if (userId) {
      const externalProfile = await userHealthMCP.getProfile(userId);
      userProfile = convertToUserProfile(externalProfile);
    }

    const sessionId = `menu-${Date.now()}`;
    const prompt = message || `请生成一份${days || 7}天的菜单计划，目标热量${calories || 2000} kcal/天。`;

    try {
      const result = await workflow.executeTurn(
        sessionId,
        userId || null,
        prompt,
        userProfile || undefined
      );

      return {
        response: result.response,
        sessionId,
        framework: 'LangGraph',
        intent: result.state.currentIntent,
        targetCalories: calories || 2000,
      };
    } catch (error) {
      return {
        error: 'Menu planning failed',
        message: String(error),
      };
    }
  });

  // Quick chat (simplified)
  fastify.post('/api/v1/chat/quick', async (request) => {
    const { message } = request.body as { message: string };

    if (!message) {
      return { error: 'Message is required' };
    }

    const sessionId = `quick-${Date.now()}`;

    try {
      const result = await workflow.executeTurn(sessionId, null, message);

      return {
        response: result.response,
        sessionId,
        framework: 'LangGraph',
        intent: result.state.currentIntent,
      };
    } catch (error) {
      const fallbackResponse = getFallbackResponse(message);
      return {
        response: fallbackResponse,
        sessionId,
        framework: 'fallback',
      };
    }
  });

  // List all sessions (for debugging/admin)
  fastify.get('/api/v1/chat/sessions', async () => {
    return {
      message: 'Session management moved to Redis. Use /api/v1/chat/:sessionId/history to retrieve conversations.',
      endpoints: {
        history: 'GET /api/v1/chat/:sessionId/history',
        continue: 'POST /api/v1/chat/continue',
        clear: 'DELETE /api/v1/chat/:sessionId',
      },
    };
  });

  // Test LLM connection (for debugging)
  fastify.post('/api/v1/chat/test', async (request) => {
    const { model } = request.body as { model?: string };

    const llm = getLLM();

    if (!llm) {
      return {
        success: false,
        error: 'LLM not configured',
        message: 'Please set MODELSCOPE_TOKEN or OPENAI_API_KEY in .env',
        envCheck: {
          MODELSCOPE_TOKEN: !!process.env.MODELSCOPE_TOKEN ? 'set' : 'not set',
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'set' : 'not set',
        },
      };
    }

    try {
      const testMessage = '请简单介绍一下你自己，用一句话回答。';

      const response = await llm.invoke([
        new (await import('@langchain/core/messages')).SystemMessage('你是一个友好的助手。'),
        new (await import('@langchain/core/messages')).HumanMessage(testMessage),
      ]);

      return {
        success: true,
        model: model || 'default',
        apiBase: 'https://api-inference.modelscope.cn/v1',
        response: typeof response === 'string' ? response : response.content,
        message: 'Model connection successful!',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        message: 'Model connection failed',
      };
    }
  });
}

// Simple fallback responses when LangGraph fails
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (/你好|hello|hi/.test(lowerMessage)) {
    return '你好！我是 NutriMind 智能营养师助手。有什么关于营养健康的问题我可以帮助你解答吗？';
  }

  if (/食谱|菜单|吃什么/.test(lowerMessage)) {
    return '我可以为你推荐健康食谱！\n\n推荐食谱：\n1. 凉拌木耳（护肝）\n2. 清蒸鲈鱼（高蛋白）\n3. 蒜蓉西兰花（高纤维）';
  }

  if (/减脂|减肥/.test(lowerMessage)) {
    return '减脂餐推荐原则：\n- 控制总热量\n- 高蛋白低脂肪\n- 多吃蔬菜\n\n推荐食谱：凉拌木耳、清蒸鲈鱼、蒜蓉西兰花';
  }

  if (/糖尿病|血糖/.test(lowerMessage)) {
    return '糖尿病饮食建议：\n1. 控制总热量\n2. 选择低GI食物\n3. 增加膳食纤维\n\n注意：以上建议仅供参考，请遵医嘱！';
  }

  if (/高血压/.test(lowerMessage)) {
    return '高血压饮食建议：\n1. 减少钠盐摄入（每日<6g）\n2. 多吃富含钾的食物\n3. 限制饱和脂肪\n4. 适量运动\n\n建议定期测量血压，遵医嘱用药。';
  }

  if (/脂肪肝/.test(lowerMessage)) {
    return '脂肪肝饮食建议：\n1. 控制总热量摄入\n2. 减少脂肪摄入\n3. 增加膳食纤维\n4. 限制糖分\n5. 戒酒\n\n建议适当运动，定期复查。';
  }

  return `收到你的问题："${message}"。\n\n关于营养健康的话题，我很乐意为你解答。\n\n可以这样问我：\n- "今天吃什么好？"\n- "推荐一些减脂餐"\n- "有脂肪肝应该怎么吃？"\n- "高血压饮食注意什么？"`;
}
