/**
 * Fastify Entry Point
 */

import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
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
import { registerOCRRoutes } from './routes/ocr.js';
import { websocketHandler } from './websocket/handler.js';
import { createLogger } from './utils/logger.js';
import { initializeDatabase, seedDemoUser } from './models/db.js';

const logger = createLogger('nutrimind-api');

// Cross-platform Python path detection for OCR service
function getPythonPath(): { path: string; isVenv: boolean } {
  const isWindows = process.platform === 'win32'

  // Get project root - go up two levels from src directory
  const projectRoot = path.resolve(__dirname, '../..')

  // Check for virtual environment in project root - .venv first, then .ocr-venv as fallback
  const venvNames = ['.venv', '.ocr-venv']
  const venvPaths: string[] = []

  for (const venvName of venvNames) {
    if (isWindows) {
      venvPaths.push(
        path.join(projectRoot, venvName, 'Scripts', 'python.exe'),
        path.join(projectRoot, venvName, 'Scripts', 'python.bat'),
      )
    } else {
      venvPaths.push(
        path.join(projectRoot, venvName, 'bin', 'python'),
        path.join(projectRoot, venvName, 'bin', 'python3'),
      )
    }
  }

  // Check environment variable first
  const envPython = process.env.OCR_PYTHON_PATH
  if (envPython && path.isAbsolute(envPython)) {
    return { path: envPython, isVenv: false }
  }

  // Check if venv exists
  for (const venvPath of venvPaths) {
    if (fs.existsSync(venvPath)) {
      console.log(`[DEBUG] Found venv at: ${venvPath}`)
      return { path: venvPath, isVenv: true }
    }
  }

  console.log(`[DEBUG] Checked venv paths: ${venvPaths.join(', ')}`)

  // Fall back to system Python
  if (isWindows) {
    return { path: 'python', isVenv: false }
  }
  return { path: '/usr/bin/python3', isVenv: false }
}

// Start GLM-OCR service automatically
async function startGLMOCRService() {
  const ocrScript = path.resolve(__dirname, '../src/ocr/glm-ocr-service.py')
  const pythonInfo = await getPythonPath()
  const pythonPath = pythonInfo.path

  logger.info('Starting GLM-OCR service...')
  logger.info(`Python path: ${pythonPath} (venv: ${pythonInfo.isVenv})`)
  logger.info('OCR script: ' + ocrScript)

  // Set PYTHONPATH for virtual environment
  const env: Record<string, string> = {
    ...process.env,
    PATH: process.env.PATH || '',
  }

  if (pythonInfo.isVenv) {
    // When using venv Python directly, it handles its own site-packages automatically.
    // Just ensure the venv bin/Scripts is on PATH so subprocesses can find venv tools.
    const venvDir = path.dirname(path.dirname(pythonInfo.path)) // strip Scripts/python.exe
    const venvBin = path.join(venvDir, isWindows ? 'Scripts' : 'bin')
    env.PATH = venvBin + path.delimiter + (env.PATH || '')
  }

  try {
    const ocrProcess = spawn(pythonPath, [ocrScript], {
      cwd: path.dirname(ocrScript),
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      detached: false,
    })

    ocrProcess.stdout.on('data', (data) => {
      process.stdout.write(`[GLM-OCR] ${data}`)
    })

    ocrProcess.stderr.on('data', (data) => {
      process.stderr.write(`[GLM-OCR ERROR] ${data}`)
    })

    ocrProcess.on('error', (err) => {
      logger.error('Failed to start OCR service: ' + err.message)
    })

    ocrProcess.on('close', (code) => {
      if (code !== 0) {
        logger.warn(`GLM-OCR service exited with code ${code}`)
      }
    })

    return ocrProcess
  } catch (err: any) {
    logger.error('Error starting OCR service: ' + err.message)
    return null
  }
}

async function main() {
  // Start GLM-OCR service in background
  startGLMOCRService()

  const app = Fastify({
    logger: logger.child({ service: 'nutrimind-api' }),
    trustProxy: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: config.corsOrigins,
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
  await app.register(registerOCRRoutes);

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
