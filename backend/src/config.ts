/**
 * NutriMind Configuration
 */

import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // ============================================
  // LLM API - ModelScope (推荐)
  // ============================================
  MODELSCOPE_API_URL: z.string().default('https://api-inference.modelscope.cn/v1'),
  MODELSCOPE_TOKEN: z.string().optional(),

  // OpenAI API (备选/兼容)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('Qwen/Qwen3-8B'),
  OPENAI_API_BASE: z.string().default('https://api-inference.modelscope.cn/v1'),

  // ============================================
  // OCR APIs
  // ============================================
  ZHIPU_API_KEY: z.string().optional(),
  ZHIPU_API_BASE: z.string().default('https://open.bigmodel.cn/api/paas/v4'),
  BAIDU_OCR_API_KEY: z.string().optional(),
  BAIDU_OCR_SECRET_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().default('postgresql://localhost:5432/nutrimind'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Neo4j (Knowledge Graph)
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('neo4j'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // WebSocket
  WS_MAX_PAYLOAD: z.coerce.number().default(1048576),

  // MCP Servers
  HOWTECOOK_MCP_URL: z.string().optional(),
  NUTRITION_DB_URL: z.string().optional(),
  FOOD_RECOGNITION_URL: z.string().optional(),

  // Voice AI
  VOICE_AI_ENABLED: z.coerce.boolean().default(false),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),

  // ============================================
  // JWT Authentication
  // ============================================
  jwt: {
    secret: process.env.JWT_SECRET || 'nutrimind-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // ============================================
  // LLM API - ModelScope (推荐)
  // ============================================
  modelScopeApiUrl: process.env.MODELSCOPE_API_URL || 'https://api-inference.modelscope.cn/v1',
  modelScopeToken: process.env.MODELSCOPE_TOKEN || process.env.OPENAI_API_KEY || '',

  // OpenAI (兼容)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'Qwen/Qwen3-8B',
  openaiApiBase: process.env.OPENAI_API_BASE || 'https://api-inference.modelscope.cn/v1',

  // ============================================
  // OCR APIs
  // ============================================
  zhipuApiKey: process.env.ZHIPU_API_KEY || '',
  zhipuApiBase: process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4',
  baiduOcrApiKey: process.env.BAIDU_OCR_API_KEY || '',
  baiduOcrSecretKey: process.env.BAIDU_OCR_SECRET_KEY || '',

  // Database
  databaseUrl: process.env.DATABASE_URL || './data/nutrimind.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Neo4j
  neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4jUser: process.env.NEO4J_USER || 'neo4j',
  neo4jPassword: process.env.NEO4J_PASSWORD || 'neo4j',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:1420').split(','),

  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),

  // WebSocket
  wsMaxPayload: parseInt(process.env.WS_MAX_PAYLOAD || '1048576'),

  // MCP Servers
  mcp: {
    howtocookUrl: process.env.HOWTECOOK_MCP_URL,
    nutritionDbUrl: process.env.NUTRITION_DB_URL,
    foodRecognitionUrl: process.env.FOOD_RECOGNITION_URL,
  },

  // Voice AI
  voiceAiEnabled: process.env.VOICE_AI_ENABLED === 'true',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Paths
  kbPath: process.env.KB_PATH || './kb',
  recipesPath: process.env.RECIPES_PATH || './kb/recipes',

  // OCR Service URL
  ocrUrl: process.env.OCR_URL || 'http://localhost:8081',
};

export type Config = typeof config;
