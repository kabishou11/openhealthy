/**
 * WebSocket Handler
 *
 * Real-time chat via WebSocket
 */

import { WebSocket } from 'ws';
import { FastifyRequest } from 'fastify';
import { HealthAdvisorAgent } from '../agents/langchain-agents.js';
import { userHealthMCP } from '../mcp_tools/user-health.js';

const healthAdvisor = new HealthAdvisorAgent({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
});

// Store active connections
const connections: Map<string, WebSocket> = new Map();

export async function websocketHandler(socket: WebSocket, request: FastifyRequest) {
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  connections.set(connectionId, socket);

  console.log(`WebSocket client connected: ${connectionId}`);

  // Send welcome message
  socket.send(JSON.stringify({
    type: 'connected',
    message: '欢迎使用 NutriMind 智能营养师助手！',
    connectionId,
    timestamp: new Date().toISOString(),
  }));

  socket.on('message', async (data) => {
    try {
      const message = data.toString();
      const parsed = JSON.parse(message);

      if (parsed.type === 'chat') {
        await handleChatMessage(connectionId, parsed.payload);
      } else if (parsed.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: '处理消息时发生错误',
      }));
    }
  });

  socket.on('close', () => {
    console.log(`WebSocket client disconnected: ${connectionId}`);
    connections.delete(connectionId);
  });

  socket.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
    connections.delete(connectionId);
  });
}

async function handleChatMessage(connectionId: string, payload: {
  message: string;
  userId?: string;
  sessionId?: string;
}) {
  const socket = connections.get(connectionId);
  if (!socket) return;

  const { message, userId } = payload;

  if (!message) {
    socket.send(JSON.stringify({
      type: 'error',
      message: '消息内容不能为空',
    }));
    return;
  }

  try {
    // Get user profile if provided
    let userProfile;
    if (userId) {
      userProfile = await userHealthMCP.getProfile(userId);
    }

    // Process chat message using the health advisor agent
    const response = await healthAdvisor.chat(
      userProfile
        ? `用户信息: ${userProfile.name}, ${userProfile.age}岁, ${userProfile.gender}, BMI: ${userProfile.bmi}\n\n消息: ${message}`
        : message
    );

    // Send response
    socket.send(JSON.stringify({
      type: 'chat_response',
      response: response,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Chat processing error:', error);
    socket.send(JSON.stringify({
      type: 'error',
      message: '抱歉，处理您的消息时遇到了问题。请稍后再试。',
    }));
  }
}

// Export function to send broadcast messages
export function broadcastMessage(message: object) {
  const messageStr = JSON.stringify(message);
  for (const [id, socket] of connections) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(messageStr);
    }
  }
}
