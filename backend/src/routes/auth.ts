// Auth Routes - Login/Register
import { FastifyInstance } from 'fastify';
import { loginUser, registerUser, authMiddleware } from '../auth/middleware.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/api/v1/auth/register', async (request, reply) => {
    const { phone, password, role, name } = request.body as {
      phone: string;
      password: string;
      role?: string;
      name: string;
    };

    if (!phone || !password || !name) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Phone, password, and name are required',
      });
    }

    try {
      const result = await registerUser(
        phone,
        password,
        role || 'PARENT',
        name
      );
      return {
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      };
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Phone number already registered',
        });
      }
      throw error;
    }
  });

  // Login
  fastify.post('/api/v1/auth/login', async (request, reply) => {
    const { phone, password } = request.body as {
      phone: string;
      password: string;
    };

    if (!phone || !password) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Phone and password are required',
      });
    }

    const result = await loginUser(phone, password);

    if (!result) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid phone or password',
      });
    }

    return {
      success: true,
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      },
    };
  });

  // Get current user profile
  fastify.get('/api/v1/auth/profile', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { db } = await import('../models/db.js');
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(request.user.id);

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const { password, ...userWithoutPassword } = user;
    return {
      success: true,
      data: userWithoutPassword,
    };
  });

  // Refresh token
  fastify.post('/api/v1/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    const { verifyToken, generateToken } = await import('../auth/jwt.js');

    if (!refreshToken) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
    }

    const result = verifyToken(refreshToken);
    if (!result.valid || !result.decoded) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      });
    }

    const decoded = result.decoded as any;
    const newToken = generateToken({
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
      name: decoded.name,
    });

    return {
      success: true,
      data: { token: newToken },
    };
  });
}
