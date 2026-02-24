/**
 * Redis Client Utility
 *
 * Provides Redis connection for session persistence and caching
 */

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  setEx(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  rPush(key: string, value: string): Promise<void>;
  lRange(key: string, start: number, stop: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<void>;
}

// Check if REDIS_URL is configured
const redisUrl = process.env.REDIS_URL || process.env.REDIS_PORT_6379_TCP_ADDR
  ? `redis://${process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost'}:${process.env.REDIS_PORT_6379_TCP_PORT || 6379}`
  : null;

let redisClient: RedisClient | null = null;

// Initialize Redis connection
async function connectRedis(): Promise<RedisClient | null> {
  if (!redisUrl) {
    console.log('[Redis] No Redis URL configured, using in-memory fallback');
    return null;
  }

  try {
    // Dynamic import for ESM
    const ioredisModule = await import('ioredis');
    const Redis = ioredisModule.default || ioredisModule.Redis || ioredisModule;

    if (typeof Redis !== 'function') {
      throw new Error('Redis constructor not found');
    }

    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 2) return null  // 超过3次停止重试
        return Math.min(times * 500, 2000)
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    // 静默处理连接错误，Redis 是可选依赖
    client.on('error', () => {});

    await client.connect();

    redisClient = {
      get: (key) => client.get(key),
      set: async (key, value) => {
        await client.set(key, value);
      },
      setEx: async (key, seconds, value) => {
        await client.setex(key, seconds, value);
      },
      del: async (key) => {
        await client.del(key);
      },
      rPush: async (key, value) => {
        await client.rpush(key, value);
      },
      lRange: (key, start, stop) => client.lrange(key, start, stop),
      expire: async (key, seconds) => {
        await client.expire(key, seconds);
      },
    };

    console.log('[Redis] Connected successfully');
    return redisClient;
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    return null;
  }
}

// Connect on module load
connectRedis();

export { redisClient };
export type { RedisClient };
