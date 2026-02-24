/**
 * Fastify Entry Point
 */

import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// Load .env from project root
try {
  const result = import('dotenv')
  const dotenv = (await result).default
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })
} catch (e) {
  // dotenv might not be installed
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
// Note: For file uploads, use built-in request body parsing

import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { healthRoutes as healthRecordsRoutes } from './routes/health-records.js';
import { nutritionRoutes } from './routes/nutrition.js';
import { menuRoutes } from './routes/menus.js';
import { menuRoutes as recipeRoutes } from './routes/menu.js';
import { dishRoutes } from './routes/dishes.js';
import { studentRoutes } from './routes/students.js';
import { chatRoutes } from './routes/chat.js';
import { agentRoutes } from './routes/agents.js';
import { institutionRoutes } from './routes/institution.js';
import { registerRAGRoutes } from './routes/rag.js';
import { registerKnowledgeRoutes } from './routes/knowledge.js';
import { registerModelsRoutes } from './routes/models.js';
import { registerPromptsRoutes } from './routes/prompts.js';
import { registerScanHealthRoutes } from './routes/scan-health.js';
import { registerPersonalHealthRoutes } from './routes/personal-health.js';
import { registerAnalyzeHealthRoutes } from './routes/analyze-health.js';
import { websocketHandler } from './websocket/handler.js';
import { createLogger } from './utils/logger.js';
import { initializeDatabase, seedDemoUser } from './models/db.js';

const logger = createLogger('nutrimind-api');

async function main() {

  const app = Fastify({
    logger: logger.child({ service: 'nutrimind-api' }),
    trustProxy: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: config.nodeEnv === 'production' ? config.corsOrigins : true,
    credentials: true,
  });

  await app.register(websocket, {
    options: { maxPayload: 1048576 },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Initialize database
  initializeDatabase();
  seedDemoUser();

  // Register routes
  await app.register(authRoutes);
  await app.register(healthRoutes);
  await app.register(healthRecordsRoutes);
  await app.register(nutritionRoutes);
  await app.register(menuRoutes);
  await app.register(recipeRoutes);
  await app.register(dishRoutes);
  await app.register(studentRoutes);
  await app.register(chatRoutes);
  await app.register(agentRoutes);
  await app.register(institutionRoutes);
  await app.register(registerRAGRoutes);
  await app.register(registerKnowledgeRoutes);
  await app.register(registerModelsRoutes);
  await app.register(registerPromptsRoutes);
  await app.register(registerScanHealthRoutes);
  await app.register(registerPersonalHealthRoutes);
  await app.register(registerAnalyzeHealthRoutes);

  // WebSocket handler
  app.get('/ws/chat', { websocket: true }, websocketHandler);

  // Start server
  try {
    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });
    logger.info(`NutriMind API server running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
