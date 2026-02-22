// JWT Authentication Utilities
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;
const REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  // Use a simple hash for development, use bcrypt in production
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Generate JWT token
export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Generate refresh token
export function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

// Verify JWT token
export function verifyToken(token: string): { valid: boolean; decoded?: object; error?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): object | null {
  try {
    return jwt.decode(token) as object;
  } catch {
    return null;
  }
}

// User roles
export enum UserRole {
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  CAFETERIA_MANAGER = 'CAFETERIA_MANAGER',
  CAFETERIA_COOK = 'CAFETERIA_COOK',
  DOCTOR = 'DOCTOR',
  INSTITUTION = 'INSTITUTION',
  ADMIN = 'ADMIN',
}

// Role permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.SCHOOL_ADMIN]: [
    'school:*',
    'student:*',
    'class:*',
    'health:*',
    'notification:*',
  ],
  [UserRole.CAFETERIA_MANAGER]: [
    'cafeteria:*',
    'dish:*',
    'menu:*',
    'meal_record:*',
  ],
  [UserRole.CAFETERIA_COOK]: [
    'dish:read',
    'menu:read',
    'menu_item:read',
  ],
  [UserRole.DOCTOR]: [
    'student:read',
    'health:read',
    'referral:*',
    'prescription:*',
  ],
  [UserRole.PARENT]: [
    'student:read',
    'student:write',
    'health:read',
    'menu:read',
    'meal_record:read',
    'notification:read',
    'feedback:*',
  ],
  [UserRole.STUDENT]: [
    'student:read',
    'health:read',
    'menu:read',
    'meal_record:write',
  ],
  [UserRole.INSTITUTION]: [
    'referral:read',
    'prescription:read',
  ],
};

// Check if role has permission
export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;

  // Check exact match
  if (permissions.includes(permission)) return true;

  // Check wildcard match
  const [resource, action] = permission.split(':');
  for (const p of permissions) {
    if (p === '*') return true;
    const [pResource, pAction] = p.split(':');
    if (pResource === resource && pAction === '*') return true;
    if (pResource === '*' && pAction === action) return true;
  }

  return false;
}

// Sanitize user object (remove password)
export function sanitizeUser(user: any): object {
  const { password, ...sanitized } = user;
  return sanitized;
}
