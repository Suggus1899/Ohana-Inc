import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

export const redisPub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

let redisConnected = false;

export const initRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    await redisPub.connect();
    await redisSub.connect();
    redisConnected = true;
    console.log('✅ Redis connection established successfully.');
  } catch (error) {
    console.warn('⚠️  Redis connection failed. Real-time features will be limited:', (error as Error).message);
    redisConnected = false;
  }
};

export const isRedisConnected = (): boolean => redisConnected;

export const closeRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
    redisConnected = false;
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
};
