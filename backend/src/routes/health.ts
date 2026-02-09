/**
 * Health Routes
 *
 * Health check and status endpoints
 */

import { FastifyInstance } from 'fastify';
import { NutriMindAgentNetwork, getChatModel } from '../agents/langchain-agents.js';

// Initialize LangChain agent network
const agentNetwork = new NutriMindAgentNetwork();

export async function healthRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'nutrimind-api',
    framework: 'LangChain',
  }));

  // Agent status
  fastify.get('/status/agents', async () => {
    const status = await agentNetwork.getStatus();
    return {
      agents: status,
      framework: 'LangChain',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      lastActivity: new Date().toISOString(),
    };
  });

  // Readiness check
  fastify.get('/ready', async () => {
    try {
      // Test LLM connection
      const llm = getChatModel();
      // Simple validation - if LLM is initialized, we're ready
      return {
        status: 'ready',
        framework: 'LangChain',
        agents: await agentNetwork.getStatus(),
      };
    } catch (error) {
      return {
        status: 'not ready',
        error: 'Failed to initialize LangChain agents',
      };
    }
  });
}
