// Authentication Middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, generateToken, generateRefreshToken, hasPermission, sanitizeUser, generateId, verifyPassword, hashPassword } from './jwt.js';
import { db } from '../models/db.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      phone: string;
      role: string;
      name: string;
    };
  }
}

// Extract token from Authorization header
export function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Authentication middleware - requires valid token
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = extractToken(request);

  if (!token) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
  }

  const result = verifyToken(token);
  if (!result.valid || !result.decoded) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  // Add user to request
  const decoded = result.decoded as any;
  request.user = {
    id: decoded.id,
    phone: decoded.phone,
    role: decoded.role,
    name: decoded.name,
  };
}

// Optional authentication - doesn't fail if no token
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = extractToken(request);
  if (!token) return;

  const result = verifyToken(token);
  if (result.valid && result.decoded) {
    const decoded = result.decoded as any;
    request.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
      name: decoded.name,
    };
  }
}

// Permission check middleware factory
export function requirePermission(permission: string) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!hasPermission(request.user.role, permission)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Permission denied: ${permission}`,
      });
    }
  };
}

// Role check middleware factory
export function requireRole(...roles: string[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }
  };
}

// Get user from database (for fresh data)
export async function getUserFromDB(userId: string): Promise<any> {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
  return stmt.get(userId);
}

// Get student profile for user
export async function getStudentFromDB(userId: string): Promise<any> {
  const stmt = db.prepare(`
    SELECT s.*, u.name as user_name, u.phone
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.user_id = ?
  `);
  return stmt.get(userId);
}

// Register user
export async function registerUser(
  phone: string,
  password: string,
  role: string,
  name: string
): Promise<{ user: any; token: string }> {
  const id = generateId();
  const hashedPassword = await hashPassword(password);

  const stmt = db.prepare(`
    INSERT INTO users (id, phone, password, role, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  stmt.run(id, phone, hashedPassword, role, name);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = generateToken({ id, phone, role, name });

  return { user: sanitizeUser(user), token };
}

// Login user
export async function loginUser(
  phone: string,
  password: string
): Promise<{ user: any; token: string; refreshToken: string } | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE phone = ? AND is_active = 1');
  const user = stmt.get(phone);

  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  const token = generateToken({
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    phone: user.phone,
  });

  return { user: sanitizeUser(user), token, refreshToken };
}
