/**
 * Logger Utility
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export const createLogger = (name: string) => logger.child({ service: name });
